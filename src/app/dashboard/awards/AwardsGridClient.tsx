"use client";

import Countdown from "./Countdown";

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

/* ---------- Submission Status Helpers ---------- */

function getSubmissionOpen(startDate?: string | null) {
  if (!startDate) return "Submission Closed";

  const now = new Date();
  const start = new Date(startDate);

  if (start > now) {
    return <Countdown target={startDate} done="Submission Open" />;
  }

  return "Submission Open";
}

function getSubmissionClose(endDate?: string | null) {
  if (!endDate) return "Submission Closed";

  const now = new Date();
  const end = new Date(endDate);

  if (end > now) {
    return <Countdown target={endDate} done="Submission Closed" />;
  }

  return "Submission Closed";
}

/* ---------- Component ---------- */

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
            <th className="p-1">Award Title</th>
            <th className="p-1">Awards Night</th>
            <th className="p-1">Awards Night Starts In</th>
            <th className="p-1">Submission Open In</th>
            <th className="p-1">Submission Close In</th>
          </tr>
        </thead>

        <tbody>
          {upcomingAwards.map((award, idx) => (
            <tr key={award.id || idx} className="text-center">

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

              {/* Awards Night Date */}
              <td className="p-1">
                {formatDate(award.field_date)}
              </td>

              {/* Awards Night Countdown */}
              <td className="p-1">
                <Countdown
                  target={award.field_date}
                  done="Awards Ended"
                />
              </td>

              {/* Submission Open */}
              <td className="p-1">
                {getSubmissionOpen(award.startDate)}
              </td>

              {/* Submission Close */}
              <td className="p-1">
                {getSubmissionClose(award.endDate)}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
