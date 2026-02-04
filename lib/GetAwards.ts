import * as cheerio from "cheerio";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.JSON_PROVIDER_URL;

/* ---------------- TYPES ---------------- */
export interface Brand {
  brand: string;
  name: string;
  url: string;
}

export interface Award {
  id: string;
  brand: string;
  title: string;
  field_date: string;
  view_node: string;
  startDate?: string | null;
  endDate?: string | null;
  image?: string;
}

/* ---------------- HELPERS ---------------- */
function normalizeTitle(str?: string) {
  if (!str) return "";
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getBestSrcFromSrcset(srcset?: string) {
  if (!srcset) return undefined;
  return srcset.split(",").map((s) => s.trim().split(" ")[0]).pop();
}

async function safeFetch(url: string) {
  console.log("[SAFE FETCH]", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed fetch: ${url} (${res.status})`);
  return res;
}

/* ---------------- FETCH BRANDS ---------------- */
async function fetchBrands(): Promise<Brand[]> {
  const res = await safeFetch(`${BASE_URL}/api/json-provider/dashboard-config/brand-all-properties`);
  const config = await res.json();
  return Object.entries(config)
    .filter(([, site]: any) => site?.awards && site?.url)
    .map(([brand, site]: any) => ({ brand, ...site }));
}

/* ---------------- FETCH IMAGE MAP ---------------- */
async function fetchAwardImagesMap(siteUrl: string): Promise<Record<string, string>> {
  console.log("[IMAGE MAP] Fetching:", siteUrl);
  try {
    const html = await safeFetch(`${siteUrl}/awards`).then((r) => r.text());
    const $ = cheerio.load(html);
    const map: Record<string, string> = {};

    // Drupal layout
    $(".view-content .item.with-border-bottom").each((_, el) => {
      const title = $(el).find(".item__title a").text()?.trim();
      if (!title) return;

      let img =
        getBestSrcFromSrcset($(el).find("img").attr("data-srcset")) ||
        getBestSrcFromSrcset($(el).find("img").attr("srcset")) ||
        $(el).find("img").attr("data-src") ||
        $(el).find("img").attr("src");

      if (img && !img.startsWith("http")) img = new URL(img, siteUrl).href;
      if (img) map[normalizeTitle(title)] = img;
    });

    // Elementor image-box
    $(".elementor-widget-image-box").each((_, el) => {
      const title = $(el).find(".elementor-image-box-title").text()?.trim();
      if (!title) return;

      let img =
        getBestSrcFromSrcset($(el).find("img").attr("srcset")) ||
        $(el).find("img").attr("data-src") ||
        $(el).find("img").attr("data-lazy-src") ||
        $(el).find("img").attr("src");

      if (img && !img.startsWith("http")) img = new URL(img, siteUrl).href;
      if (img) map[normalizeTitle(title)] = img;
    });

    // Generic Elementor image widget
    $(".elementor-widget-image").each((_, el) => {
      const title = $(el).find("a").attr("title") || $(el).find("img").attr("alt");
      if (!title) return;

      let img =
        getBestSrcFromSrcset($(el).find("img").attr("srcset")) ||
        $(el).find("img").attr("data-src") ||
        $(el).find("img").attr("data-lazy-src") ||
        $(el).find("img").attr("src");

      if (img && !img.startsWith("http")) img = new URL(img, siteUrl).href;
      if (img) map[normalizeTitle(title.trim())] = img;
    });

    return map;
  } catch (err) {
    console.error("[IMAGE MAP FAILED]", siteUrl, err);
    return {};
  }
}

/* ---------------- MAIN FUNCTION ---------------- */
export async function getAwards(): Promise<Award[]> {
  const startTime = Date.now();
  console.log("[SCRAPE START]");

  try {
    const brands = await fetchBrands();
    console.log("[BRANDS] Found:", brands.length);

    // Fetch raw awards
    const awardsRawArr = await Promise.all(
      brands.map(async (b) => {
        try {
          const res = await safeFetch(`${b.url}/node/content-menu/awards.json`);
          const json = await res.json();
          return Array.isArray(json) ? json : [];
        } catch {
          console.warn("[BRAND FAILED]", b.brand);
          return [];
        }
      })
    );

    let awardsRaw = awardsRawArr.flat();

    // Attach brand + ID
    awardsRaw = awardsRaw.map((a: any, idx: number) => {
      const brand = brands.find((b) =>
        normalizeTitle(a.view_node).startsWith(normalizeTitle(b.url))
      );
      return { ...a, id: a.view_node || `award-${idx}`, brand: brand?.brand || "unknown" };
    });

    // Deduplicate
    const uniqueMap = new Map<string, Award>();
    for (const a of awardsRaw) {
      if (!a.title || !a.field_date) continue;
      const key = normalizeTitle(a.title) + "_" + new Date(a.field_date).toISOString().split("T")[0];
      if (!uniqueMap.has(key)) uniqueMap.set(key, a);
    }

    const uniqueAwards = Array.from(uniqueMap.values());
    console.log("[AWARDS] Unique:", uniqueAwards.length);

    // Fetch nomination dates
    const awardsWithDates = await Promise.all(
      uniqueAwards.map(async (award) => {
        try {
          const html = await safeFetch(award.view_node).then((r) => r.text());
          const $ = cheerio.load(html);
          return {
            ...award,
            startDate: $(".nomination-date .start-date").attr("date") || null,
            endDate: $(".nomination-date .end-date").attr("date") || null,
          };
        } catch {
          return { ...award, startDate: null, endDate: null };
        }
      })
    );

    // Fetch image maps
    const imageMapsArr = await Promise.all(brands.map((b) => fetchAwardImagesMap(b.url)));
    const brandImageMaps: Record<string, Record<string, string>> = {};
    brands.forEach((b, i) => (brandImageMaps[b.brand] = imageMapsArr[i] || {}));

    // Map images
    const awardsWithImages = awardsWithDates.map((a) => {
      const brandMap = brandImageMaps[a.brand];
      if (!brandMap) return a;

      const normalized = normalizeTitle(a.title);
      for (const [scrapedTitle, img] of Object.entries(brandMap)) {
        if (scrapedTitle.includes(normalized) || normalized.includes(scrapedTitle)) {
          return { ...a, image: img };
        }
      }
      return a;
    });

    // Sort by date
    awardsWithImages.sort(
      (a, b) => new Date(a.field_date).getTime() - new Date(b.field_date).getTime()
    );

    console.log("[SCRAPE DONE] Total awards:", awardsWithImages.length, "Time:", (Date.now() - startTime) / 1000, "sec");
    return awardsWithImages;
  } catch (err) {
    console.error("[SCRAPE FAILED]", err);
    return [];
  }
}
