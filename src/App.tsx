// src/App.tsx
import { Suspense } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { HeaderBar } from "./features/header/HeaderBar";
import { FileTree } from "./features/fs/FileTree";
import { TabArea } from "./features/editor/TabArea";

const GlobalStyle = createGlobalStyle`
    :root { color-scheme: dark; }
    html, body, #root { height: 100%; margin: 0; }
    body { background: ${({ theme }) => theme.bg}; 
        color: ${({ theme }) => theme.text}; }
    .codicon { vertical-align: middle; }
`;

export default function App() {
  return (
    <Shell>
      <GlobalStyle />
      <HeaderBar />
      <Main>
        <Sidebar>
          <Suspense fallback={<div style={{ padding: 12 }}>Loading tree…</div>}>
            <FileTree />
          </Suspense>
        </Sidebar>
        <Content>
          <Suspense
            fallback={<div style={{ padding: 12 }}>Loading editor…</div>}
          >
            <TabArea />
          </Suspense>
        </Content>
      </Main>
    </Shell>
  );
}

const Shell = styled.div`
  display: grid;
  grid-template-rows: 56px 1fr;
  height: 100%;
`;

const Main = styled.main`
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 0;
`;

const Sidebar = styled.div`
  min-height: 0;
  overflow: auto;
  background: ${({ theme }) => theme.bg2};
  border-right: 1px solid ${({ theme }) => theme.border};
`;

const Content = styled.div`
  min-height: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.bg};
`;
