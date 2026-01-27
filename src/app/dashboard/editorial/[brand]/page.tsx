interface BrandPageProps {
  params: { brand: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { brand } = params;
  const sp = searchParams ?? {};
  const speed = Number(sp.speed ?? 100);
  const themeColor = sp["theme-color"] === "true" || sp["theme-color"] === "1";

  const baseUrl = process.env.JSON_PROVIDER_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("JSON_PROVIDER_URL or NEXT_PUBLIC_BASE_URL must be set");

  const apiUrl = `${baseUrl}/api/json-provider/dashboard-config/brand-all-properties?filter[editorial]=true`;
  const res = await fetch(apiUrl);
  const config = await res.json();
  const siteConfig = config[brand] || config["sbr"];

  return (
    <div>
      <h1>{siteConfig.name}</h1>
      <p>Speed: {speed}</p>
      <p>Theme Color: {themeColor ? "Yes" : "No"}</p>
    </div>
  );
}
