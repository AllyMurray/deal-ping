import type { Route } from "./+types/index";
import { DashboardHomePage, type DashboardStats } from "~/pages/dashboard";
import { requireUser } from "~/lib/auth";
import { getChannelsByUser, getConfigsByUser } from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  const [channels, configs] = await Promise.all([
    getChannelsByUser({ userId: user.id }),
    getConfigsByUser({ userId: user.id }),
  ]);

  const stats: DashboardStats = {
    channelCount: channels.length,
    configCount: configs.length,
    enabledConfigCount: configs.filter((c) => c.enabled).length,
  };

  return { stats };
}

export default function DashboardIndex({ loaderData }: Route.ComponentProps) {
  return <DashboardHomePage stats={loaderData.stats} />;
}
