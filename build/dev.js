const fs = require("fs"),
  path = require("path");
childProcess = require("child_process");

let argv = process.argv;
let needEntryStr = argv[2];
let needEntry = needEntryStr ? needEntryStr.split(",") : [];
let devConfigPath = path.join(__dirname, "dev.json");
fs.writeFileSync(devConfigPath, JSON.stringify(needEntry, null, 4));
let cwdPath = path.join(__dirname, "..");
var pro = childProcess.exec("pnpm run server", {
  cwd: cwdPath,
  maxBuffer: 10240 * 10240,
});
pro.stdout.on("data", (data) => {
  console.log(data);
});

pro.stderr.on("data", (data) => {
  console.log(data);
});
