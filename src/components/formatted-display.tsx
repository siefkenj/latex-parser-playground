import React from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { useStoreState } from "../store/hooks";

const latexSyntaxHighlight = StreamLanguage.define(stex);

function generateRulerPlugin() {
    let width: number = 0;
    let dom: HTMLDivElement;
    let defaultCharacterWidth: number = 1;

    class RulerPlugin {
        containerDom: HTMLDivElement;
        constructor(view: EditorView) {
            this.containerDom = view.dom.appendChild(
                document.createElement("div")
            );
            this.containerDom.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
            `;
            dom = this.containerDom.appendChild(document.createElement("div"));
            dom.style.cssText = `
                position: absolute; 
                border-right: 1px dotted gray; 
                height: 100%; 
                opacity: 0.7;
            `;
            // XXX: This should be equal to the amount of padding on a line.
            // This value should be extracted from CodeMirror rather than hardcoded.
            dom.style.width = "4px";
            defaultCharacterWidth = view.defaultCharacterWidth;
            updateRulerWidth(80);
        }

        update(update: ViewUpdate) {
            defaultCharacterWidth = update.view.defaultCharacterWidth;
            if (update.viewportChanged) {
                updateRulerWidth(width, true);
            }
        }

        destroy() {
            dom.remove();
        }
    }

    function updateRulerWidth(newWidth: number, force = false) {
        if ((newWidth !== width || force) && dom) {
            width = newWidth;
            dom.style.left = `${width * defaultCharacterWidth}px`;
        }
    }

    return { rulerPlugin: ViewPlugin.fromClass(RulerPlugin), updateRulerWidth };
}

const { rulerPlugin, updateRulerWidth } = generateRulerPlugin();

export function FormattedDisplay() {
    const editorText = useStoreState((state) => state.formattedText);
    const editorRef = React.useRef<HTMLDivElement>(null);
    useCodeMirror({
        container: editorRef.current,
        value: editorText,
        extensions: [latexSyntaxHighlight, rulerPlugin],
        readOnly: true,
        height: "100%",
        basicSetup: {
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
        },
    });
    const lineWidth = useStoreState((state) => state.textWidth);
    updateRulerWidth(lineWidth);

    return (
        <div
            style={{ flex: "1 1 auto", height: "100%", width: "100%" }}
            ref={editorRef}
        />
    );
}
