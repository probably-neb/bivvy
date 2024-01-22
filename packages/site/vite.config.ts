import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
    plugins: [solid()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            solid: "solid-js",
            "@kobalte/core": "kobalte-monorepo/packages/core/src/index",
            "@kobalte/utils": "kobalte-monorepo/packages/utils/src/index"
        },
    },
    build: {
        rollupOptions: {
            plugins: [nodeResolve({
                modulePaths: ['node_modules', '../']
            })]
        }
    }
});
