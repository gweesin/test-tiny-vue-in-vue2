/**
 * 文件夹操作脚本
 * User: ysj
 * Date: 13-4-22
 * Time: 下午12:01
 */
var fs = require("fs"),
  util = require("util"),
  _ = require("lodash"),
  path = require("path");

/**
 * 递归获取文件夹中某个后缀名的文件，返回路径列表
 * @param {String} origin 原始目录
 * @param {String} extension 需要的文件扩展名, 例如.js
 * @param {Array} list 文件名列表
 * @param {Array} blackList 不进行获取的文件夹名称
 * @param {boolean} noRecur 不对文件夹进行递归
 */
var extList = (exports.extList = function (
  origin,
  extension,
  list,
  blackList,
  noRecur
) {
  if (!list) list = [];
  if (!blackList) blackList = [];
  if (!fs.existsSync(origin)) {
    console.log("file deleted", origin + "is not exist......");
    return list;
  }
  if (_.isString(extension)) {
    extension = [extension];
  }
  //异步读取目录中的内容，把非黑名单中的目录或者文件复制到目标目录下
  var datalist = fs.readdirSync(origin);
  for (var i = 0; i < datalist.length; i++) {
    var curData = datalist[i];
    var oCurrent = path.join(origin, curData);
    var basename = path.basename(oCurrent);
    var isValid = true;
    var isDir = fs.statSync(oCurrent).isDirectory();
    if (
      _.find(blackList, function (file) {
        return file === curData;
      }) &&
      isDir
    ) {
      //如果当前的目录名或者文件名与黑名单相同，则跳出次循环
      isValid = false;
      continue;
    }
    if (isValid) {
      //如果当前是文件,则写入到对应的目标目录下
      var extName = path.extname(basename);
      if (
        fs.statSync(oCurrent).isFile() &&
        _.find(extension, function (ext) {
          return extName === ext;
        })
      ) {
        list.push(oCurrent);
      }
      //如果是目录，则递归
      else if (isDir && !noRecur) {
        extList(oCurrent, extension, list, blackList);
      }
    }
  }
  return list;
});

/**
 * nodejs 复制文件夹
 * @param {String} origin 原始目录，即待复制的目录
 * @param {String} target 目标目录
 * @param {String} blacklist 黑名单
 * @param {function} callBack
 */
var copy = (exports.copy = function (origin, target, blacklist, callback) {
  //如果原始目录不存在，则推出
  var bak = ["~"]; //linux中~符号会报错， 将此类文件名排除
  if (!blacklist || !blacklist instanceof Array) blacklist = bak;
  else blacklist.push("~");
  if (!fs.existsSync(origin)) {
    console.log(origin + "is not exist......");
  }
  //如果目标目录不存在就创建一个
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }
  //异步读取目录中的内容，把非黑名单中的目录或者文件复制到目标目录下
  var datalist = fs.readdirSync(origin);
  for (var i = 0; i < datalist.length; i++) {
    //是否通过黑名单验证
    var isValid = true;
    //console.log(datalist[i]);
    for (var j = 0; j < blacklist.length; j++) {
      //如果当前的目录名或者文件名与黑名单相同，则跳出次循环
      if (datalist[i] == blacklist[j]) {
        isValid = false;
        break;
      }
    }
    //如果通过黑名单验证
    if (isValid) {
      var oCurrent = path.join(origin, datalist[i]);
      var tCurrent = path.join(target, datalist[i]);
      //console.log(fs.statSync(origin + '/' + datalist[i]).isFile());

      //如果当前是文件,则写入到对应的目标目录下   tgz文件无法读文件属性
      if (
        path.extname(path.basename(oCurrent)) == ".tgz" ||
        fs.statSync(oCurrent).isFile()
      ) {
        fs.writeFileSync(tCurrent, fs.readFileSync(oCurrent, ""), "");
      }
      //如果是目录，则递归
      else if (fs.statSync(oCurrent).isDirectory()) {
        copy(oCurrent, tCurrent, blacklist);
      }
    }
  }
  if (callback) callback();
});

/**
 * 异步删除文件夹
 * @Param filepath 文件夹地址
 * @Param callback 回调
 * @Param deleteRoot 是否删除根文件夹（默认为删除）
 */
var rmTree = (exports.rmTree = function (filepath, callback, deleteRoot) {
  fs.exists(filepath, function (exists) {
    if (!exists || !fs.statSync(filepath).isDirectory()) return callback(); //如果文件路径不存在或文件路径不是文件夹则直接返回
    fs.readdir(filepath, function (err, files) {
      if (err) return callback(err);
      var fullNames = files.map(function (file) {
        return path.join(filepath, file);
      }); //根据文件夹下的每个文件的完全路径创建一个数组
      getFilesStats(fullNames, fs.stat, function (err, stats) {
        //获取文件夹下的文件的属性
        var files = [];
        var dirs = [];
        for (var i = 0; i < fullNames.length; i++) {
          //不要使用 for in 来遍历，如果有空值，会不一一对应
          if (stats[i]) {
            if (stats[i].isDirectory()) {
              dirs.push(fullNames[i]);
            } else {
              files.push(fullNames[i]);
            }
          }
        }
        serial(files, fs.unlink, function (err) {
          //先删文件，后删文件夹
          if (err) return callback(err);
          serial(dirs, rmTree, function (err) {
            if (err) return callback(err);
            if (!deleteRoot) fs.rmdir(filepath, callback); //最后删除根文件夹
            else {
              callback();
            }
          });
        });
      });
    });
  });
});

//同步删除文件夹
var rmTreeSync = (exports.rmTreeSync = function (dir, keepRoot) {
  //如果文件路径不存在或文件路径不是文件夹则直接返回
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  var files = fs.readdirSync(dir);
  //如果文件夹为空则直接删除
  if (!files.length) {
    fs.rmdirSync(dir);
    return;
  } else {
    //文件夹不为空，依次删除文件夹下的文件
    files.forEach(function (file) {
      var fullName = path.join(dir, file);
      if (fs.statSync(fullName).isDirectory()) {
        rmTreeSync(fullName);
      } else {
        fs.unlinkSync(fullName);
      }
    });
  }
  if (!keepRoot) {
    //最后删除根文件夹
    fs.rmdirSync(dir);
  }
});

/**
 * 拷贝文件
 * @Param src 源文件
 * @Param dst 目标文件
 * @Param callback
 */
exports.copySingleFile = function (src, dst) {
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(dst);
  is.pipe(os);
};
//获取文件的属性
function getFilesStats(list, stat, callback) {
  if (!list.length) return callback(null, []);
  var copy = list.concat(); //concat 中无参数，相当于拷贝一份数组，而不是引用数组
  var statArray = [];
  stat(copy.shift(), function handler(err, stats) {
    //handle 函数亮了。如果我写的话，我会把 handler 单独写出去，这样的话，还得传一个 copy 参数，麻烦
    statArray.push(stats);
    if (copy.length) {
      stat(copy.shift(), handler);
    } else {
      callback(null, statArray);
    }
  });
}

//删除文件
function serial(list, rmfile, callback) {
  if (!list.length) return callback(null, []);
  var copy = list.concat();
  rmfile(copy.shift(), function handler(err) {
    if (err) return callback(err);
    if (copy.length) {
      rmfile(copy.shift(), handler);
    } else {
      callback(null);
    }
  });
}
//判断文件夹是否存在，如果不存在逐级新建
var existsDirMkdir = (exports.existsDirMkdir = function (dir) {
  if (!fs.existsSync(dir)) {
    var basename = path.dirname(dir);
    if (!fs.existsSync(basename)) {
      existsDirMkdir(basename);
    }
    fs.mkdirSync(dir);
  }
});

var deleteAll = (exports.deleteAll = function (dpath) {
  var files = [];
  if (fs.existsSync(dpath)) {
    files = fs.readdirSync(dpath);
    files.forEach(function (file, index) {
      var curPath = path.join(dpath, file);
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteAll(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dpath);
  }
});

/**
 * 将指定src目录下的所有文件剪切到指定目标dest目录下
 * @param src 源目录
 * @param dest 目标目录
 */
var copyDirectory = (exports.copyDirectory = function (src, dest) {
  var files = fs.readdirSync(src);
  files.forEach((item, index) => {
    var itemPath = path.join(src, item);
    var itemStat = fs.statSync(itemPath); // 获取文件信息
    var savedPath = path.join(dest, itemPath.replace(src, ""));
    var savedDir = savedPath.substring(0, savedPath.lastIndexOf(path.sep)); // 根据系统获取分隔符
    if (itemStat.isFile()) {
      // 如果目录不存在则进行创建
      if (!fs.existsSync(savedDir)) {
        fs.mkdirSync(savedDir, { recursive: true });
      }
      // 写入到新目录下
      var data = fs.readFileSync(itemPath);
      fs.writeFileSync(savedPath, data);
      // 并且删除原文件
      fs.unlinkSync(itemPath);
    } else if (itemStat.isDirectory()) {
      copyDirectory(itemPath, path.join(savedDir, item));
    }
  });
  // 并且删除原目录
  fs.rmdirSync(src);
});
