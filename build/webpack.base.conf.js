"use strict";
const path = require("path");
const fs = require("fs");
const utils = require("./utils");
const _ = require("lodash");
const config = require("../config");
const vueLoaderConfig = require("./vue-loader.conf");

function resolve(dir) {
  return path.join(__dirname, "..", dir);
}

var isProduct = process.env.NODE_ENV === "production";
//根据vue.json自动写入entry
var vueConfig = utils.readVueConfig();
var pages = vueConfig.pages;
var entry = {};
let devPath = path.join(__dirname, "dev.json");
let needEntry = [];
if (fs.existsSync(devPath)) {
  needEntry = JSON.parse(fs.readFileSync(devPath).toString());
}
if (!isProduct && needEntry.length) {
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
} else {
  _.each(pages, function (pObj) {
    var sJs = pObj.sourceJs;
    var outName = sJs.replace(/.js$/, "");
    entry[outName] = "./src/" + sJs;
  });
}

let webpackConfig = {
  context: path.resolve(__dirname, "../"),
  entry: entry,
  output: {
    path: config.build.assetsRoot,
    filename: "[name].js",
    publicPath: isProduct
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath,
  },
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
        test: /\.m?js$/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
        include: path.resolve("src"),
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
        test: /\.s[ac]ss$/i,
        exclude: /\.d\.scss$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
              sassOptions: {
                fiber: false,
                charset: false,
                outputStyle: "expanded",
              },
            },
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
        generator: {
          filename: utils.assetsPath("img/[name].[hash:7].[ext]"),
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        type: "asset/resource",
        generator: {
          filename: utils.assetsPath("media/[name].[hash:7].[ext]"),
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        type: "asset/inline",
      },
    ],
  },
};

module.exports = webpackConfig;
