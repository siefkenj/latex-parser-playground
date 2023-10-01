import React from "react";
import "katex/dist/katex.min.css";
import ReactSplitPane from "react-split-pane";

import { useCodeMirror } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";
import { useStoreState } from "../store/hooks";
import { toMarkdown } from "mdast-util-to-markdown";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import type * as Mdast from "mdast";

export function MarkdownSourceDisplay() {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const markdownInput = useStoreState((state) => state.markdown);
    const formattedMarkdown = toMarkdown(markdownInput as any);

    useCodeMirror({
        container: editorRef.current,
        value: formattedMarkdown,
        extensions: [markdown()],
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

function RenderedMarkdown({ source }: { source: string }) {
    return (
        <Markdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex, remarkGfm]}
        >
            {source}
        </Markdown>
    );
}

export function MarkdownView({ mdast, ...rest }: { mdast: Mdast.Root }) {
    return (
        <SplitPane split="horizontal" defaultSize="50%">
            <div className="code-container">
                <MarkdownSourceDisplay />
            </div>
            <RenderedMarkdown source={toMarkdown(mdast as any)} />
        </SplitPane>
    );
}
