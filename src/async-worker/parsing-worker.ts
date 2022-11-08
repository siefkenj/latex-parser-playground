import * as Comlink from "comlink";
import * as Ast from "@unified-latex/unified-latex-types";
// @ts-ignore
import Prettier from "prettier/esm/standalone.mjs";
import { prettierPluginLatex } from "@unified-latex/unified-latex-prettier";
import { parse } from "@unified-latex/unified-latex-util-parse";
import { convertToHtml } from "@unified-latex/unified-latex-to-hast";
import { decorateArrayForPegjs } from "@unified-latex/unified-latex-util-pegjs";

// @ts-ignore
import peg from "pegjs";

// Needed to print the prettier Doc
import prettierPluginBabel from "prettier/parser-babel";
// @ts-ignore
//import globalthisgenrator from "globalthis";

import { fixAllLints, getLints } from "../linter";

/**
 * Format `source` LaTeX code using Prettier to format/render
 * the code.
 *
 * @export
 * @param [source=""] - code to be formatted
 * @param [options={}] - Prettier options object (you can set `printWidth` here)
 * @returns formatted code
 */
export function printPrettier(source = "", options = {}) {
    return Prettier.format(source, {
        printWidth: 80,
        useTabs: true,
        ...options,
        parser: "latex-parser",
        plugins: [prettierPluginLatex],
    });
}

const prettierPluginLatexWithLint = {
    ...prettierPluginLatex,
    printers: {
        "latex-ast": {
            ...(prettierPluginLatex.printers?.["latex-ast"] || {}),
            preprocess: (ast: Ast.Root, options: any) => {
                const ret = fixAllLints(ast);
                return ret;
            },
        },
    },
};
export function printPrettierWithLints(source = "", options = {}) {
    return Prettier.format(source, {
        printWidth: 80,
        useTabs: true,
        useCache: false,
        ...options,
        parser: "latex-parser",
        plugins: [prettierPluginLatexWithLint],
    });
}

// XXX globalThis needs a polyfill, otherwise CRA will silently error on build!
//var globalThis = globalthisgenrator();

const exposed = {
    format(
        texInput: string,
        options: { printWidth?: number; fixLints?: boolean } = {}
    ) {
        let output: string;
        output = options.fixLints
            ? printPrettierWithLints(texInput, options)
            : printPrettier(texInput, options);

        return output;
    },
    formatWithLints(texInput: string, options = {}) {
        const output = printPrettierWithLints(texInput, options);

        return output;
    },
    formatAsHtml(texInput: string, options = {}) {
        let output = parse(texInput);
        return convertToHtml(output);
    },
    parse(texInput: string, options = {}) {
        const output = parse(texInput);
        return output;
    },
    getLints(texInput: string) {
        const parsed = exposed.parse(texInput);
        return getLints(parsed);
    },
    // There are extra parsers made for parsing the AST.
    // This function will first parse to an AST and then
    // run the additional parser.
    parseWithAstParser(
        texInput: string,
        options: { parser?: string; parserSource?: string | null } = {
            parser: "parseAlignEnvironment",
            parserSource: null,
        }
    ) {
        const { parserSource } = options;

        // We are going to run PEG on an AST (instead of a string),
        // So first generate the AST
        let ast: Ast.Ast | null = null;
        try {
            ast = parse(texInput);
        } catch (e: any) {
            e.message = "Failed to parse LaTeX source " + e.message;
            throw e;
        }
        // A parsed AST is wrapped in a type === "root" node.
        // We want to operate on the contents array instead,
        // so unwrap it.
        if (ast.type === "root") {
            ast = ast.content;
        }

        // If `parserSource` is given, use Pegjs to generate a parser
        let parser: ReturnType<typeof peg.generate> | null = null;
        try {
            parser = peg.generate(parserSource);
        } catch (e: any) {
            e.message = "Failed to create Pegjs parser " + e.message;
            throw e;
        }
        if (!parser) {
            throw new Error("Received null create Pegjs parser");
        }

        // Before we run the parser, we want to pass in some functions
        // for manipulating ASTs. These are made global variables, because
        // there isn't another way to make them available to the parser...
        //Object.assign(globalThis, latexParser.astParsers.utils);

        const output = parser.parse(decorateArrayForPegjs(ast), {}) as Ast.Ast;
        //const output = latexParser.astParsers[parserName](ast);
        return output;
    },
    parseToDoc(texInput: string, options = {}) {
        const doc = Prettier.__debug.printToDoc(texInput, {
            ...options,
            parser: "latex-parser",
            plugins: [prettierPluginLatex],
        });

        const output: string = Prettier.__debug.formatDoc(doc, {
            parser: "babel",
            plugins: [prettierPluginBabel],
        });

        return output;
    },
};

export type Exposed = typeof exposed;

// We are exporting `void`, but we have to export _something_ to get the module to work correctly
export default Comlink.expose(exposed);
