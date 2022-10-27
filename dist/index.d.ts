import { PluginOption } from 'vite';

interface Config {
    idPrefix?: string;
    viewBox?: string;
    /**
     * Optimize the generated SVG sprite with SVGO.
     * @default true
     */
    optimize?: boolean;
    /**
     * SVGO options.
     * @default {
        plugins: [
            { name: "removeViewBox", active: false },
            { name: "removeAttrs", params: { attrs: "(stroke|fill|style|class)" } }
        ]
       }
     */
    svgoOptions?: any;
    arrayFile?: boolean;
    arrayFileOptions?: {
        name: string;
        dest: string;
        typescript?: boolean;
    };
    root?: string;
}
declare const _default: (path: string, dest: string, name: string, config?: Config) => PluginOption;

export { Config, _default as default };
