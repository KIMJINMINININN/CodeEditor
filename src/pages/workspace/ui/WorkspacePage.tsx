// src/pages/workspace/ui/WorkspacePage.tsx
import styled from "styled-components";
import HeaderBar from "@widgets/header-bar";
import FilePanel from "@widgets/file-panel";
import EditorPanel from "@widgets/editor-panel";
import DropZone from "@features/upload-zip";

const Layout = styled.div`
  display: grid;
  grid-template-rows: 56px 1fr;
  height: 100%;
`;
const Body = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 0;
`;

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
