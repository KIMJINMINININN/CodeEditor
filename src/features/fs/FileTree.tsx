import styled from 'styled-components';
import { useFsStore, TreeNode } from '../../store/useFsStore';
import { fetchFileTab } from '../../lib/zipClient';

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
    const openTab = useFsStore(s => s.openTab);
    const onClick = async () => {
        if (node.type === 'file') {
            const tab = await fetchFileTab(node.path);
            openTab(tab);
        }
    };
    return (
        <>
            <Item depth={depth} onClick={onClick}>
                {node.type==='folder' ? '📁 ' : '📄 '}{node.name}
            </Item>
            {node.children?.map(ch => <NodeView key={ch.path} node={ch} depth={depth+1} />)}
        </>
    );
}

export function FileTree() {
    const tree = useFsStore(s => s.tree);
    if (!tree) return <div style={{padding:12}}>Upload a ZIP to start</div>;
    return (
        <Wrap>
            {tree.children?.map(n => <NodeView key={n.path} node={n} depth={0} />)}
        </Wrap>
    );
}

const Wrap = styled.div`height:100%;overflow:auto;padding:8px 0;`;
const Item = styled.div<{depth:number}>`
  padding:4px 8px 4px calc(8px + ${p=>p.depth*16}px);
  cursor:pointer; white-space:nowrap;
  &:hover { background:#f3f4f6; }
`;
