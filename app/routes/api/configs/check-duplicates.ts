import type { Route } from "./+types/check-duplicates";
import { requireUser } from "~/lib/auth";
import { findDuplicateSearchTerms } from "~/db/repository.server";

// GET /api/configs/check-duplicates?searchTerm=xxx&channelId=yyy
export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("searchTerm");
  const channelId = url.searchParams.get("channelId");

  if (!searchTerm) {
    return Response.json(
      { error: "searchTerm query parameter is required" },
      { status: 400 }
    );
  }

  const duplicates = await findDuplicateSearchTerms({
    searchTerm: searchTerm.trim(),
    excludeChannelId: channelId || undefined,
    userId: user.id,
  });

  return Response.json({ duplicates });
}
