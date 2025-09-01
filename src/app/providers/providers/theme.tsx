import { ThemeProvider, createGlobalStyle } from "styled-components";
import { darkTheme } from "@shared/styles/theme";

const GlobalStyle = createGlobalStyle`
  html,body,#root { height:100%; }
  body { margin:0; background: ${({ theme }) => theme.bg}; color:${({ theme }) => theme.text}; }
`;

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
