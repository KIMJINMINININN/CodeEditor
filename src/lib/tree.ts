import type { TreeNode } from '../store/useFsStore';

export function buildTree(paths: { path: string; size?: number }[]): TreeNode {
    const root: TreeNode = { name: '/', path: '/', type: 'folder', children: [] };
    const byPath = new Map<string, TreeNode>([['/', root]]);

    for (const { path, size } of paths) {
        const parts = path.split('/').filter(Boolean);
        let cur = root; let acc = '';
        for (let i = 0; i < parts.length; i++) {
            acc += '/' + parts[i];
            const isFile = i === parts.length - 1 && !path.endsWith('/');
            let child = byPath.get(acc);
            if (!child) {
                child = {
                    name: parts[i],
                    path: acc,
                    type: isFile ? 'file' : 'folder',
                    size: isFile ? size : undefined,
                    children: isFile ? undefined : []
                };
                cur.children!.push(child);
                byPath.set(acc, child);
            }
            cur = child;
        }
    }
    // 폴더 내 정렬: 폴더 우선, 이름순
    const sort = (n: TreeNode) => {
        if (!n.children) return;
        n.children.sort((a,b) => (a.type === b.type) ? a.name.localeCompare(b.name) : (a.type === 'folder' ? -1 : 1));
        n.children.forEach(sort);
    };
    sort(root);
    return root;
}
