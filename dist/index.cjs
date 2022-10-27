"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_path = require("path");
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_happy_dom = require("happy-dom");
var import_picocolors = __toESM(require("picocolors"), 1);
var import_imagemin = __toESM(require("imagemin"), 1);
var import_imagemin_svgo = __toESM(require("imagemin-svgo"), 1);
async function generateSprite(path, dest, name, idPrefix, viewBox) {
  const files = import_fs.default.readdirSync(path);
  const svgFiles = files.filter((file) => (0, import_path.extname)(file) === ".svg");
  const symbols = svgFiles.map((file) => {
    const name2 = (0, import_path.basename)(file, ".svg");
    const content = import_fs.default.readFileSync((0, import_path.join)(path, file), "utf8");
    const window2 = new import_happy_dom.Window();
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
  const window = new import_happy_dom.Window();
  const document = window.document;
  const svg = document.createElement("svg");
  svg.setAttribute("style", "display: none;");
  svg.innerHTML = symbols.map((symbol) => symbol.outerHTML).join("");
  const sprite = svg.outerHTML;
  removeFile(dest, name);
  !import_fs.default.existsSync(dest) && import_fs.default.mkdirSync(dest);
  import_fs.default.writeFileSync((0, import_path.join)(dest, name), sprite);
}
function removeFile(path, name) {
  const file = (0, import_path.resolve)(path, name);
  if (import_fs.default.existsSync(file)) {
    try {
      import_fs.default.unlinkSync((0, import_path.join)(path, name));
    } catch (err) {
      console.error(err);
    }
  }
}
async function optimizeSprite(path, name, options) {
  await (0, import_imagemin.default)([(0, import_path.join)(path, name)], {
    destination: path,
    plugins: [(0, import_imagemin_svgo.default)(options || null)]
  });
}
async function buildArrayFile(path, dest, name, typescript) {
  typescript && console.log("Typescript is not supported yet");
  removeFile(dest, name);
  !import_fs.default.existsSync(dest) && import_fs.default.mkdirSync(dest);
  let files = import_fs.default.readdirSync(path);
  let svgFiles = files.filter((file) => (0, import_path.extname)(file) === ".svg");
  svgFiles = files.map((file) => (0, import_path.basename)(file, ".svg"));
  import_fs.default.writeFileSync(
    (0, import_path.join)(dest, name),
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
    path = (0, import_vite.normalizePath)(path);
    watcher.add(path);
    watcher.on("change", async (file) => {
      if (file.startsWith(path) && (0, import_path.extname)(file) === ".svg") {
        await generateSprite(path, dest, name, idPrefix, viewBox);
        optimize && await optimizeSprite(dest, name, svgoOptions);
        arrayFile && await buildArrayFile(
          path,
          arrayFileOptions.dest,
          arrayFileOptions.name,
          arrayFileOptions.typescript
        );
        logger.info(
          `${import_picocolors.default.green("[vite-plugin-svg-sprite]")}: ${import_picocolors.default.dim(
            (0, import_path.relative)(root, file)
          )} updated.`,
          { clear: false, timestamp: true }
        );
        ws.send({ type: "full-reload" });
      }
    });
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
