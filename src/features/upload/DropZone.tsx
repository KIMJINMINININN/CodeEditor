import { useEffect, useState } from "react";
import styled from "styled-components";
import { loadZip } from "../../lib/zipClient";
import { useFsStore } from "../../store/useFsStore";

export default function DropZone() {
  const [show, setShow] = useState(false);
  const setTree = useFsStore((s) => s.setTree);
  const setDragActive = useFsStore((s) => s.setDragActive);
  // dragenter/leave 중첩 카운터로 깜빡임 방지
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
    const onDragLeave = () => {
      counter = Math.max(0, counter - 1);
      if (counter === 0) {
        setShow(false);
        setDragActive(false);
      }
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      counter = 0;
      setShow(false);
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".zip")) {
        alert("ZIP 파일만 업로드 가능합니다.");
        return;
      }
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
  }, [setTree]);
  return (
    <Overlay show={show}>
      <Box>
        <div style={{ textAlign: "center" }}>
          <i
            className="codicon codicon-cloud-upload"
            style={{ fontSize: 24, marginRight: 8 }}
          />
          <strong>여기에 ZIP 파일을 드래그하여 업로드</strong>
        </div>
      </Box>
    </Overlay>
  );
}

const Overlay = styled.div<{ show: boolean }>`
  pointer-events: ${(p) => (p.show ? "auto" : "none")};
  position: fixed;
  inset: 0;
  display: ${(p) => (p.show ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  z-index: 9999;
`;

const Box = styled.div`
  border: 2px dashed ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.bg2};
  color: ${({ theme }) => theme.text};
  padding: 24px 32px;
  border-radius: 12px;
  font-size: 14px;
`;
