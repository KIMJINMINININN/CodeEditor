import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { useFsStore } from "@entities/fs-tree";

const DropZone = () => {
  const [show, setShow] = useState(false);
  const setDragActive = useFsStore((s) => s.setDragActive);
  const setTree = useFsStore((s) => s.setTree);

  useEffect(() => {
    let counter = 0;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      counter++;
      setShow(true);
      setDragActive(true);
    };
    const onDragLeave = (_e: DragEvent) => {
      counter = Math.max(0, counter - 1);
      if (counter === 0) {
        setShow(false);
        setDragActive(false);
      }
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files ?? []);
      setShow(false);
      setDragActive(false);
      if (files.length === 0) return;

      const file = files[0];
      if (!/\.zip$/i.test(file.name)) {
        alert("ZIP 파일만 업로드 가능합니다.");
        return;
      }
      const { loadZip } = await import("@shared/api/zip");
      const tree = await loadZip(file);
      setTree(tree);
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [setDragActive, setTree]);

  return (
    <Overlay data-testid="drop-overlay" aria-hidden={!show} $show={show}>
      <div style={{ textAlign: "center" }}>
        <i
          className="codicon codicon-cloud-upload"
          style={{ fontSize: 24, marginRight: 8 }}
        />
        <strong>여기에 ZIP 파일을 드래그하여 업로드</strong>
      </div>
    </Overlay>
  );
};

const Overlay = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "$show",
})<{ $show: boolean }>`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: ${({ $show }) => ($show ? "auto" : "none")};
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: opacity 0.12s ease;
  z-index: 1000;
`;

export default DropZone;
