# CLAUDE.md

This file provides guidance for Claude Code when working on this repository.

## Project Overview

DealPing is a Discord notification system for HotUKDeals. It monitors deal listings and sends notifications to Discord channels via webhooks. The project consists of:

- **Web Dashboard**: React Router v7 app with Discord OAuth for managing channels and viewing deals
- **Notifier Lambda**: AWS Lambda that periodically fetches deals and sends Discord notifications
- **CLI Tool**: Command-line interface for managing configurations

## Tech Stack

- **Frontend**: React 19, React Router v7, Mantine UI, TypeScript
- **Backend**: AWS Lambda, DynamoDB (single-table design with ElectroDB)
- **Infrastructure**: SST v3 (Infrastructure as Code)
- **Authentication**: Discord OAuth via OpenAuth
- **Testing**: Vitest, React Testing Library

## Project Structure

```
app/                    # React Router web application
├── components/         # Reusable UI components (organized by feature)
│   ├── channels/       # Channel management components
│   ├── configs/        # Search term config components
│   ├── deals/          # Deal display components
│   ├── notifications/  # Notification preview components
│   ├── layout/         # Layout components
│   └── ui/             # Generic UI components
├── pages/              # Page components (presentational)
│   └── dashboard/      # Dashboard page components
├── routes/             # Route handlers (loaders/actions)
│   ├── api/            # API route handlers
│   ├── auth/           # Authentication routes
│   └── dashboard/      # Dashboard routes
├── lib/                # Shared utilities
│   └── auth/           # Auth helpers
└── db/                 # Database repository (app-side)

src/                    # Lambda and shared code
├── db/                 # Database layer
│   ├── entities/       # ElectroDB entity definitions
│   ├── schemas.ts      # Zod schemas for all entities
│   ├── repository.ts   # Data access functions
│   └── service.ts      # ElectroDB service
├── notifier.ts         # Main Lambda handler
├── feed-parser.ts      # HotUKDeals scraper
└── discord-types.ts    # Discord webhook types

infra/                  # SST infrastructure definitions
scripts/                # CLI tools
docs/                   # Documentation
```

## Commands

```bash
# Development
pnpm install            # Install dependencies
pnpm dev                # Start SST dev mode (runs Lambda + web app locally)

# Testing
pnpm test               # Run tests in watch mode
pnpm test:run           # Run tests once
pnpm test:coverage      # Run tests with coverage

# Type checking
pnpm typecheck          # Run TypeScript type checking

# CLI tools
pnpm feed-parser <term> # Test the deal scraper
pnpm manage-config      # CLI for managing configurations
```

## Code Conventions

### Component Structure

- **Routes** (`app/routes/`): Handle data loading (loaders) and mutations (actions). Keep minimal UI logic.
- **Pages** (`app/pages/`): Presentational components that receive data from routes.
- **Components** (`app/components/`): Reusable UI components, organized by feature domain.

### Testing Patterns

- Test files are co-located with source files using `.test.ts(x)` suffix
- Use `~/test-utils` for rendering components (provides Mantine and Router context)
- Use `data-testid` attributes for test selectors
- Mock external dependencies in tests

Example test:
```typescript
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "~/test-utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByTestId("my-component")).toBeInTheDocument();
  });
});
```

### Database Patterns

- All entity types are inferred from Zod schemas using `z.infer<typeof Schema>`
- Schemas defined in `src/db/schemas.ts` - types should be imported from here, not manually defined
- ElectroDB entities in `src/db/entities/`
- Repository functions in `src/db/repository.ts` (Lambda) and `app/db/repository.server.ts` (web app)
- Prices stored in pence (integer), converted to pounds for display

### Path Aliases

- `~/` maps to `./app/` (configured in tsconfig.json)

### React Router Data Patterns

This project uses React Router v7 with data routers. Follow these patterns:

**For mutations from components:**
- Use `useFetcher` hook to submit to the current route's action
- Use an `intent` field to distinguish between different actions
- Access response via `fetcher.data` and loading state via `fetcher.state`

```typescript
// In route file action:
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "validate") {
    // Handle validation
    return { intent: "validate", valid: true };
  }

  // Handle main form submission
  return redirect("/success");
}

// In component:
const fetcher = useFetcher<ResponseType>();
fetcher.submit({ intent: "validate", data: "value" }, { method: "POST" });
// Use fetcher.state === "submitting" for loading, fetcher.data for result
```

**Do NOT:**
- Use raw `fetch()` for API calls from components - use `useFetcher` instead
- Create separate API endpoints when you could use the page's action with intents

## Key Features

All features have associated tests and are documented in the README:

- **Multiple Search Terms**: Monitor multiple keywords per Discord channel
- **Smart Filtering**: Include/exclude deals based on keywords
- **Price Thresholds**: Filter by maximum price or minimum discount percentage
- **Quiet Hours**: Pause notifications during specified hours (queued deals sent when quiet hours end)
- **Notification Preview**: Preview how Discord notifications will look before deals arrive
- **Live Filter Preview**: See in real-time which deals would be included/excluded
- **Filter Transparency**: All deals stored with match details explaining filter decisions

## Development Guidelines

1. **All new functionality must have associated tests** - Components, utilities, and route handlers should have corresponding test files.

2. **Document features in README** - User-facing features should be listed in the README's Features section.

3. **Update suggested-features.md** - When implementing features from the suggested features list, mark them as implemented and add documentation to the Completed Features section.

4. **Follow existing patterns** - Look at similar existing code for conventions (component structure, testing patterns, error handling).

5. **Use Mantine components** - The UI uses Mantine v8. Prefer Mantine components over custom implementations.

6. **Type safety** - Use Zod schemas for runtime validation. Avoid `any` types.

## Environment Variables

Required for deployment (configured via SST secrets):
- Discord OAuth credentials
- AWS credentials (handled by SST)

## Deployment

```bash
npx sst deploy              # Deploy to default stage
npx sst deploy --stage prod # Deploy to production
```

Production deployments are protected and retained. Non-production deployments are automatically removed.
