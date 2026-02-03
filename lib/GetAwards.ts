import * as cheerio from "cheerio";

const BASE_URL = process.env.JSON_PROVIDER_URL || process.env.NEXT_PUBLIC_SITE_URL;

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

// Normalize title for deduplication and image matching
function normalizeTitle(str?: string) {
  if (!str) return "";
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Choose best image from srcset
function getBestSrcFromSrcset(srcset?: string) {
  if (!srcset) return undefined;
  return srcset.split(",").map((s) => s.trim().split(" ")[0]).pop();
}

// Safe fetch with User-Agent to avoid 401
async function safeFetch(url: string) {
  return fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "application/json",
    },
    cache: "no-store",
  });
}

/* ---------------- GET BRANDS ---------------- */

export async function getAwardBrands(): Promise<Brand[]> {
  const res = await safeFetch(`${BASE_URL}/api/json-provider/dashboard-config/brand-all-properties`);
  console.log("Brand fetch status:", res.status);
  const config = await res.json();

  return Object.entries(config)
    .filter(([, site]: any) => site?.awards && site?.url)
    .map(([brand, site]: any) => ({ brand, ...site }));
}

/* ---------------- FETCH IMAGE MAP ---------------- */

async function fetchAwardImagesMap(siteUrl: string) {
  try {
    const html = await safeFetch(`${siteUrl}/awards`).then((r) => r.text());
    const $ = cheerio.load(html);
    const map: Record<string, string> = {};

    // Standard awards
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

    // Elementor fallback
    $(".elementor-widget-image").each((_, el) => {
      const title = $(el).find("a").attr("title")?.trim() || $(el).find("a").text()?.trim();
      if (!title) return;

      let img =
        getBestSrcFromSrcset($(el).find("img").attr("srcset")) ||
        $(el).find("img").attr("data-src") ||
        $(el).find("img").attr("src");

      if (img && !img.startsWith("http")) img = new URL(img, siteUrl).href;
      if (img) map[normalizeTitle(title)] = img;
    });

    return map;
  } catch {
    return {};
  }
}

/* ---------------- FETCH NOMINATION DATES ---------------- */

async function fetchNominationDates(viewNode: string) {
  try {
    const html = await safeFetch(viewNode).then((r) => r.text());
    const $ = cheerio.load(html);

    const start = $(".nomination-date .start-date").attr("date");
    const end = $(".nomination-date .end-date").attr("date");

    return {
      startDate: start ? new Date(start).toISOString() : null,
      endDate: end ? new Date(end).toISOString() : null,
    };
  } catch {
    return { startDate: null, endDate: null };
  }
}

/* ---------------- MAIN FUNCTION ---------------- */

export async function getAwards(): Promise<Award[]> {
  const brands = await getAwardBrands();

  // Fetch all raw awards JSON
  const awardsRawArr = await Promise.all(
    brands.map(async (b) => {
      try {
        const res = await safeFetch(`${b.url}/node/content-menu/awards.json`);
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      } catch {
        return [];
      }
    })
  );

  let awardsRaw = awardsRawArr.flat();

  // Attach brand + id
  awardsRaw = awardsRaw.map((a: any, idx: number) => {
    const brand = brands.find((b) => normalizeTitle(a.view_node).startsWith(normalizeTitle(b.url)));
    return { ...a, id: a.view_node || `award-${idx}`, brand: brand?.brand || "sbr" };
  });

  // Remove duplicates by normalized title + date
  const uniqueMap = new Map<string, Award>();
  for (const a of awardsRaw) {
    if (!a.title || !a.field_date) continue;
    const key = normalizeTitle(a.title) + "_" + new Date(a.field_date).toISOString().split("T")[0];
    if (!uniqueMap.has(key)) uniqueMap.set(key, a);
  }
  const uniqueAwards = Array.from(uniqueMap.values());

  // Fetch nomination dates
  const awardsWithDates = await Promise.all(
    uniqueAwards.map(async (award) => {
      const dates = await fetchNominationDates(award.view_node);
      return { ...award, ...dates };
    })
  );

  // Fetch images per brand
  const imageMapsArr = await Promise.all(brands.map((b) => fetchAwardImagesMap(b.url)));
  const brandImageMaps: Record<string, Record<string, string>> = {};
  brands.forEach((b, i) => (brandImageMaps[b.brand] = imageMapsArr[i] || {}));

  // Map images
  const awardsWithImages = awardsWithDates.map((a) => {
    const brandMap = brandImageMaps[a.brand];
    if (!brandMap) return a;

    const normalizedAward = normalizeTitle(a.title);
    let image: string | undefined;

    for (const [scrapedTitle, scrapedImg] of Object.entries(brandMap)) {
      if (scrapedTitle.includes(normalizedAward) || normalizedAward.includes(scrapedTitle)) {
        image = scrapedImg;
        break;
      }
    }

    return { ...a, image };
  });

  // Sort by field_date
  awardsWithImages.sort(
    (a, b) => new Date(a.field_date).getTime() - new Date(b.field_date).getTime()
  );

  console.log("Final Awards Count:", awardsWithImages.length);

  return awardsWithImages;
}
