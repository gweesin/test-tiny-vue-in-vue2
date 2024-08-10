"use strict";
const path = require("path");
const fs = require("fs");
const utils = require("./utils");
const _ = require("lodash");

const vueLoaderConfig = {
  loaders: utils.cssLoaders(),
  transformToRequire: {
    video: ["src", "poster"],
    source: "src",
    img: "src",
    image: "xlink:href",
  },
};

function resolve(dir) {
  return path.join(__dirname, ".", dir);
}

//根据vue.json自动写入entry
var vueConfig = utils.readVueConfig();
var pages = vueConfig.pages;
var entry = {};
let devPath = path.join(__dirname, "dev.json");
let needEntry = [];
if (fs.existsSync(devPath)) {
  needEntry = JSON.parse(fs.readFileSync(devPath).toString());
}
if (needEntry.length) {
  _.each(needEntry, function (_name) {
    var pObj = _.find(pages, function (_p) {
      return _p.name === _name;
    });
    if (pObj) {
      var sJs = pObj.sourceJs;
      var outName = sJs.replace(/.js$/, "");
      entry[outName] = "./src/" + sJs;
    }
  });
}
let webpackConfig = {
  context: path.resolve(__dirname, "../"),
  entry: entry,
  resolve: {
    extensions: [".js", ".vue", ".json"],
    alias: {
      vue$: "vue/dist/vue.esm.js",
      "@": resolve("src"),
    },
    mainFields: ["main", "module"],
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.vue$/,
        use: [
          {
            loader: "vue-loader",
            options: vueLoaderConfig,
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.(png|jpe?g|gif|svg|cur)(\?.*)?$/,
        type: "asset/resource",
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        type: "asset/resource",
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        type: "asset/inline",
      },
    ],
  },
};

module.exports = webpackConfig;
