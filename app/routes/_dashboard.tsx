import { Outlet } from "react-router";
import type { Route } from "./+types/_dashboard";
import { DashboardLayout } from "~/components/layout";
import { RouteErrorBoundary } from "~/components/ui";
import { requireUser } from "~/lib/auth";
import { isUserAdmin } from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, headers } = await requireUser(request);
  const isAdmin = await isUserAdmin({ discordId: user.id });

  return Response.json({ user, isAdmin }, { headers });
}

export default function DashboardLayoutRoute({
  loaderData,
}: Route.ComponentProps) {
  const { user, isAdmin } = loaderData;

  return (
    <DashboardLayout user={user} isAdmin={isAdmin}>
      <Outlet context={{ user, isAdmin }} />
    </DashboardLayout>
  );
}

export function ErrorBoundary() {
  return (
    <RouteErrorBoundary
      backPath="/"
      backLabel="Go Home"
      notFoundMessage="The dashboard page you're looking for doesn't exist."
    />
  );
}
