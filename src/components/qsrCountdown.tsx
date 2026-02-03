"use client";

import Countdown from ".@src/components/Countdown";

export interface Award {
  title: string;
  view_node: string;
  field_date: string;
  startDate?: string | null;
  endDate?: string | null;
  image?: string;
}

interface AwardsGridProps {
  awards: Award[];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AwardsGridClient({ awards }: AwardsGridProps) {
  const now = new Date();

  // Only upcoming awards
  const upcomingAwards = awards.filter(
    award => new Date(award.field_date) > now
  );

  return (
    <div className="flex flex-col justify-center h-full">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-white text-center">
            <th className="p-1">Award</th>
            <th className="p-1">Nomination Opens</th>
            <th className="p-1">Nomination Closes</th>
            <th className="p-1">Awards Presentation</th>
          </tr>
        </thead>

        <tbody>
          {upcomingAwards.map((award, idx) => (
            <tr key={award.view_node || idx} className="text-center">

              {/* Award Title + Image */}
              <td className="flex items-center gap-2 p-1 justify-start">
                {award.image && (
                  <img
                    src={award.image}
                    alt={award.title}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <span
                  dangerouslySetInnerHTML={{ __html: award.title }}
                />
              </td>

              {/* Nomination Opens */}
              <td className="p-1">
                <Countdown
                  target={award.startDate}
                  done="Nomination Opened"
                />
              </td>

              {/* Nomination Closes */}
              <td className="p-1">
                <Countdown
                  target={award.endDate}
                  done="Nomination Closed"
                />
              </td>

              {/* Awards Presentation */}
              <td className="p-1">
                <Countdown
                  target={award.field_date}
                  done="Awards Finished"
                />
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
