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
        },
    },
    build: {
        rollupOptions: {
            plugins: [nodeResolve]
        }
    }
});
