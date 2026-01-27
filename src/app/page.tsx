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
    <div className="bg-transparent min-h-screen flex items-start sm:items-center justify-center flex-col gap-4 px-2 py-8">
      <h1>CMG GA4 Dashboard</h1>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-10">
          <div className="flex w-4xs flex-col items-start">
            <h2 className="font-semibold">Active Last 365 Days</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {BRANDS.map((brand) => (
                <li key={`last365-${brand}`}>
                  <Link
                    href={`/active-365/${brand}`}
                    className="hover:underline"
                  >
                    {brand.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex w-4xs flex-col items-start">
            <h2 className="font-semibold">Active Last 30 Days</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {BRANDS.map((brand) => (
                <li key={`last30-${brand}`}>
                  <Link
                    href={`/active-30/${brand}`}
                    className="hover:underline"
                  >
                    {brand.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex w-4xs flex-col items-start">
            <h2 className="font-semibold">Active Today</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {BRANDS.map((brand) => (
                <li key={`today-${brand}`}>
                  <Link
                    href={`/active-today/${brand}`}
                    className="hover:underline"
                  >
                    {brand.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ACTIVE NOW */}
          <div className="flex w-4xs flex-col items-start">
            <h2 className="font-semibold">Active Now</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {BRANDS.map((brand) => (
                <li key={`now-${brand}`}>
                  <Link
                    href={`/active-users/${brand}`}
                    className="hover:underline"
                  >
                    {brand.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link href="/all-active" className="hover:underline">
          View all
        </Link>

      </div>
    </div>
  );
}
