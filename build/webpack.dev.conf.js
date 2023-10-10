"use strict";
const utils = require("./utils");
const webpack = require("webpack");
const _ = require("lodash");
const config = require("../config");
const merge = require("webpack-merge");
const path = require("path");
const fs = require("fs");
const baseWebpackConfig = require("./webpack.base.conf");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FriendlyErrorsPlugin = require("@soda/friendly-errors-webpack-plugin");
const portfinder = require("portfinder");
const { VueLoaderPlugin } = require("vue-loader");
const HappyPack = require("happypack");
const os = require("os");
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const createHappyPlugin = (id, loaders) =>
  new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,
    verbose: process.env.HAPPY_VERBOSE === "1", // make happy more verbose with HAPPY_VERBOSE=1
  });

const HOST = process.env.HOST;
const PORT = process.env.PORT && Number(process.env.PORT);

let devPath = path.join(__dirname, "dev.json");
let needEntry = JSON.parse(fs.readFileSync(devPath).toString());
let pluginsConfig = [
  new webpack.DefinePlugin({
    "process.env": require("../config/dev.env"),
  }),
  new VueLoaderPlugin(),

  // createHappyPlugin('babel', [
  //     {
  //         loader: 'babel-loader',
  //         options: {
  //             babelrc: true,
  //             cacheDirectory: true // 启用缓存
  //         }
  //     }
  // ]),
  new HappyPack({
    loaders: [
      {
        path: "vue-loader",
        query: {
          loaders: {
            scss: "vue-style-loader!css-loader!postcss-loader!sass-loader?indentedSyntax",
          },
        },
      },
    ],
  }),
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
  const entryArr = _.keys(entry);
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
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  devServer: {
    hot: "only",
    liveReload: false,
    client: {
      logging: "warn",
      overlay: config.dev.errorOverlay
        ? { warnings: false, errors: true }
        : false,
    },
    static: {
      directory: path.join(__dirname, "../src"),
      watch: true,
    },
    devMiddleware: {
      publicPath: config.dev.assetsPublicPath,
    },
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    proxy: config.dev.proxyTable,
  },
  plugins: pluginsConfig,
  //警告 webpack 的性能提示
  performance: {
    hints: "warning",
    //入口起点的最大体积
    maxEntrypointSize: 5000000000,
    //生成文件的最大体积
    maxAssetSize: 3000000000,
    //只给出 js 文件的性能提示
    assetFilter: function (assetFilename) {
      return assetFilename.endsWith(".js");
    },
  },
});

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port;
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err);
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port;
      // add port to devServer config
      devWebpackConfig.devServer.port = port;

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(
        new FriendlyErrorsPlugin({
          compilationSuccessInfo: {
            messages: [
              `Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`,
            ],
          },
          onErrors: config.dev.notifyOnErrors
            ? utils.createNotifierCallback()
            : undefined,
        })
      );

      resolve(devWebpackConfig);
    }
  });
});
