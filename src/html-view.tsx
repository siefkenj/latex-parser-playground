import React from "react";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/dist/contrib/auto-render";
import katex from "katex/dist/katex.mjs";
import ReactSplitPane from "react-split-pane";
import { CodeMirrorPanel } from "./CodeMirrorPanel";
import Prettier from "prettier/esm/standalone.mjs";
import htmlParser from "prettier/parser-html";

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
            for (const dm of renderedRef.current.querySelectorAll(
                ".display-math"
            )) {
                katex.render(dm.textContent, dm, {
                    displayMode: true,
                    throwOnError: false,
                });
            }
            for (const im of renderedRef.current.querySelectorAll(
                ".inline-math"
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

export function HtmlView({ htmlInput, ...rest }) {
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
