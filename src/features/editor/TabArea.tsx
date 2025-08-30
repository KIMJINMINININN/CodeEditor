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

  const onWheelHoriz: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    // 세로 스크롤 입력이 더 크면 가로 스크롤로 전환
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const onKeyDownTabs: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!tabs.length) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const cur = Math.max(
        0,
        tabs.findIndex((t) => t.path === activePath),
      );
      const next =
        e.key === "ArrowRight"
          ? Math.min(cur + 1, tabs.length - 1)
          : Math.max(cur - 1, 0);
      setActive(tabs[next].path);
      virtual.scrollToIndex(next, { align: "auto" });
    }
  };

  return (
    <Wrap>
      <TabsWrap
        ref={scrollRef}
        onWheel={onWheelHoriz}
        onKeyDown={onKeyDownTabs}
        tabIndex={0}
      >
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
                data-active={isActive}
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
                  className="codicon codicon-close close"
                  aria-label={`Close ${label}`}
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

  /* ✅ 가로 스크롤만 사용, 세로 스크롤은 차단 */
  overflow-x: auto;
  overflow-y: hidden;

  /* ✅ 스크롤바 숨기기 (브라우저별) */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge Legacy */
  &::-webkit-scrollbar {
    display: none;
  } /* Chrome/Safari */

  overscroll-behavior: contain; /* 페이지 전체 스크롤 전파 방지 */
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
  /* 🔹 우측에 X가 들어갈 공간 확보 */
  padding: 0 26px 0 10px;

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

  .close {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease;
  }
  &:hover .close,
  &:focus-visible .close,
  &[data-active="true"] .close {
    opacity: 1;
    pointer-events: auto;
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
