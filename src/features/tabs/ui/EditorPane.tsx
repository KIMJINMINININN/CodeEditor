import React, { memo } from "react";
import { MonacoEditor } from "@shared/ui/monaco/MonacoEditor";
import styled from "styled-components";
import { updateText } from "@shared/api/zip";
import { useFsStore } from "@entities/fs-tree";

interface EditorPaneProps {
  active: any;
}

const EditorPane = memo(({ active }: EditorPaneProps) => {
  const { updateText: setText } = useFsStore();
  const onChange = async (v: string) => {
    if (!active || active.kind !== "text") return;
    setText(active.path, v);
    await updateText(active.path, v);
  };

  return (
    <Body>
      {active?.kind === "text" && (
        <MonacoEditor
          value={active.content ?? ""}
          language={active.language}
          onChange={onChange}
        />
      )}
      {active?.kind === "image" && (
        <Img src={active.dataUrl} alt={active.path} />
      )}
      {active?.kind === "binary" && (
        <div style={{ padding: 12 }}>Binary file preview is not supported.</div>
      )}
    </Body>
  );
});

const Body = styled.div`
  flex: 1;
  min-height: 0;
`;
const Img = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

export default EditorPane;
