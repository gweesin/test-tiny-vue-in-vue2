"use strict";
const utils = require("./utils");
const webpack = require("webpack");
const _ = require("lodash");
const merge = require("webpack-merge");
const path = require("path");
const fs = require("fs");
const baseWebpackConfig = require("./webpack.base.conf");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

let devPath = path.join(__dirname, "dev.json");
let needEntry = JSON.parse(fs.readFileSync(devPath).toString());
let pluginsConfig = [
  new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: '"development"',
    },
  }),
  new VueLoaderPlugin(),
];

let vueConfig = utils.readVueConfig();
let pages = vueConfig.pages;
if (needEntry.length) {
  //配置需要调试的页面
  _.each(needEntry, function (_name) {
    var pObj = _.find(pages, function (_p) {
      return _p.name === _name;
    });
    if (pObj) {
      var sHtml = pObj.sourceHtml;
      pluginsConfig.push(
        new HtmlWebpackPlugin({
          filename: sHtml,
          template: "./src/" + sHtml,
          inject: true,
        })
      );
    }
  });
} else {
  //所有入口文件加载入调试
  const entry = baseWebpackConfig.entry;
  _.each(pages, function (pObj) {
    var sHtml = pObj.sourceHtml;
    let jPath = pObj.sourceJs.replace(/.js$/, "");
    pluginsConfig.push(
      new HtmlWebpackPlugin({
        filename: sHtml,
        template: "./src/" + sHtml,
        chunks: [jPath],
        inject: true,
      })
    );
  });
}
const devWebpackConfig = merge(baseWebpackConfig, {
  mode: "development",
  // cheap-module-eval-source-map is faster for development
  devtool: "eval-source-map",

  // these devServer options should be customized in /config/index.js
  devServer: {
    static: {
      directory: path.join(__dirname, "../src"),
      watch: true,
    },
  },
  plugins: pluginsConfig,
});

module.exports = devWebpackConfig;
