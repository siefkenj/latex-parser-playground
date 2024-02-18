/// <reference types="node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// `unified-latex-utils-parse` is as good a dep as any to check the version of unified-latex from
const packageJsonPath = path.join(
    require.resolve("@unified-latex/unified-latex-util-parse"),
    "..",
    "package.json"
);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const unifiedLatexVersion = packageJson.version as string;

export default defineConfig({
    base: "./",
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    build: {
        sourcemap: true,
        minify: false,
        outDir: "build",
    },
    define: {
        __UNIFIED_LATEX_VERSION__: "'" + unifiedLatexVersion + "'",
    },
    resolve: {
        conditions: ["worker"],
    },
});
