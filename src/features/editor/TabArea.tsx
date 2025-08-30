import styled from "styled-components";
import { useEffect, useMemo, useRef } from "react";
import { useFsStore } from "../../store/useFsStore";
import { MonacoEditor } from "../../components/MonacoEditor";
import { updateText } from "../../lib/zipClient";
import { useVirtualizer } from "@tanstack/react-virtual";

export function TabArea() {
  const {
    tabs,
    activePath,
    setActive,
    closeTab,
    updateText: setText,
  } = useFsStore();
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        tabs.findIndex((t) => t.path === activePath),
      ),
    [tabs, activePath],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // 수평 가상화기
  const virtual = useVirtualizer({
    horizontal: true,
    count: tabs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 140, // 탭 평균 너비 추정치
    overscan: 5,
  });

  // 활성 탭을 가시 영역으로 자동 스크롤
  useEffect(() => {
    if (activeIndex >= 0) virtual.scrollToIndex(activeIndex, { align: "auto" });
  }, [activeIndex]);

  const active = tabs[activeIndex] ?? tabs.at(-1);

  const onChange = async (v: string) => {
    if (!active || active.kind !== "text") return;
    setText(active.path, v);
    await updateText(active.path, v);
  };

  return (
    <Wrap>
      <TabsWrap ref={scrollRef}>
        <TabsInner style={{ width: virtual.getTotalSize() }}>
          {virtual.getVirtualItems().map((item) => {
            const t = tabs[item.index];
            const label = t.path.split("/").pop();
            const isActive = t.path === active?.path;
            return (
              <TabItem
                key={t.path}
                active={isActive}
                x={item.start}
                size={item.size}
                onClick={() => setActive(t.path)}
                title={t.path}
              >
                <i
                  className={`codicon ${
                    t.kind === "image"
                      ? "codicon-file-media"
                      : t.kind === "binary"
                        ? "codicon-package"
                        : "codicon-edit"
                  }`}
                />
                <span>{label}</span>
                <i
                  className="codicon codicon-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.path);
                  }}
                />
              </TabItem>
            );
          })}
        </TabsInner>
      </TabsWrap>

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
          <div style={{ padding: 12 }}>
            Binary file preview is not supported.
          </div>
        )}
      </Body>
    </Wrap>
  );
}

const Wrap = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
const TabsWrap = styled.div`
  position: relative;
  height: 32px;
  background: ${({ theme }) => theme.bg2};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  overflow: auto;
`;
const TabsInner = styled.div`
  position: relative;
  height: 100%;
`;
const TabItem = styled.button<{ active: boolean; x: number; size: number }>`
  position: absolute;
  left: ${(p) => p.x}px;
  width: ${(p) => p.size}px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-bottom: ${({ active }) =>
    active ? "2px solid #4f46e5" : "1px solid transparent"};
  background: ${({ active, theme }) => (active ? theme.bg : theme.bg2)};
  color: ${({ active, theme }) => (active ? theme.text : theme.textMute)};
  white-space: nowrap;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

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
