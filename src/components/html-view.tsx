import React from "react";
import "katex/dist/katex.min.css";
// @ts-ignore
import renderMathInElement from "katex/dist/contrib/auto-render";
// @ts-ignore
import katex from "katex/dist/katex.mjs";
import ReactSplitPane from "react-split-pane";
// @ts-ignore
import Prettier from "prettier/esm/standalone.mjs";
import htmlParser from "prettier/parser-html";

import { useCodeMirror } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { useStoreState } from "../store/hooks";

export function HtmlSourceDisplay() {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const htmlInput = useStoreState((state) => state.html);
    const formattedHtml = React.useMemo(() => {
        try {
            return Prettier.format(htmlInput, {
                printWidth: 80,
                useTabs: true,
                parser: "html",
                plugins: [htmlParser],
            });
        } catch {
            return htmlInput;
        }
    }, [htmlInput]);

    useCodeMirror({
        container: editorRef.current,
        value: formattedHtml,
        extensions: [html()],
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

/**
 * Wrapper around ReactSplitPlane so that typescript stops complaining.
 */
function SplitPane({ children, ...rest }: React.PropsWithChildren<any>) {
    return <ReactSplitPane {...rest}>{children}</ReactSplitPane>;
}

function KatexRenderedHtml({ source }: { source: string }) {
    const renderedRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (renderedRef.current) {
            renderMathInElement(renderedRef.current, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "\\[", right: "\\]", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                ],
                //trust: true,
                //strict: false,
            });
            for (const dm of Array.from(
                renderedRef.current.querySelectorAll(".display-math")
            )) {
                katex.render(dm.textContent, dm, {
                    displayMode: true,
                    throwOnError: false,
                });
            }
            for (const im of Array.from(
                renderedRef.current.querySelectorAll(".inline-math")
            )) {
                katex.render(im.textContent, im, {
                    displayMode: false,
                    throwOnError: false,
                });
            }
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

export function HtmlView({ htmlInput, ...rest }: { htmlInput: string }) {
    return (
        <SplitPane split="horizontal" defaultSize="50%">
            <div className="code-container">
                <HtmlSourceDisplay />
            </div>
            <KatexRenderedHtml source={htmlInput} />
        </SplitPane>
    );
}
