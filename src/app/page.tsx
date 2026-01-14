import Link from "next/link";

const BRANDS = [
  "sbr",
  "hkb",
  "abf",
  "abr",
  "ia",
  "ra",
  "ap",
  "hca",
  "qsr",
  "qsr-asia",
  "qsr-aus",
  "qsr-uk",
];

export default function Home() {
  return (
    <div className="bg-transparent min-h-screen flex items-center justify-center flex-col gap-4">
      <h1>CMG GA4 Dashboard</h1>
      <div className="flex gap-10">
        <div className="flex flex-col items-start gap-2">
          <h2 className="font-semibold">Active Today</h2>
          <ul className="flex flex-col gap-1">
            {BRANDS.map((brand) => (
              <li key={`today-${brand}`}>
                <Link
                  href={`/active-today/${brand}?color=white`}
                  className="hover:underline"
                >
                  {brand.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ACTIVE NOW */}
        <div className="flex flex-col items-start gap-2">
          <h2 className="font-semibold">Active Now</h2>
          <ul className="flex flex-col gap-1">
            {BRANDS.map((brand) => (
              <li key={`now-${brand}`}>
                <Link
                  href={`/active-users/${brand}?color=white`}
                  className="hover:underline"
                >
                  {brand.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
