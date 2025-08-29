import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

export function MonacoEditor({ value, language, onChange }:{
    value: string; language?: string; onChange: (v:string)=>void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor|null>(null);

    useEffect(() => {
        if (!ref.current) return;
        editorRef.current = monaco.editor.create(ref.current, {
            value, language, automaticLayout: true, minimap: { enabled:false }
        });
        // undo/redo는 monaco 기본 제공. 단축키는 기본 매핑(Ctrl/Cmd+Z, Shift+Z)
        const model = editorRef.current.getModel();
        const sub = editorRef.current.onDidChangeModelContent(() => onChange(model?.getValue() ?? ''));
        return () => { sub.dispose(); editorRef.current?.dispose(); };
    }, []);

    useEffect(() => {
        const ed = editorRef.current; if (!ed) return;
        const model = ed.getModel(); if (model && model.getValue() !== value) model.setValue(value);
        // language 변경 시 모델 언어 업데이트
        if (language) monaco.editor.setModelLanguage(model!, language);
    }, [value, language]);

    return <div ref={ref} style={{height:'100%', width:'100%'}} />;
}
