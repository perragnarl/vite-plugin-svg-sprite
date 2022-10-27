// src/index.ts
import { resolve, extname, basename, join, relative } from "path";
import fs from "fs";
import { normalizePath } from "vite";
import { Window } from "happy-dom";
import colors from "picocolors";
import imagemin from "imagemin";
import imageminSvgo from "imagemin-svgo";
async function generateSprite(path, dest, name, idPrefix, viewBox) {
  const files = fs.readdirSync(path);
  const svgFiles = files.filter((file) => extname(file) === ".svg");
  const symbols = svgFiles.map((file) => {
    const name2 = basename(file, ".svg");
    const content = fs.readFileSync(join(path, file), "utf8");
    const window2 = new Window();
    const document2 = window2.document;
    document2.body.innerHTML = content;
    const svg2 = document2.querySelector("svg");
    const graphic = svg2.innerHTML;
    const svgViewBox = svg2.getAttribute("viewBox");
    const symbol = document2.createElement("symbol");
    symbol.setAttribute("id", idPrefix ? `${idPrefix}-${name2}` : name2);
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
function removeFile(path, name) {
  const file = resolve(path, name);
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(join(path, name));
    } catch (err) {
      console.error(err);
    }
  }
}
async function optimizeSprite(path, name, options) {
  await imagemin([join(path, name)], {
    destination: path,
    plugins: [imageminSvgo(options || null)]
  });
}
async function buildArrayFile(path, dest, name, typescript) {
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
var src_default = (path, dest, name, config = {}) => ({
  name: "vite-plugin-svg-sprite",
  apply: "serve",
  config: () => ({ server: { watch: { disableGlobbing: false } } }),
  configureServer({ watcher, ws, config: { logger } }) {
    const {
      idPrefix = null,
      viewBox = null,
      optimize = true,
      svgoOptions = {
        plugins: [
          { name: "removeViewBox", active: false },
          {
            name: "removeAttrs",
            params: { attrs: "(stroke|fill|style|class)" }
          }
        ]
      },
      arrayFile = true,
      arrayFileOptions = {
        name: "icons.js",
        dest: "src",
        typescript: false
      },
      root = process.cwd()
    } = config;
    path = normalizePath(path);
    watcher.add(path);
    watcher.on("change", async (file) => {
      if (file.startsWith(path) && extname(file) === ".svg") {
        await generateSprite(path, dest, name, idPrefix, viewBox);
        optimize && await optimizeSprite(dest, name, svgoOptions);
        arrayFile && await buildArrayFile(
          path,
          arrayFileOptions.dest,
          arrayFileOptions.name,
          arrayFileOptions.typescript
        );
        logger.info(
          `${colors.green("[vite-plugin-svg-sprite]")}: ${colors.dim(
            relative(root, file)
          )} updated.`,
          { clear: false, timestamp: true }
        );
        ws.send({ type: "full-reload" });
      }
    });
  }
});
export {
  src_default as default
};
