import React, { useEffect, useRef } from 'react';
import { ensureMonaco } from './MonacoLoader';

export type MonacoEditorProps = {
    value?: string;
    language?: string;
    onChange?: (v: string) => void;
    height?: number | string;
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({ value = '', language = 'typescript', onChange, height = 300 }) => {
    const elRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);

    useEffect(() => {
        let dispose: (() => void) | undefined;
        ensureMonaco().then(monaco => {
            const model = monaco.editor.createModel(value, language);
            const editor = monaco.editor.create(elRef.current!, {
                model,
                automaticLayout: true,
                theme: 'vs-dark'
            });
            editorRef.current = editor;
            const sub = editor.onDidChangeModelContent(() => onChange?.(editor.getValue()));
            dispose = () => { sub.dispose(); editor.dispose(); model.dispose(); };
        });
        return () => dispose?.();
    }, []);

    return <div data-testid="monaco-container" style={{ height }} ref={elRef} />;
};
