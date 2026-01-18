import type { Route } from "./+types/index";
import { DashboardHomePage, type DashboardStats } from "~/pages/dashboard";
import { requireUser } from "~/lib/auth";
import {
  getChannelsByUser,
  getConfigsByUser,
  getDealsBySearchTerm,
} from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  const [channels, configs] = await Promise.all([
    getChannelsByUser({ userId: user.id }),
    getConfigsByUser({ userId: user.id }),
  ]);

  // Calculate today's start timestamp
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTime = startOfDay.getTime();

  // Fetch deals from today for all channel+searchTerm combinations in parallel
  // Deals are now stored per-channel, so we query each config separately
  const dealResults = await Promise.all(
    configs.map((config) =>
      getDealsBySearchTerm({
        channelId: config.channelId,
        searchTerm: config.searchTerm,
        startTime: startOfDayTime,
        limit: 100,
      })
    )
  );
  const dealsToday = dealResults.flat().length;

  const stats: DashboardStats = {
    channelCount: channels.length,
    configCount: configs.length,
    enabledConfigCount: configs.filter((c) => c.enabled).length,
    dealsToday,
  };

  return { stats };
}

export default function DashboardIndex({ loaderData }: Route.ComponentProps) {
  return <DashboardHomePage stats={loaderData.stats} />;
}
