import BrandDashboard from "@/src/components/BrandDashboard";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  // ✅ unwrap params
  const { brand } = await params;

  // ✅ unwrap searchParams safely
  const sp = (await searchParams) ?? {};

  const stripspeed = Number(sp.stripspeed ?? 100);
  const themeColor =
    sp["theme-color"] === "true" || sp["theme-color"] === "1";

  const baseUrl =
    process.env.JSON_PROVIDER_URL || process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "JSON_PROVIDER_URL or NEXT_PUBLIC_BASE_URL must be set"
    );
  }

  async function fetchBrandConfig(targetBrand: string) {
    const apiUrl = `${baseUrl}/api/json-provider/dashboard-config/brand-all-properties/${targetBrand}`;

    const res = await fetch(apiUrl, { cache: "no-store" });

    if (!res.ok) return null;

    return res.json();
  }

  let siteConfig = await fetchBrandConfig(brand);

  if (!siteConfig) {
    siteConfig = await fetchBrandConfig("sbr");
  }

  if (!siteConfig) {
    throw new Error("Failed to load brand configuration");
  }

  return (
    <BrandDashboard
      brand={brand}
      siteConfig={siteConfig}
      stripspeed={stripspeed}
    />
  );
}
