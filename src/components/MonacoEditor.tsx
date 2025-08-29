// src/components/MonacoEditor.tsx (변경)
import * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";

export function MonacoEditor({
  value,
  language,
  onChange,
}: {
  value: string;
  language?: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    // ✅ 테마 정의 (Dark+ 근접)
    monaco.editor.defineTheme("dark-plus-custom", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" }, // 녹색 톤 주석
        { token: "keyword", foreground: "C586C0" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editorCursor.foreground": "#aeafad",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editor.lineHighlightBackground": "#2a2d2e",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
      },
    });
    monaco.editor.setTheme("dark-plus-custom");

    if (!ref.current) return;
    editorRef.current = monaco.editor.create(ref.current, {
      value,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
    });
    const model = editorRef.current.getModel();
    const sub = editorRef.current.onDidChangeModelContent(() =>
      onChange(model?.getValue() ?? ""),
    );
    return () => {
      sub.dispose();
      editorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const model = ed.getModel();
    if (model && model.getValue() !== value) model.setValue(value);
    if (language) monaco.editor.setModelLanguage(model!, language);
  }, [value, language]);

  return <div ref={ref} style={{ height: "100%", width: "100%" }} />;
}
