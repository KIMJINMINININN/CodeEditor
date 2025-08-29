import { Suspense } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { HeaderBar } from './features/header/HeaderBar';
import { FileTree } from './features/fs/FileTree';
import { TabArea } from './features/editor/TabArea';

const GlobalStyle = createGlobalStyle`
    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { height: 100%; margin: 0; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
`;
const Shell = styled.div`display:grid;grid-template-rows:56px 1fr;height:100%;`;
const Main = styled.main`display:grid;grid-template-columns:280px 1fr;min-height:0;`;
const Pane = styled.div`min-height:0;overflow:hidden;&:first-child{border-right:1px solid #e5e7eb;}`;

export default function App() {
    return (
        <Shell>
            <GlobalStyle />
            <HeaderBar />
            <Main>
                <Pane>
                    <Suspense fallback={<div>Loading tree…</div>}><FileTree /></Suspense>
                </Pane>
                <Pane>
                    <Suspense fallback={<div>Loading editor…</div>}><TabArea /></Suspense>
                </Pane>
            </Main>
        </Shell>
    );
}
