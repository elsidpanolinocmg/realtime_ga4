import * as cheerio from "cheerio";

const BASE_URL =
  process.env.JSON_PROVIDER_URL ||
  process.env.NEXT_PUBLIC_BASE_URL;

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
  image?: string; // final image to show
}

/* ---------------- GET BRANDS ---------------- */
export async function getAwardBrands(): Promise<Brand[]> {
  const res = await fetch(`${BASE_URL}/api/json-provider/dashboard-config/brand-all-properties?cache=false`, {
    next: { revalidate: 300 },
  });
  const config = await res.json();

  return Object.entries(config)
    .filter(([, site]: any) => site?.awards && site?.url)
    .map(([brand, site]: any) => ({
      brand,
      ...site,
    }));
}

/* ---------------- FETCH IMAGES FROM AWARD PAGES ---------------- */
async function fetchAwardImagesMap(siteUrl: string) {
  try {
    const html = await fetch(`${siteUrl}/awards`, { next: { revalidate: 300 } }).then(r => r.text());
    const $ = cheerio.load(html);
    const map: Record<string, string> = {};

    $(".view-content .item.with-border-bottom").each((_, el) => {
      const link = $(el).find(".item__title a").attr("href");
      const img = $(el).find("img").attr("data-srcset")?.split(" ")[0] || $(el).find("img").attr("src");
      if (link && img) map[link.trim()] = img;
    });

    return map;
  } catch {
    return {};
  }
}

/* ---------------- FETCH NOMINATION DATES ---------------- */
async function fetchNominationDates(viewNode: string) {
  try {
    const html = await fetch(viewNode, { next: { revalidate: 300 } }).then(r => r.text());
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

/* ---------------- MAIN AGGREGATOR ---------------- */
export async function getAwards(): Promise<Award[]> {
  const brands = await getAwardBrands();

  // Fetch raw awards safely; fallback to empty array if invalid JSON
  const requests = brands.map(async b => {
    try {
      const res = await fetch(`${b.url}/node/content-menu/awards.json`, { next: { revalidate: 300 } });
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch {
      return [];
    }
  });

  let awardsRaw: any[] = (await Promise.all(requests)).flat();

  // Attach id and brand
  awardsRaw = awardsRaw.map((a, idx) => {
    const brand = brands.find(b => a.view_node?.startsWith(b.url));
    return {
      ...a,
      id: a.view_node || `award-${idx}`,
      brand: brand?.brand || "sbr",
    };
  });

  // Enrich with nomination dates
  const awardsWithDates = await Promise.all(
    awardsRaw.map(async award => {
      const dates = await fetchNominationDates(award.view_node);
      return { ...award, ...dates };
    })
  );

  // Fetch images from award pages
  const imageMaps = await Promise.all(brands.map(b => fetchAwardImagesMap(b.url)));
  const allImagesMap = Object.assign({}, ...imageMaps);

  // Sort by award date
  awardsWithDates.sort((a, b) => new Date(a.field_date).getTime() - new Date(b.field_date).getTime());

  // Final mapping: use page image if exists, else use brand image from JSON
  return awardsWithDates.map(a => ({
    ...a,
    image: allImagesMap[a.view_node] || a.brandImage || "",
  }));
}