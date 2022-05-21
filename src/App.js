import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/stex/stex";
import "codemirror/mode/javascript/javascript";
import "codemirror/lib/codemirror.css";
import SplitPane from "react-split-pane";
import "codemirror/addon/display/rulers";
//import * as latexAstParser from "latex-ast-parser";

import "./App.css";

import { CodeMirrorPanel } from "./CodeMirrorPanel.js";

import * as Comlink from "comlink";
/* eslint-disable import/no-webpack-loader-syntax */
import Worker from "worker-loader!./worker/parsing-worker";

import { AstView } from "./ast-view";

import { DebugView } from "./DebugView";
import { HtmlView } from "./html-view.tsx";
import { filterProp } from "./filter-prop.ts";
import { lintAll } from "./linter.ts";

const DEFAULT_INPUT_TEXT = String.raw`\section*{Really Cool Math}Below you'll find some really cool math.

Check it out!\begin{enumerate}
    \item[(a)] Hi there
\item$e^2$ is math mode! \[\begin{bmatrix}12&3^e\\\pi&0\end{bmatrix}\]
\end{enumerate}`;

// Our worker that will format code in another thread.
const worker = new Worker();
const asyncFormatter = Comlink.wrap(worker);

function App() {
    const [textWidth, setTextWidth] = React.useState(80);
    const [currDisplay, setCurrDisplay] = React.useState("formatted");
    const [texInput, setTexInput] = React.useState(DEFAULT_INPUT_TEXT);
    const [texOutput, setTexOutput] = React.useState("");
    const [texParsed, setTexParsed] = React.useState([]);
    const [htmlRender, setHtmlRender] = React.useState("");
    const [prettierDoc, setPrettierDoc] = React.useState("");
    const [applyLints, setApplyLints] = React.useState(false);
    const [showLints, setShowLints] = React.useState(false);
    const [lints, setLints] = React.useState([]);

    React.useEffect(() => {
        switch (currDisplay) {
            case "formatted":
                if (applyLints) {
                    asyncFormatter
                        .formatWithLints(texInput, { printWidth: textWidth })
                        .then((x) => setTexOutput(x))
                        .catch((e) => console.warn("Failed to parse", e));
                } else {
                    asyncFormatter
                        .format(texInput, { printWidth: textWidth })
                        .then((x) => setTexOutput(x))
                        .catch((e) => console.warn("Failed to parse", e));
                }
                break;
            case "ast":
            case "json":
                asyncFormatter
                    .parse(texInput)
                    .then((x) => setTexParsed(x))
                    .catch((e) => console.warn("Failed to parse", e));
                break;
            case "doc":
                asyncFormatter
                    .parseToDoc(texInput)
                    .then((x) => setPrettierDoc(x))
                    .catch((e) => console.warn("Failed to parse", e));
                break;
            case "html":
                asyncFormatter
                    .formatAsHtml(texInput)
                    .then((x) => setHtmlRender(x))
                    .catch((e) => console.warn("Failed to parse", e));
                break;
            default:
                break;
        }
        if (showLints) {
            asyncFormatter
                .parse(texInput)
                .then((ast) => {
                    setLints(lintAll(ast));
                })
                .catch((e) => console.warn("Failed to parse", e));
        }
    }, [texInput, textWidth, currDisplay, showLints, applyLints]);

    let rightPanel = null;
    if (currDisplay === "formatted") {
        rightPanel = (
            <CodeMirror
                value={texOutput}
                options={{ mode: "stex", rulers: [textWidth] }}
                onBeforeChange={(editor, data, value) => setTexOutput(value)}
            />
        );
    }
    if (currDisplay === "ast") {
        rightPanel = <AstView ast={texParsed} />;
    }
    if (currDisplay === "json") {
        rightPanel = (
            <CodeMirror
                value={JSON.stringify(
                    filterProp(texParsed, "position"),
                    null,
                    4
                )}
                options={{ mode: "javascript" }}
            />
        );
    }
    if (currDisplay === "doc") {
        rightPanel = (
            <CodeMirror value={prettierDoc} options={{ mode: "javascript" }} />
        );
    }
    if (currDisplay === "debug") {
        rightPanel = <DebugView texInput={texInput} textWidth={textWidth} />;
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
                    onChange={(e) => setTextWidth(parseInt(e.target.value, 10))}
                />{" "}
                Display:{" "}
                <select
                    onChange={(e) => setCurrDisplay(e.target.value)}
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
                        <CodeMirrorPanel
                            lineNumbers={true}
                            showCursorWhenSelecting={true}
                            tabSize={4}
                            rulerColor="#eeeeee"
                            mode="stex"
                            value={texInput}
                            onChange={setTexInput}
                            codeSample={DEFAULT_INPUT_TEXT}
                        />
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
                                {lints.map((lint, i) => (
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
