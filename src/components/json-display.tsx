import React from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { useStoreState } from "../store/hooks";

export function JsonDisplay() {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const jsonAst = useStoreState((state) => state.jsonAst);

    useCodeMirror({
        container: editorRef.current,
        value: jsonAst,
        extensions: [json()],
        readOnly: true,
        height: "100%",
        basicSetup: {
            lineNumbers: false,
            foldGutter: true,
            highlightActiveLine: false,
        },
    });

    return (
        <div
            style={{ flex: "1 1 auto", height: "100%", width: "100%" }}
            ref={editorRef}
        />
    );
}
