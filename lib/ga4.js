import { BetaAnalyticsDataClient } from "@google-analytics/data";

export function getGAClient() {
  return new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  });
}
