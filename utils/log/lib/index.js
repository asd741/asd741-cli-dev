"use strict";
const log = require("npmlog");
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"; //判斷debug模式
log.heading = "asd741-log"; //修改前綴
log.headingStyle = { fg: "blue", bg: "black" };
log.addLevel("success", 2000, { fg: "green", bold: true }); //添加自定義命令
module.exports = log;
