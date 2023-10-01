import { action, computed, createStore, thunk } from "easy-peasy";
import { isParseError } from "../async-worker/errors";
import { parsingWorker } from "../async-worker/worker-wrapper";
import { filterProp } from "../filter-prop";
import { StoreModel } from "./model";

const DEFAULT_INPUT_TEXT = String.raw`\section*{Really Cool Math}Below you'll find some really cool math.

Check it out!\begin{enumerate}
    \item[(a)] Hi there
\item$e^2$ is math mode! \[\begin{bmatrix}12&3^e\\\pi&0\end{bmatrix}\]
\end{enumerate}`;

export const store = createStore<StoreModel>({
    activeView: "formatted",
    setActiveView: action((state, payload) => {
        state.activeView = payload;
    }),
    textWidth: 80,
    setTextWidth: action((state, payload) => {
        state.textWidth = payload;
    }),
    editorText: DEFAULT_INPUT_TEXT,
    setEditorText: action((state, payload) => {
        state.editorText = payload;
    }),
    formattedText: "",
    setFormattedText: action((state, payload) => {
        state.formattedText = payload;
    }),
    parseError: null,
    editorChange: thunk(async (actions, payload, { getState }) => {
        if (payload != null) {
            actions.setEditorText(payload);
        }
        const { activeView, editorText, textWidth, applyLints } = getState();
        try {
            switch (activeView) {
                case "formatted":
                    const formatted = await parsingWorker.format(editorText, {
                        printWidth: textWidth,
                        fixLints: applyLints,
                    });
                    actions.setParseError(null);
                    actions.setFormattedText(formatted);
                    break;
                case "ast":
                case "json":
                    const parsed = await parsingWorker.parse(editorText);
                    actions.setParsed(parsed);
                    actions.setParseError(null);
                    break;
                case "doc":
                    const doc = await parsingWorker.parseToDoc(editorText);
                    actions.setPrettierDoc(doc);
                    break;
                case "html":
                    const html = await parsingWorker.formatAsHtml(editorText);
                    actions.setHtml(html);
                    break;
                case "markdown":
                    const markdown = await parsingWorker.formatAsMarkdown(
                        editorText
                    );
                    actions.setMarkdown(markdown as any);
            }
            const lintMessages = await parsingWorker.getLints(editorText);
            actions.setLints(lintMessages);
        } catch (e) {
            actions.setParsed(null);
            if (isParseError(e)) {
                actions.setParseError(e);
            } else {
                console.warn("Failed to parse", e);
                actions.setParseError(String(e));
            }
        }
    }),
    setParseError: action((state, payload) => {
        state.parseError = payload;
    }),
    parsed: null,
    setParsed: action((state, payload) => {
        state.parsed = payload;
    }),
    prettierDoc: "",
    setPrettierDoc: action((state, payload) => {
        state.prettierDoc = payload;
    }),
    html: "",
    setHtml: action((state, payload) => {
        state.html = payload;
    }),
    markdown: {type:"root", children:[]},
    setMarkdown: action((state, payload) => {
        state.markdown = payload;
    }),
    applyLints: false,
    setApplyLints: action((state, payload) => {
        state.applyLints = payload;
    }),
    lintDescs: computed((state) =>
        state.lints.map((m) => `${m.name}: ${m.message}`)
    ),
    lints: [],
    setLints: action((state, payload) => {
        state.lints = payload;
    }),

    jsonAst: computed((state) =>
        JSON.stringify(filterProp(state.parsed || {}, "position"), null, 4)
    ),
    debug: {
        currDisplay: {
            pegGrammar: true,
            ast: false,
            doc: false,
            formatted: false,
            parsedAst: false,
        },
        setCurrDisplay: action((debug, payload) => {
            Object.assign(debug.currDisplay, payload);
        }),
        displayCode: {
            pegGrammar: { code: "" },
            ast: { code: "" },
            doc: { code: "" },
            formatted: { code: "" },
            parsedAst: { code: "" },
        },
        setDisplayCode: action((debug, payload) => {
            Object.assign(debug.displayCode, payload);
        }),
    },
});
