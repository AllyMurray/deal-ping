import { render, type RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { createMemoryRouter, RouterProvider } from "react-router";
import { theme } from "./theme";

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  // Create a data router that wraps the component
  // Include a no-op action to handle useFetcher submissions in tests
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: <MantineProvider theme={theme}>{ui}</MantineProvider>,
        action: async () => {
          // No-op action for test environment - handles useFetcher submissions
          return null;
        },
      },
    ],
    { initialEntries: ["/"] }
  );

  return render(<RouterProvider router={router} />, options);
}

export * from "@testing-library/react";
export { renderWithProviders as render };
