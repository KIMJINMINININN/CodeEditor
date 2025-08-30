import styled from "styled-components";
import { memo, useMemo } from "react";
import { useFsStore } from "@entities/fs-tree";
import TabBar from "@features/tabs/ui/TabBar";
import EditorPane from "@features/tabs/ui/EditorPane";

const TabArea = memo(() => {
  const { tabs, activePath } = useFsStore();
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        tabs.findIndex((t) => t.path === activePath),
      ),
    [tabs, activePath],
  );

  const active = tabs[activeIndex] ?? tabs.at(-1);

  return (
    <Wrap>
      <TabBar active={active} activeIndex={activeIndex} />
      <EditorPane active={active} />
    </Wrap>
  );
});

const Wrap = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export default TabArea;
