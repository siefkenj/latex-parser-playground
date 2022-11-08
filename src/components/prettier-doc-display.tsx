import React from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useStoreState } from "../store/hooks";

export function PrettierDocDisplay() {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const prettierDoc = useStoreState((state) => state.prettierDoc);

    useCodeMirror({
        container: editorRef.current,
        value: prettierDoc,
        extensions: [javascript()],
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
