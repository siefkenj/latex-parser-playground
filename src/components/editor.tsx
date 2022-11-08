import React from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { linter, LintSource, Diagnostic } from "@codemirror/lint";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";

import { useStoreActions, useStoreState } from "../store/hooks";
import { isParseError, ParseError } from "../async-worker/errors";
import { VFile } from "vfile";

const latexSyntaxHighlight = StreamLanguage.define(stex);

/**
 * CodeMirror has its own state management system. However, we want to use React's state management
 * to control when/what lints are displayed. `lintFactory` creates functions to "break out" of CodeMirror's
 * system and allows us to set the lints by calling the `setLint` function of the return value.
 *
 * The `linProcessor` function should be passed to CodeMirror's `linter(...)` function. CodeMirror
 * will call `lintProcessor` when it feels like.
 *
 * @returns
 */
function lintFactory() {
    const currentLints: Diagnostic[] = [];
    const setLint = (
        parseError: ParseError | string | null | VFile["messages"]
    ): void => {
        if (isParseError(parseError)) {
            currentLints.length = 0;
            currentLints.push({
                from: parseError.location.start.offset,
                to: parseError.location.end.offset,
                severity: "error",
                message: parseError.desc,
            });
            return;
        }
        if (Array.isArray(parseError)) {
            const lints = parseError;
            currentLints.length = 0;
            for (const lint of lints) {
                currentLints.push({
                    from: lint.position?.start.offset || 0,
                    to: lint.position?.end.offset || 0,
                    severity: "warning",
                    message: lint.message,
                });
            }
            return;
        }
        currentLints.length = 0;
    };
    const lintProcessor: LintSource = () => {
        return currentLints;
    };
    return { setLint, lintProcessor };
}
const { setLint, lintProcessor } = lintFactory();

const latexLinter = linter(lintProcessor);

export function Editor() {
    const editorText = useStoreState((state) => state.editorText);
    const editorChange = useStoreActions((actions) => actions.editorChange);
    const editorRef = React.useRef<HTMLDivElement>(null);
    const lints = useStoreState((state) => state.lints);
    useCodeMirror({
        container: editorRef.current,
        value: editorText,
        onChange: (text) => editorChange(text),
        extensions: [latexLinter, latexSyntaxHighlight],
        height: "100%",
    });
    const parseError = useStoreState((state) => state.parseError);

    React.useEffect(() => {
        if (parseError) {
            setLint(parseError);
        } else {
            setLint(lints);
        }
    }, [parseError, lints]);

    return <div className="editor-container" ref={editorRef} />;
}
