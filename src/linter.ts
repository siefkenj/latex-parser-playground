import * as Ast from "@unified-latex/unified-latex-types";
import { unified } from "unified";
import { lints } from "@unified-latex/unified-latex-lint";
import { VFile } from "vfile";

function ensureRoot(ast: Ast.Node | Ast.Node[]): Ast.Root {
    if (Array.isArray(ast)) {
        return { type: "root", content: ast };
    } else if (ast.type === "root") {
        return ast;
    } else {
        return { type: "root", content: [ast] };
    }
}

export const fixAllLints = <T extends Ast.Node | Ast.Node[]>(tree: T): T => {
    let root = ensureRoot(tree);
    let processor = unified();
    for (const lint of Object.values(lints)) {
        processor = processor.use(lint as any, { fix: true });
    }
    const ret: Ast.Root = processor.runSync(root) as any;
    // We'd like to return the same type of node that we received.
    if (Array.isArray(tree)) {
        return ret.content as any;
    }
    if (tree.type === "root") {
        return ret as any;
    }
    return ret.content[0] as any;
};

/**
 * Run all lints and report the errors
 *
 * @param {(Ast.Node | Ast.Node[])} tree
 * @returns
 */
export const lintAll = (tree: Ast.Node | Ast.Node[]) => {
    tree = ensureRoot(tree);
    let file = new VFile();
    let processor = unified();
    for (const lint of Object.values(lints)) {
        processor = processor.use(lint as any);
    }
    processor.runSync(tree, file);
    const messages = file.messages.map((m) => ({ description: ""+m }));
    return messages;
};
