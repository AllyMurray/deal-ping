import type { Route } from "./+types/search-terms";
import {
  SearchTermsPage,
  type SearchTermWithChannel,
} from "~/pages/dashboard";
import { RouteErrorBoundary } from "~/components/ui";
import { requireUser } from "~/lib/auth";
import {
  getChannelsByUser,
  getConfigsByChannel,
} from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  // Get all channels for the user
  const channels = await getChannelsByUser({ userId: user.id });

  // Get all configs for each channel and build the combined list
  const searchTermsWithChannel: SearchTermWithChannel[] = [];

  await Promise.all(
    channels.map(async (channel) => {
      const configs = await getConfigsByChannel({ channelId: channel.channelId });
      configs.forEach((config) => {
        searchTermsWithChannel.push({
          searchTerm: config.searchTerm,
          channelId: channel.channelId,
          channelName: channel.name,
          enabled: config.enabled,
          includeKeywords: config.includeKeywords ?? [],
          excludeKeywords: config.excludeKeywords ?? [],
          maxPrice: config.maxPrice,
          minDiscount: config.minDiscount,
        });
      });
    })
  );

  // Sort by search term alphabetically
  searchTermsWithChannel.sort((a, b) =>
    a.searchTerm.toLowerCase().localeCompare(b.searchTerm.toLowerCase())
  );

  return { searchTerms: searchTermsWithChannel };
}

export default function SearchTerms({ loaderData }: Route.ComponentProps) {
  return <SearchTermsPage searchTerms={loaderData.searchTerms} />;
}

export function ErrorBoundary() {
  return (
    <RouteErrorBoundary
      backPath="/dashboard"
      backLabel="Back to Dashboard"
      errorMessage="Failed to load search terms. Please try again."
    />
  );
}
