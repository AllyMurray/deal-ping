import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // Auth routes
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  route("auth/logout", "routes/auth/logout.tsx"),
  // Protected dashboard routes
  layout("routes/_dashboard.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    // Channel management
    route("dashboard/channels", "routes/dashboard/channels/index.tsx"),
    route("dashboard/channels/new", "routes/dashboard/channels/new.tsx"),
    route("dashboard/channels/:id", "routes/dashboard/channels/$id.tsx"),
    route("dashboard/channels/:id/edit", "routes/dashboard/channels/$id.edit.tsx"),
    // Deal history
    route("dashboard/deals", "routes/dashboard/deals.tsx"),
    // Admin (allowlist management)
    route("dashboard/admin", "routes/dashboard/admin.tsx"),
    // Settings
    route("dashboard/settings", "routes/dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
