// app/active-today/page.tsx
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
  searchParams: Promise<SearchParams>; // it's a Promise now
}

const RealtimeActive = async ({ searchParams }: Props) => {
  const params = await searchParams; // unwrap the Promise

  const fontSize = params.fontSize || "3rem";
  const bold = params.bold === "true";
  const color = params.color || "#010101";
  const backgroundColor = params.backgroundColor || "#ffffff00";
  const intervalms = params.intervalms
    ? Number(params.intervalms): 600000;

  return (
    <div
        style={{ backgroundColor }}
        className="bg-transparent min-h-screen flex items-center justify-center">
      <OdometerToday
        fetchUrl="/api/active-today"
        fontSize={fontSize}
        bold={bold}
        color={color}
        backgroundColor={backgroundColor}
        intervalms={intervalms}
      />
    </div>
  );
};

export default RealtimeActive;