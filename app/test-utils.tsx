import { render, type RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { createMemoryRouter, RouterProvider } from "react-router";
import { theme } from "./theme";

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  // Create a data router that wraps the component
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: <MantineProvider theme={theme}>{ui}</MantineProvider>,
      },
    ],
    { initialEntries: ["/"] }
  );

  return render(<RouterProvider router={router} />, options);
}

export * from "@testing-library/react";
export { renderWithProviders as render };
