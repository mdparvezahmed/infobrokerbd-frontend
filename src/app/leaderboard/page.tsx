import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Leaderboard } from "./Leaderboard";

export const metadata: Metadata = pageMetadata({
  title: "Top Contributors",
  description: "The people sharing the most helpful local reviews and tips across Bangladesh on InfoBrokerBD — this week, this month and of all time.",
  path: "/leaderboard",
});

export default function LeaderboardPage() {
  return <Leaderboard />;
}
