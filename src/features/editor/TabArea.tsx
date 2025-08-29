import styled from "styled-components";
import { useFsStore } from "../../store/useFsStore";
import { MonacoEditor } from "../../components/MonacoEditor";
import { updateText } from "../../lib/zipClient";

export function TabArea() {
  const {
    tabs,
    activePath,
    setActive,
    closeTab,
    updateText: setText,
  } = useFsStore();

  const active = tabs.find((t) => t.path === activePath) ?? tabs.at(-1);
  if (!active && tabs.length === 0) return <Wrap />;

  const onChange = async (v: string) => {
    if (!active || active.kind !== "text") return;
    setText(active.path, v);
    await updateText(active.path, v);
  };

  return (
    <Wrap>
      <Tabs>
        {tabs.map((t) => (
          <TabBtn
            key={t.path}
            active={t.path === active?.path}
            onClick={() => setActive(t.path)}
          >
            {t.kind === "image" ? "🖼️" : t.kind === "binary" ? "📦" : "📝"}{" "}
            {t.path.split("/").pop()}
            <span
              style={{ marginLeft: 8 }}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(t.path);
              }}
            >
              ✕
            </span>
          </TabBtn>
        ))}
      </Tabs>
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
const Tabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px 6px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg2};
  overflow: auto;
`;
const TabBtn = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  background: ${({ active, theme }) => (active ? theme.bg : theme.bg2)};
  color: ${({ active, theme }) => (active ? theme.text : theme.textMute)};
  border: 1px solid ${({ theme }) => theme.border};
  border-bottom: ${({ active }) =>
    active ? "2px solid #4f46e5" : "1px solid transparent"};
  padding: 4px 8px;
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
