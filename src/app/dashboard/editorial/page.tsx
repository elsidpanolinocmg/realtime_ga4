// src/app/dashboard/editorial/page.tsx
"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const BrandDashboard = dynamic(() => import("@/src/components/BrandDashboard"), { ssr: false });

export default function EditorialPage() {
  const [brands, setBrands] = useState<{ brand: string; siteConfig: any }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const ROTATION_INTERVAL_MS = 60_000;

  useEffect(() => {
    const fetchBrands = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.JSON_PROVIDER_URL;
      const res = await fetch(`${baseUrl}/api/json-provider/dashboard-config/brand-all-properties?filter[editorial]=true`);
      const config = await res.json();
      const brandList = Object.entries(config).map(([brand, siteConfig]) => ({ brand, siteConfig }));
      setBrands(brandList);
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!brands.length) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % brands.length), ROTATION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [brands]);

  if (!brands.length) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  const currentBrand = brands[currentIndex];
  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden">
      <BrandDashboard
        brand={currentBrand.brand}
        siteConfig={currentBrand.siteConfig}
        speed={100}
        themeColor={true}
      />
    </div>
  );
}
