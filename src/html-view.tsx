import React from "react";
import { printRaw } from "latex-ast-parser";
import { console } from "globalthis/implementation";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/dist/contrib/auto-render";
import reactSelect from "react-select";
import SplitPane from "react-split-pane";
import { CodeMirrorPanel } from "./CodeMirrorPanel";
import * as latexAstParser from "latex-ast-parser";
import Prettier from "prettier/esm/standalone.mjs";
import htmlParser from "prettier/parser-html"

function KatexRenderedHtml({ source }: { source: string }) {
    const renderedRef = React.useRef(null);

    React.useLayoutEffect(() => {
        if (renderedRef.current) {
            renderMathInElement(renderedRef.current, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "\\[", right: "\\]", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                ],
            });
        }
    }, [renderedRef, source]);

    return (
        <div
            ref={renderedRef}
            className="html-render-container"
            dangerouslySetInnerHTML={{ __html: source }}
        ></div>
    );
}

export function HtmlView({ htmlInput, ...rest }) {
    const formattedHtml = React.useMemo(() => {
        return Prettier.format(htmlInput, {
            printWidth: 80,
            useTabs: true,
            parser: "html",
            plugins: [htmlParser]
        });
    }, [htmlInput]);
    return (
        <SplitPane split="horizontal" defaultSize="50%">
            <div className="code-container">
                <CodeMirrorPanel
                    lineNumbers={true}
                    showCursorWhenSelecting={true}
                    tabSize={4}
                    rulerColor="#eeeeee"
                    mode="html"
                    value={formattedHtml}
                />
            </div>
            <KatexRenderedHtml source={htmlInput} />
        </SplitPane>
    );
}
