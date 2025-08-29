import styled from 'styled-components';
import { useFsStore } from '../../store/useFsStore';
import { buildZip, loadZip } from '../../lib/zipClient';

const Bar = styled.header`
    display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid #e5e7eb;
`;

export function HeaderBar() {
    const tree = useFsStore(s => s.tree);           // ✅ 업로드 여부 판단
    const setTree = useFsStore(s => s.setTree);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const t = await loadZip(f);
        setTree(t);
    };

    const onDownload = async () => {
        // ✅ 업로드 안됐으면 Alert 후 바로 반환
        if (!tree) {
            window.alert('파일이 업로드 되지 않았습니다.');
            return;
        }
        const blob = await buildZip();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'edited.zip';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <Bar>
            <strong>Monaco ZIP Editor</strong>
            <input type="file" accept=".zip" onChange={onUpload} />
            <button onClick={onDownload} disabled={!tree} aria-disabled={!tree}>
                Download ZIP
            </button>
        </Bar>
    );
}
