// src/pages/workspace/ui/WorkspacePage.tsx
import styled from "styled-components";
import HeaderBar from "@widgets/header-bar";
import FilePanel from "@widgets/file-panel";
import EditorPanel from "@widgets/editor-panel";
import DropZone from "@features/upload-zip";

export default function WorkspacePage() {
  return (
    <Layout>
      <HeaderBar />
      <Body>
        <FilePanel />
        <EditorPanel />
      </Body>
      <DropZone />
    </Layout>
  );
}

const Layout = styled.div`
  display: grid;
  grid-template-rows: 56px 1fr;
  height: 100%;
`;
const Body = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr; /* 예: 좌측 패널 + 에디터 */
  height: calc(100vh - 40px); /* 헤더 높이에 맞춰 조절 */
  overflow: hidden;

  /* 🔽 여기 한 줄만 추가 */
  border-top: 1px solid
    ${({ theme }) => (theme as any)?.ui?.border ?? "rgba(255,255,255,0.08)"};
`;
