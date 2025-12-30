import { useState } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/bookmarks";
import { BookmarksPage } from "~/pages/dashboard";
import { RouteErrorBoundary } from "~/components/ui";
import { requireUser } from "~/lib/auth";
import { getBookmarksByUser, deleteBookmarkByDeal } from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  const bookmarks = await getBookmarksByUser({ userId: user.id });

  return {
    bookmarks: bookmarks.map((b) => ({
      id: b.bookmarkId,
      dealId: b.dealId,
      title: b.title,
      link: b.link,
      price: b.price,
      merchant: b.merchant,
      searchTerm: b.searchTerm,
      bookmarkedAt: b.bookmarkedAt,
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const dealId = formData.get("dealId") as string;

  if (intent === "remove") {
    await deleteBookmarkByDeal({ userId: user.id, dealId });
    return { success: true, dealId };
  }

  return { error: "Invalid intent" };
}

export default function Bookmarks({ loaderData }: Route.ComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const removeFetcher = useFetcher();

  // Get the deal ID currently being removed (for optimistic UI)
  const removeLoadingId = removeFetcher.state !== "idle"
    ? (removeFetcher.formData?.get("dealId") as string)
    : undefined;

  // Filter out bookmarks that are being removed (optimistic update)
  const bookmarks = loaderData.bookmarks.filter((b) => {
    if (removeFetcher.formData) {
      const removingDealId = removeFetcher.formData.get("dealId") as string;
      if (b.dealId === removingDealId) {
        return false;
      }
    }
    return true;
  });

  const handleRemoveBookmark = (dealId: string) => {
    removeFetcher.submit(
      { intent: "remove", dealId },
      { method: "POST" }
    );
  };

  return (
    <BookmarksPage
      bookmarks={bookmarks}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onRemoveBookmark={handleRemoveBookmark}
      removeLoadingId={removeLoadingId}
    />
  );
}

export function ErrorBoundary() {
  return (
    <RouteErrorBoundary
      backPath="/dashboard"
      backLabel="Back to Dashboard"
      errorMessage="Failed to load bookmarks. Please try again."
    />
  );
}
