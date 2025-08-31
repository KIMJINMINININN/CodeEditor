import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "styled-components";
import { darkTheme } from "@shared/styles/theme";

export function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient();
  return {
    ...render(
      <QueryClientProvider client={qc}>
        <ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>
      </QueryClientProvider>,
    ),
    qc,
  };
}
