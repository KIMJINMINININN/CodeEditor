// src/widgets/file-panel/ui/FilePanel.tsx
import styled from "styled-components";
import FileTree from "@features/filetree";

const Wrap = styled.div`
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.border};
`;
export default function FilePanel() {
  return (
    <Wrap>
      <FileTree />
    </Wrap>
  );
}
