"use strict";
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const config = require("../config");
const packageConfig = require("../package.json");

exports.assetsPath = function (_path) {
  const assetsSubDirectory =
    process.env.NODE_ENV === "production"
      ? config.build.assetsSubDirectory
      : config.dev.assetsSubDirectory;

  return path.posix.join(assetsSubDirectory, _path);
};

exports.cssLoaders = function (options) {
  options = options || {};

  const cssLoader = {
    loader: "css-loader",
    options: {
      sourceMap: options.sourceMap,
    },
  };

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    const loaders = [cssLoader];

    if (loader) {
      loaders.push({
        loader: loader + "-loader",
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap,
        }),
      });
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    return ["vue-style-loader"].concat(loaders);
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    less: generateLoaders("less"),
    sass: generateLoaders("sass", { indentedSyntax: true }),
    scss: generateLoaders("sass"),
    stylus: generateLoaders("stylus"),
    styl: generateLoaders("stylus"),
  };
};

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  const output = [];
  const loaders = exports.cssLoaders(options);

  for (const extension in loaders) {
    const loader = loaders[extension];
    output.push({
      test: new RegExp("\\." + extension + "$"),
      use: loader,
    });
  }

  return output;
};

exports.readVueConfig = function () {
  const vueConfigPath = path.join(__dirname, "../src/vue.json");
  if (!fs.existsSync(vueConfigPath)) {
    console.log("缺少vue.json文件!");
    process.exit(1);
  }
  let vueConfig;
  try {
    vueConfig = JSON.parse(fs.readFileSync(vueConfigPath).toString());
  } catch (e) {
    console.log("vue.json格式不正确!");
    process.exit(1);
  }
  let pages = vueConfig.pages;
  if (!pages) {
    console.log("vue.json缺少pages配置!");
    process.exit(1);
  }
  let fPages = [];
  _.each(pages, function (pObj) {
    pObj.sourceJs =
      pObj.sourceJs.charAt(0) === "/"
        ? pObj.sourceJs.substring(0)
        : pObj.sourceJs;
    pObj.sourceHtml =
      pObj.sourceHtml.charAt(0) === "/"
        ? pObj.sourceHtml.substring(0)
        : pObj.sourceHtml;
    pObj.dist =
      pObj.dist.charAt(0) === "/" ? pObj.dist.substring(0) : pObj.dist;
    fPages.push(pObj);
  });
  vueConfig.pages = fPages;
  return vueConfig;
};
