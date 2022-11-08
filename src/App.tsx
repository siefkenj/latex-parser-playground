import React from "react";
import SplitPane from "react-split-pane";

import "./App.css";

import { AstView } from "./components/ast-view";

import { DebugView } from "./components/debug";
import { HtmlView } from "./components/html-view";
import { lintAll } from "./linter";
import { parsingWorker } from "./async-worker/worker-wrapper";
import { useStoreActions, useStoreState } from "./store/hooks";
import { Editor } from "./components/editor";
import { FormattedDisplay } from "./components/formatted-display";
import { JsonDisplay } from "./components/json-display";
import { PrettierDocDisplay } from "./components/prettier-doc-display";

function App() {
    const currDisplay = useStoreState((state) => state.activeView);
    const setCurrDisplay = useStoreActions((a) => a.setActiveView);
    const textWidth = useStoreState((state) => state.textWidth);
    const setTextWidth = useStoreActions((a) => a.setTextWidth);
    const texInput = useStoreState((state) => state.editorText);
    const editorChange = useStoreActions((a) => a.editorChange);
    const applyLints = useStoreState((state) => state.applyLints);
    const setApplyLints = useStoreActions((a) => a.setApplyLints);
    const texParsed = useStoreState((state) => state.parsed);
    const htmlRender = useStoreState((state) => state.html);
    const setFormattedText = useStoreActions((a) => a.setFormattedText);

    const [showLints, setShowLints] = React.useState(false);
    const [lints, setLints] = React.useState([]);

    React.useEffect(() => {
        editorChange();
    }, [currDisplay, editorChange]);

    React.useEffect(() => {
        switch (currDisplay) {
            case "formatted":
                if (applyLints) {
                    parsingWorker
                        //asyncFormatter
                        .formatWithLints(texInput, { printWidth: textWidth })
                        .then((x: any) => setFormattedText(x))
                        .catch((e: any) => console.warn("Failed to parse", e));
                } else {
                    parsingWorker
                        //asyncFormatter
                        .format(texInput, { printWidth: textWidth })
                        .then((x: any) => setFormattedText(x))
                        .catch((e: any) => console.warn("Failed to parse", e));
                }
                break;
            default:
                break;
        }
        if (showLints) {
            parsingWorker
                //asyncFormatter
                .parse(texInput)
                .then((ast) => {
                    setLints(lintAll(ast) as any);
                })
                .catch((e) => console.warn("Failed to parse", e));
        }
    }, [
        texInput,
        textWidth,
        currDisplay,
        showLints,
        applyLints,
        setFormattedText,
    ]);

    let rightPanel = null;
    if (currDisplay === "formatted") {
        rightPanel = <FormattedDisplay />;
    }
    if (currDisplay === "ast") {
        rightPanel = <AstView ast={texParsed} />;
    }
    if (currDisplay === "json") {
        rightPanel = <JsonDisplay />;
    }
    if (currDisplay === "doc") {
        rightPanel = <PrettierDocDisplay />;
    }
    if (currDisplay === "debug") {
        rightPanel = <DebugView />;
    }
    if (currDisplay === "html") {
        rightPanel = <HtmlView htmlInput={htmlRender} />;
    }

    return (
        <div className="App">
            <div className="options-bar">
                <input
                    type="number"
                    value={textWidth}
                    onChange={(e) => {
                        setTextWidth(parseInt(e.target.value, 10));
                        editorChange();
                    }}
                />{" "}
                Display:{" "}
                <select
                    onChange={(e) => setCurrDisplay(e.target.value as any)}
                    value={currDisplay}
                >
                    <option value="formatted">Formatted Code</option>
                    <option value="ast">AST (Abstract Syntax Tree)</option>
                    <option value="json">
                        JSON AST (Abstract Syntax Tree)
                    </option>
                    <option value="doc">
                        Prettier Doc (AST for formatting)
                    </option>
                    <option value="debug">Debug View</option>
                    <option value="html">HTML View</option>
                </select>{" "}
                <label>
                    Show Lints:{" "}
                    <input
                        name="showLints"
                        type="checkbox"
                        checked={showLints}
                        onChange={(e) => setShowLints(e.target.checked)}
                    />
                </label>
                <label>
                    {" "}
                    Apply Lints:{" "}
                    <input
                        name="applyLints"
                        type="checkbox"
                        checked={applyLints}
                        onChange={(e) => {
                            setApplyLints(e.target.checked);
                            if (e.target.checked) {
                                setShowLints(true);
                            }
                        }}
                    />
                </label>
            </div>
            <div className="tex-section">
                <SplitPane split="vertical" minSize={200} defaultSize="50%">
                    <div className="code-container">
                        <Editor />
                    </div>
                    <div className="code-container">{rightPanel}</div>
                </SplitPane>
            </div>
            {showLints && (
                <div className="footer">
                    <h6>Lints: ({lints.length})</h6>
                    <div className="lints-list-surround">
                        <div className="lints-list">
                            <ul className="lints">
                                {lints.map((lint: any, i) => (
                                    <li key={i}>{lint.description}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
