import * as Comlink from "comlink";
import Prettier from "prettier/esm/standalone.mjs";
import { prettierPluginLatex } from "@unified-latex/unified-latex-prettier";
import { parse } from "@unified-latex/unified-latex-util-parse";
import { convertToHtml } from "@unified-latex/unified-latex-to-hast";
import { decorateArrayForPegjs } from "@unified-latex/unified-latex-util-pegjs";

import peg from "pegjs";

// Needed to print the prettier Doc
import prettierPluginBabel from "prettier/parser-babel";
import globalthisgenrator from "globalthis";
import { fixAllLints } from "../linter.ts";

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
            ...prettierPluginLatex.printers["latex-ast"],
            preprocess: (ast, options) => {
                // XXX For some reason the parsing isn't working right in prettier...so we will
                // do it again ourselves. Very inefficient!
                ast = parse(options.originalText);
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
var globalThis = globalthisgenrator();

const obj = {
    format(texInput, options = {}) {
        const output = printPrettier(texInput, options);

        return output;
    },
    formatWithLints(texInput, options = {}) {
        const output = printPrettierWithLints(texInput, options);

        return output;
    },
    formatAsHtml(texInput, options = {}) {
        let output = parse(texInput, options);
        //       output = latexAstParser.tools.fixAllLints(output);
        output = convertToHtml(output, { wrapPars: true });

        return output;
    },
    parse(texInput, options = {}) {
        const output = parse(texInput, options);

        return output;
    },
    // There are extra parsers made for parsing the AST.
    // This function will first parse to an AST and then
    // run the additional parser.
    parseWithAstParser(
        texInput,
        options = {
            parser: "parseAlignEnvironment",
            parserSource: null,
        }
    ) {
        const { parserSource } = options;

        // We are going to run PEG on an AST (instead of a string),
        // So first generate the AST
        let ast = null;
        try {
            ast = parse(texInput, options);
        } catch (e) {
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
        let parser = null;
        try {
            parser = peg.generate(parserSource);
        } catch (e) {
            e.message = "Failed to create Pegjs parser " + e.message;
            throw e;
        }

        // Before we run the parser, we want to pass in some functions
        // for manipulating ASTs. These are made global variables, because
        // there isn't another way to make them available to the parser...
        //Object.assign(globalThis, latexParser.astParsers.utils);

        const output = parser.parse(decorateArrayForPegjs(ast), {});
        //const output = latexParser.astParsers[parserName](ast);
        return output;
    },
    parseToDoc(texInput, options = {}) {
        const doc = Prettier.__debug.printToDoc(texInput, {
            ...options,
            parser: "latex-parser",
            plugins: [prettierPluginLatex],
        });

        const output = Prettier.__debug.formatDoc(doc, {
            parser: "babel",
            plugins: [prettierPluginBabel],
        });

        return output;
    },
};

Comlink.expose(obj);
