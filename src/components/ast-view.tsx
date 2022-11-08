import React from "react";
import * as Ast from "@unified-latex/unified-latex-types";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";

function Captioned({
    caption,
    children,
}: React.PropsWithChildren<{ caption: string }>) {
    return (
        <div className="ast-captioned">
            <div className="ast-captioned-caption">{caption}</div>
            <div className="ast-captioned-body">{children}</div>
        </div>
    );
}

function Node(props: { value: string }) {
    return (
        <Captioned caption="">
            <span className="ast-node">{"" + props.value}</span>
        </Captioned>
    );
}
function Whitespace(props: {}) {
    return (
        <Captioned caption="">
            <span className="ast-node">&nbsp;</span>
        </Captioned>
    );
}
function Parbreak(props: {}) {
    return (
        <React.Fragment>
            <br />
            <Captioned caption="\par">
                <span className="ast-node">&nbsp;</span>
            </Captioned>
            <br />
        </React.Fragment>
    );
}
function InlineMath({ children }: React.PropsWithChildren<{}>) {
    return (
        <Captioned caption="$...$">
            <span className="ast-node">
                <span className="ast-control-symbol">$</span>
                {children}
                <span className="ast-control-symbol">$</span>
            </span>
        </Captioned>
    );
}
function Superscript({ children }: React.PropsWithChildren<{}>) {
    return (
        <Captioned caption="^">
            <span className="ast-node">
                <span className="ast-control-symbol">^</span>
                {children}
            </span>
        </Captioned>
    );
}
function Subscript({ children }: React.PropsWithChildren<{}>) {
    return (
        <Captioned caption="_">
            <span className="ast-node">
                <span className="ast-control-symbol">_</span>
                {children}
            </span>
        </Captioned>
    );
}
function Group({ children }: React.PropsWithChildren<{}>) {
    return (
        <Captioned caption="{...}">
            <span className="ast-node">
                <span className="ast-control-symbol">{"{"}</span>
                {children}
                <span className="ast-control-symbol">{"}"}</span>
            </span>
        </Captioned>
    );
}
function DisplayMath({ children }: React.PropsWithChildren<{}>) {
    return (
        <Captioned caption={"\\[...\\]"}>
            <span className="ast-node">
                <span className="ast-control-symbol">\[</span>
                {children}
                <span className="ast-control-symbol">\]</span>
            </span>
        </Captioned>
    );
}
function Macro({ name, args }: { name: string; args: React.ReactNode }) {
    return (
        <Captioned caption={"macro"}>
            <span className="ast-node">
                <span className="ast-control-symbol">\</span>
                {name}
                {args}
            </span>
        </Captioned>
    );
}
function Verb({ escape, content }: { escape: string; content: string }) {
    return (
        <Captioned caption={`\\verb${escape}...${escape}`}>
            <span className="ast-node">
                <span className="ast-control-symbol">\verb{escape}</span>
                <span className="ast-verb">{content}</span>
                <span className="ast-control-symbol">{escape}</span>
            </span>
        </Captioned>
    );
}
function Verbatim({ content, name }: { content: string; name: string }) {
    return (
        <Captioned caption={`verbatim env`}>
            <span className="ast-node">
                <span className="ast-control-symbol">{`\\begin{${name}}`}</span>
                <span className="ast-verb">{content}</span>
                <span className="ast-control-symbol">{`\\end{${name}}`}</span>
            </span>
        </Captioned>
    );
}
function Comment({
    sameline,
    content,
}: {
    sameline: boolean;
    content: string;
}) {
    const caption = sameline ? "comment (sameline)" : "comment";
    return (
        <React.Fragment>
            <Captioned caption={caption}>
                <span className="ast-node ast-comment">
                    <span className="ast-control-symbol">{"%"}</span>
                    {"" + content}
                </span>
            </Captioned>
            <br />
        </React.Fragment>
    );
}
function Environment({
    name,
    args,
    children,
}: React.PropsWithChildren<{ name: string; args?: React.ReactNode }>) {
    return (
        <div className="ast-environment-container">
            <Captioned caption={`env (${name})`}>
                <span className="ast-node">
                    <span className="ast-control-symbol">
                        {`\\begin{${name}}`}
                    </span>
                    {args || null}
                    <span className="ast-env">{children}</span>
                    <span className="ast-control-symbol">{`\\end{${name}}`}</span>
                </span>
            </Captioned>
        </div>
    );
}
function Argument({
    children,
    openMark,
    closeMark,
}: React.PropsWithChildren<{ openMark: string; closeMark: string }>) {
    return (
        <div className="ast-args-container">
            <Captioned caption="args">
                <span className="ast-node">
                    <span className="ast-control-symbol">{openMark}</span>
                    <span className="ast-args">{children}</span>
                    <span className="ast-control-symbol">{closeMark}</span>
                </span>
            </Captioned>
        </div>
    );
}
function MathEnv({
    name,
    children,
}: React.PropsWithChildren<{ name: string }>) {
    return <Environment name={name}>{children}</Environment>;
}

function unwrapString(node: string | Ast.Node) {
    if (typeof node === "string") {
        return node;
    }
    if (node.type === "string") {
        return node.content;
    }
    console.warn("Trying to unwrap non-string node", node);
    return "" + node;
}

function renderTree(
    ast: Ast.Ast | Ast.Root | Ast.Argument | Ast.Argument[] | null | undefined,
    currentDepth = 0
): JSX.Element | JSX.Element[] | null | string {
    if (!ast) {
        //console.warn("Encountered empty AST");
        return null;
    }
    if (typeof ast === "string") {
        return <Node value={ast} />;
    }
    if (Array.isArray(ast)) {
        return ast.map((x, i) => (
            <React.Fragment key={`${currentDepth}-${i}`}>
                {renderTree(x, currentDepth)}
            </React.Fragment>
        ));
    }

    switch (ast.type) {
        case "string":
            return <Node value={unwrapString(ast.content)} />;
        case "whitespace":
            return <Whitespace />;
        case "parbreak":
            return <Parbreak />;
        case "inlinemath":
            return (
                <InlineMath>
                    {renderTree(ast.content, currentDepth + 1)}
                </InlineMath>
            );
        case "macro":
            if (ast.escapeToken === "" && ast.content === "^") {
                return (
                    <Superscript>
                        {renderTree(ast.args, currentDepth + 1)}
                    </Superscript>
                );
            }
            if (ast.escapeToken === "" && ast.content === "_") {
                return (
                    <Subscript>
                        {renderTree(ast.args, currentDepth + 1)}
                    </Subscript>
                );
            }
            return (
                <Macro
                    name={unwrapString(ast.content)}
                    args={renderTree(ast.args, currentDepth + 1)}
                />
            );
        case "group":
            return <Group>{renderTree(ast.content, currentDepth + 1)}</Group>;
        case "verb":
            return (
                <Verb escape={ast.escape} content={unwrapString(ast.content)} />
            );
        case "verbatim":
            return (
                <Verbatim content={unwrapString(ast.content)} name={ast.env} />
            );
        case "displaymath":
            return (
                <DisplayMath>
                    {renderTree(ast.content, currentDepth + 1)}
                </DisplayMath>
            );
        case "environment":
            return (
                <Environment
                    name={printRaw(ast.env)}
                    args={renderTree(ast.args, currentDepth + 1)}
                >
                    {renderTree(ast.content, currentDepth + 1)}
                </Environment>
            );
        case "argument":
            return (
                <Argument openMark={ast.openMark} closeMark={ast.closeMark}>
                    {renderTree(ast.content, currentDepth + 1)}
                </Argument>
            );
        case "mathenv":
            return (
                <MathEnv name={ast.env}>
                    {renderTree(ast.content, currentDepth + 1)}
                </MathEnv>
            );
        //case "commentenv":
        //    return <CommentEnv content={unwrapString(ast.content)} />;
        case "comment":
            return (
                <Comment
                    sameline={Boolean(ast.sameline)}
                    content={unwrapString(ast.content)}
                />
            );
        case "root":
            return renderTree(ast.content);
        default:
            break;
    }
    console.warn("Found unmatched node", ast);
    return "" + ast;
}

export function AstView({ ast }: { ast: Ast.Ast | Ast.Root | null }) {
    try {
        const rendered = renderTree(ast);

        return <div>{rendered}</div>;
    } catch (e) {
        console.error(e);
        return <React.Fragment>Error Rendering</React.Fragment>;
    }
}
