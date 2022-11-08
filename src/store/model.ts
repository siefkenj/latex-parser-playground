import { Action, Computed, Thunk } from "easy-peasy";
import { ParseError } from "../async-worker/errors";
import * as Ast from "@unified-latex/unified-latex-types";

type ActiveView = "formatted" | "ast" | "json" | "doc" | "debug" | "html";

export interface StoreModel {
    activeView: ActiveView;
    setActiveView: Action<StoreModel, ActiveView>;

    textWidth: number;
    setTextWidth: Action<StoreModel, number>;

    editorText: string;
    setEditorText: Action<StoreModel, string>;
    editorChange: Thunk<StoreModel, string | void>;

    formattedText: string;
    setFormattedText: Action<StoreModel, string>;

    parsed: Ast.Root | null;
    setParsed: Action<StoreModel, Ast.Root | null>;

    prettierDoc: string;
    setPrettierDoc: Action<StoreModel, string>;

    html: string;
    setHtml: Action<StoreModel, string>;

    parseError: ParseError | string | null;
    setParseError: Action<StoreModel, ParseError | string | null>;

    applyLints: boolean;
    setApplyLints: Action<StoreModel, boolean>;
    lints: string[];

    jsonAst: Computed<StoreModel, string>;

    debug: {
        currDisplay: {
            pegGrammar: boolean;
            parsedAst: boolean;
            ast: boolean;
            doc: boolean;
            formatted: boolean;
        };
        setCurrDisplay: Action<
            StoreModel["debug"],
            Partial<StoreModel["debug"]["currDisplay"]>
        >;
        displayCode: Record<
            keyof StoreModel["debug"]["currDisplay"],
            {
                code: string;
            }
        >;
        setDisplayCode: Action<
            StoreModel["debug"],
            Partial<StoreModel["debug"]["displayCode"]>
        >;
    };
}
