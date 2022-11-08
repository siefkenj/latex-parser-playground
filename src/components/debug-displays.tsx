import React from "react";
import { UseCodeMirror, useCodeMirror } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { StreamLanguage } from "@codemirror/language";
import { pegjs } from "../codemirror-modes/pegjs";

const latexSyntaxHighlight = StreamLanguage.define(stex);
const pegjsSyntaxHighlight = StreamLanguage.define(pegjs);

export function DebugJsonDisplay({
    code,
    onChange,
}: {
    code: string;
    onChange: UseCodeMirror["onChange"];
}) {
    const editorRef = React.useRef<HTMLDivElement>(null);

    useCodeMirror({
        container: editorRef.current,
        value: code,
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

export function DebugJavascriptDisplay({
    code,
    onChange,
}: {
    code: string;
    onChange: UseCodeMirror["onChange"];
}) {
    const editorRef = React.useRef<HTMLDivElement>(null);

    useCodeMirror({
        container: editorRef.current,
        value: code,
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

export function DebugLatexDisplay({
    code,
    onChange,
}: {
    code: string;
    onChange: UseCodeMirror["onChange"];
}) {
    const editorRef = React.useRef<HTMLDivElement>(null);

    useCodeMirror({
        container: editorRef.current,
        value: code,
        extensions: [latexSyntaxHighlight],
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

export function DebugPegjsDisplay({
    code,
    onChange,
}: {
    code: string;
    onChange: UseCodeMirror["onChange"];
}) {
    const editorRef = React.useRef<HTMLDivElement>(null);

    useCodeMirror({
        container: editorRef.current,
        value: code,
        extensions: [pegjsSyntaxHighlight],
        onChange: onChange,
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
