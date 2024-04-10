import { defineConfig } from 'vite'
import path from 'path'
import { allowHtml } from './plugins/html-extension';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [allowHtml()],
    resolve: {
        extensions: ['.mjs', '.js', '.mts', '.ts', '.json', '.html'],
        alias: {
            "nasturtium": path.join(__dirname, "../../src")
        }
    },
});
