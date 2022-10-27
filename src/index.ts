import { resolve, extname, basename, join, relative } from "path";
import fs from "fs";
import { type PluginOption, type ViteDevServer, normalizePath } from "vite";
import { Window } from "happy-dom";
import colors from "picocolors";
import imagemin from "imagemin";
import imageminSvgo from "imagemin-svgo";

export interface Config {
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
	arrayFile?: boolean; // createArrayFile
	arrayFileOptions?: { name: string; dest: string; typescript?: boolean };
	root?: string;
}

async function generateSprite(
	path: string,
	dest: string,
	name: string,
	idPrefix: string | null,
	viewBox: string | null
) {
	const files = fs.readdirSync(path);
	const svgFiles = files.filter((file) => extname(file) === ".svg");

	const symbols = svgFiles.map((file) => {
		const name = basename(file, ".svg");

		const content = fs.readFileSync(join(path, file), "utf8");

		const window = new Window();
		const document = window.document;
		document.body.innerHTML = content;

		const svg = document.querySelector("svg");
		const graphic = svg.innerHTML;
		const svgViewBox = svg.getAttribute("viewBox");
		const symbol = document.createElement("symbol");

		symbol.setAttribute("id", idPrefix ? `${idPrefix}-${name}` : name);
		symbol.setAttribute("viewBox", viewBox || svgViewBox);
		symbol.innerHTML = graphic;
		return symbol;
	});

	const window = new Window();
	const document = window.document;
	const svg = document.createElement("svg");

	svg.setAttribute("style", "display: none;");
	svg.innerHTML = symbols.map((symbol) => symbol.outerHTML).join("");

	const sprite = svg.outerHTML;

	removeFile(dest, name);

	!fs.existsSync(dest) && fs.mkdirSync(dest);
	fs.writeFileSync(join(dest, name), sprite);
}

function removeFile(path: string, name: string) {
	const file = resolve(path, name);
	if (fs.existsSync(file)) {
		try {
			fs.unlinkSync(join(path, name));
		} catch (err) {
			console.error(err);
		}
	}
}

async function optimizeSprite(path: string, name: string, options: any) {
	await imagemin([join(path, name)], {
		destination: path,
		plugins: [imageminSvgo(options || null)],
	});
}

async function buildArrayFile(
	path: string,
	dest: string,
	name: string,
	typescript: boolean | undefined
) {
	typescript && console.log("Typescript is not supported yet");
	
	removeFile(dest, name);

	!fs.existsSync(dest) && fs.mkdirSync(dest);

	let files = fs.readdirSync(path);
	let svgFiles = files.filter((file) => extname(file) === ".svg");

	svgFiles = files.map((file) => basename(file, ".svg"));

	fs.writeFileSync(
		join(dest, name),
		`export default ${JSON.stringify(svgFiles)}`
	);
}

export default (
	path: string,
	dest: string,
	name: string,
	config: Config = {}
): PluginOption => ({
	name: "vite-plugin-svg-sprite",

	apply: "serve",

	config: () => ({ server: { watch: { disableGlobbing: false } } }),

	configureServer({ watcher, ws, config: { logger } }: ViteDevServer) {
		const {
			idPrefix = null,
			viewBox = null,
			optimize = true,
			svgoOptions = {
				plugins: [
					{ name: "removeViewBox", active: false },
					{
						name: "removeAttrs",
						params: { attrs: "(stroke|fill|style|class)" },
					},
				],
			},
			arrayFile = true,
			arrayFileOptions = {
				name: "icons.js",
				dest: "src",
				typescript: false,
			},
			root = process.cwd(),
		} = config;

		path = normalizePath(path);

		watcher.add(path);
		watcher.on("change", async (file) => {
			if (file.startsWith(path) && extname(file) === ".svg") {
				await generateSprite(path, dest, name, idPrefix, viewBox);

				optimize && (await optimizeSprite(dest, name, svgoOptions));

				arrayFile &&
					(await buildArrayFile(
						path,
						arrayFileOptions.dest,
						arrayFileOptions.name,
						arrayFileOptions.typescript
					));

				logger.info(
					`${colors.green("[vite-plugin-svg-sprite]")}: ${colors.dim(
						relative(root, file)
					)} updated.`,
					{ clear: false, timestamp: true }
				);
				ws.send({ type: "full-reload" });
			}
		});
	},
});
