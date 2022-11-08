import React from "react";

import SplitPane from "react-split-pane";

import { filterProp } from "../filter-prop";
import { parsingWorker } from "../async-worker/worker-wrapper";
import { useStoreActions, useStoreState } from "../store/hooks";
import { StoreModel } from "../store/model";
import {
    DebugJavascriptDisplay,
    DebugJsonDisplay,
    DebugLatexDisplay,
    DebugPegjsDisplay,
} from "./debug-displays";

const MODE_TO_COMPONENT: Record<
    keyof StoreModel["debug"]["displayCode"],
    typeof DebugJsonDisplay
> = {
    ast: DebugJsonDisplay,
    doc: DebugJavascriptDisplay,
    formatted: DebugLatexDisplay,
    parsedAst: DebugJsonDisplay,
    pegGrammar: DebugPegjsDisplay,
};

export function DebugView() {
    const texInput = useStoreState((state) => state.editorText);
    const textWidth = useStoreState((state) => state.textWidth);

    const currDisplay = useStoreState((state) => state.debug.currDisplay);
    const setCurrDisplay = useStoreActions((a) => a.debug.setCurrDisplay);

    const displayCode = useStoreState((state) => state.debug.displayCode);
    const setDisplayCode = useStoreActions((a) => a.debug.setDisplayCode);

    React.useEffect(() => {
        for (const [_display, active] of Object.entries(currDisplay)) {
            const display = _display as keyof typeof currDisplay;
            if (!active) {
                continue;
            }
            switch (display) {
                case "formatted":
                    parsingWorker
                        .format(texInput, { printWidth: textWidth })
                        .then((x) =>
                            setDisplayCode({
                                formatted: {
                                    code: x,
                                },
                            })
                        )
                        .catch((e) => console.warn("Failed to parse", e));
                    break;
                case "ast":
                    parsingWorker
                        .parse(texInput)
                        .then((x) =>
                            setDisplayCode({
                                ast: {
                                    code: JSON.stringify(
                                        filterProp(x, "position"),
                                        null,
                                        4
                                    ),
                                },
                            })
                        )
                        .catch((e) => console.warn("Failed to parse", e));
                    break;
                case "doc":
                    parsingWorker
                        .parseToDoc(texInput)
                        .then((x) =>
                            setDisplayCode({
                                doc: {
                                    code: x,
                                },
                            })
                        )
                        .catch((e) => console.warn("Failed to parse", e));
                    break;
                case "parsedAst":
                    parsingWorker
                        .parseWithAstParser(texInput, {
                            parserSource: displayCode.pegGrammar.code,
                        })
                        .then((x) =>
                            setDisplayCode({
                                parsedAst: {
                                    code: JSON.stringify(
                                        filterProp(x, "position"),
                                        null,
                                        4
                                    ),
                                },
                            })
                        )
                        .catch((e) => {
                            setDisplayCode({
                                parsedAst: {
                                    code: e.message,
                                },
                            });
                            console.warn("Failed to parse", e);
                        });
                    break;
                default:
                    break;
            }
        }
    }, [
        texInput,
        textWidth,
        currDisplay,
        displayCode.pegGrammar,
        setDisplayCode,
    ]);

    const rightPanelElements = Object.entries(currDisplay)
        .map(([_key, val]) => {
            const key = _key as keyof typeof displayCode;
            if (!val) {
                return null;
            }
            const codeInfo = displayCode[key] || {
                code: "WARNING: No Code",
                options: {},
            };

            const Component = MODE_TO_COMPONENT[key];

            return (
                <div className="debug-code-parent" key={key}>
                    <div className="debug-code-label">{key}</div>
                    <div style={{ flexGrow: 1, overflow: "hidden" }}>
                        <div className="code-container">
                            <Component
                                key={key}
                                code={codeInfo.code}
                                onChange={(value) => {
                                    if (key === "pegGrammar") {
                                        // The peg grammar is the only thing we can edit, so it gets special treatment
                                        setDisplayCode({
                                            pegGrammar: {
                                                code: value,
                                            },
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        })
        .filter((x) => x != null);

    // SplitPane can only have two children. If we want more,
    // we have to recursively nest.
    function createNestedSplitpanes(items: (React.ReactElement | null)[]) {
        if (items.length === 0) {
            return null;
        }
        if (items.length === 1) {
            return items[0];
        }
        return (
            <SplitPane split="vertical" defaultSize="50%">
                {items[0]}
                {createNestedSplitpanes(items.slice(1))}
            </SplitPane>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                height: "100%",
                overflow: "hidden",
            }}
        >
            <div>
                Display:{" "}
                <label>
                    <input
                        type="checkbox"
                        checked={!!currDisplay.pegGrammar}
                        onChange={(e) => {
                            setCurrDisplay({ pegGrammar: e.target.checked });
                        }}
                    />
                    PEG AST Grammar (for running PEG against the AST)
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={!!currDisplay.parsedAst}
                        onChange={(e) => {
                            setCurrDisplay({ parsedAst: e.target.checked });
                        }}
                    />
                    Parsed AST (after being run through the PEG grammar)
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={!!currDisplay.ast}
                        onChange={(e) => {
                            setCurrDisplay({ ast: e.target.checked });
                        }}
                    />
                    AST
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={!!currDisplay.doc}
                        onChange={(e) => {
                            setCurrDisplay({ doc: e.target.checked });
                        }}
                    />
                    Prettier Doc
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={!!currDisplay.formatted}
                        onChange={(e) => {
                            setCurrDisplay({ formatted: e.target.checked });
                        }}
                    />
                    Formatted
                </label>
            </div>
            <div
                style={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {createNestedSplitpanes(rightPanelElements)}
            </div>
        </div>
    );
}
