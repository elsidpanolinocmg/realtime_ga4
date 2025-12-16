// app/active-today/[brand]/page.tsx
import React from "react";
import OdometerToday from "@/src/components/OdometerToday";

interface SearchParams {
  fontSize?: string;
  bold?: string;
  color?: string;
  backgroundColor?: string;
  intervalms?: string;
}

interface Props {
  params: Promise<{ brand: string }>;        // 🔴 Promise
  searchParams: Promise<SearchParams>;       // 🔴 Promise (same as working file)
}

const RealtimeActiveBrand = async ({ params, searchParams }: Props) => {
  // ✅ unwrap BOTH, same pattern as your working page
  const { brand } = await params;
  const sp = await searchParams;

  const fontSize = sp.fontSize || "3rem";
  const bold = sp.bold === "true";
  const color = sp.color || "#010101";
  const backgroundColor = sp.backgroundColor || "#ffffff00";
  const intervalms = sp.intervalms
    ? Number(sp.intervalms): 600000;

  return (
    <div
      style={{ backgroundColor }}
      className="bg-transparent min-h-screen flex items-center justify-center"
    >
      <OdometerToday
        fetchUrl={`/api/active-today/${brand}`}
        fontSize={fontSize}
        bold={bold}
        color={color}
        backgroundColor={backgroundColor}
        intervalms={intervalms}
      />
    </div>
  );
};

export default RealtimeActiveBrand;
