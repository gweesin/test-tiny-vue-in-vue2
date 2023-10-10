"use strict";
const path = require("path");
const utils = require("./utils");
const files = require("./files");
const webpack = require("webpack");
const _ = require("lodash");
const config = require("../config");
const fs = require("fs");
const merge = require("webpack-merge");
const baseWebpackConfig = require("./webpack.base.conf");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HappyPack = require("happypack");
const env = require("../config/prod.env");

let getRepeatPath = function (num, path) {
  // 获取重复路径
  num -= 1;
  num = num < 0 ? 0 : num;
  return Array.apply(null, new Array(num))
    .map(function () {
      return path || "../";
    })
    .join("");
};
let configPublicPath = config.build.assetsPublicPath;
let pathLen = configPublicPath.split("/").length - 1;
let chunkFilename =
  "css/" + getRepeatPath(pathLen, "[name]/") + "[name].[chunkhash:7].css";
let pluginsConfig = [
  // http://vuejs.github.io/vue-loader/en/workflow/production.html
  new webpack.DefinePlugin({
    "process.env": env,
  }),

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

  // extract css into its own file
  new MiniCssExtractPlugin({
    filename: (pathData) => {
      // 根据文件相对路径调整css编译后的路径
      let path = "css/[name].[chunkhash:7].css";
      if (pathData.chunk.name && pathData.chunk.name.indexOf("/") !== -1) {
        let pName = pathData.chunk.name.split("/");
        let pNameLen = pName.length;
        path =
          "css/" +
          pName.slice(pNameLen - pathLen, pNameLen).join("/") +
          ".[chunkhash:7].css";
      }
      return utils.assetsPath(path);
    },
    chunkFilename: utils.assetsPath(chunkFilename),
    ignoreOrder: true,
  }),

  new VueLoaderPlugin(),
];

const extPath = path.join(__dirname, "../src/release_ext");
let vueConfig = utils.readVueConfig();
let pages = vueConfig.pages;
if (!fs.existsSync(extPath)) {
  fs.mkdirSync(extPath);
} else {
  files.rmTreeSync(extPath, true);
}
const srPath = path.join(__dirname, "../src");
const entry = baseWebpackConfig.entry;
_.each(pages, function (pObj) {
  let sPath = path.join(srPath, pObj.sourceHtml);
  let dPath = path.join(extPath, pObj.dist);
  let jPath = pObj.sourceJs.replace(/.js$/, "");
  pluginsConfig.push(
    new HtmlWebpackPlugin({
      template: sPath,
      filename: dPath,
      inject: true,
      chunks: [jPath],
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      publicPath: getRepeatPath(jPath.split("/").length),
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      // chunksSortMode: 'dependency'
    })
  );
});

let configPath = path.join(srPath, "config.js");
if (fs.existsSync(configPath)) {
  let distConfigPath = path.join(extPath, "config.js");
  pluginsConfig.push(
    new CopyWebpackPlugin([
      {
        from: configPath,
        to: distConfigPath,
        ignore: [".*"],
      },
    ])
  );
}

let i18nPath = path.join(srPath, "locale");
if (fs.existsSync(i18nPath)) {
  let distI18nPath = path.join(extPath, "locale");
  pluginsConfig.push(
    new CopyWebpackPlugin([
      {
        from: i18nPath,
        to: distI18nPath,
        ignore: [".*"],
      },
    ])
  );
}

// const DynamicAliasPlugin = {
//     apply(compiler) {
//         compiler.hooks.normalModuleFactory.tap('DynamicAliasPlugin', nmf => {
//             nmf.hooks.beforeResolve.tap('DynamicAliasPlugin', result => {
//                 if (result.request !== '@opentiny/vue' && result.request.startsWith('@opentiny/vue')) {
//                     // 如果请求以 'b/' 开头，执行动态别名映射
//                     // const moduleName = result.request.replace(/^b\//, '');
//                     // result.request = `b/${moduleName}.js`; // 将请求重定向到正确的文件
//                     result.request = result.request + '.js';
//                 }
//                 return result;
//             });
//         });
//     }
// };

// pluginsConfig.push(DynamicAliasPlugin);

const webpackConfig = merge(baseWebpackConfig, {
  mode: "production",
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    path: extPath,
    filename: utils.assetsPath("js/[name].[chunkhash:7].js"),
    chunkFilename: utils.assetsPath("js/[id].[chunkhash:7].js"),
  },
  plugins: pluginsConfig,
  optimization: {
    splitChunks: {
      chunks: "async", //指定打包同步加载还是异步加载
      minSize: 30000, //构建出来的chunk大于30000才会被分割
      maxSize: 3000000, //会尝试根据这个大小进行代码分割
      minChunks: 1, //制定用了几次才进行代码分割
      minRemainingSize: 0,
      maxAsyncRequests: 6,
      maxInitialRequests: 4,
      automaticNameDelimiter: "_", //文件生成的连接符
      cacheGroups: {
        components: {
          name: "components",
          test: /[\\/]node_modules[\\/]xyz-vue-*/, //符合组的要求就给构建venders
          chunks: "all",
        },
        vendors: {
          name: `chunk-vendors`,
          test: /[\\/]node_modules[\\/]/, //符合组的要求就给构建venders
          priority: -10, //优先级用来判断打包到哪个里面去
          chunks: "initial", //指定chunks名称
          reuseExistingChunk: true, //检查之前是否被引用过有的话就不被打包了
        },
        commons: {
          name: "commons",
          chunks: "initial",
          minChunks: 2,
        },
        styles: {
          name: "styles",
          test: /\.css$/,
          chunks: "all",
          enforce: true,
        },
      },
    },
    runtimeChunk: true,
    minimizer: [
      new TerserPlugin({ parallel: true }),
      new CssMinimizerPlugin({ parallel: true }),
    ],
  },
  //警告 webpack 的性能提示
  performance: {
    hints: "warning",
    //入口起点的最大体积
    maxEntrypointSize: 50000000000,
    //生成文件的最大体积
    maxAssetSize: 30000000000,
    //只给出 js 文件的性能提示
    assetFilter: function (assetFilename) {
      return assetFilename.endsWith(".js");
    },
  },
});

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require("compression-webpack-plugin");

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: new RegExp(
        "\\.(" + config.build.productionGzipExtensions.join("|") + ")$"
      ),
      threshold: 10240,
      minRatio: 0.8,
    })
  );
}

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin =
    require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
  webpackConfig.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = webpackConfig;
