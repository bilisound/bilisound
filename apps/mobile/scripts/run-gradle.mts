#!/usr/bin/env tsx

import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 获取命令行参数，去掉前两个（node 和脚本名）
const args = process.argv.slice(2);

// 根据操作系统确定要执行的命令
let command: string;
if (os.platform() === "win32") {
  command = ".\\gradlew.bat";
} else {
  command = "./gradlew";
}

// 设置 android 目录路径
const androidDir = path.resolve(__dirname, "../android");

// 使用 spawn 执行命令，并传入参数
const child = spawn(command, args, {
  stdio: "inherit",
  cwd: androidDir, // 设置工作目录为 android 目录
  shell: os.platform() === "win32",
});

// 处理子进程的退出
child.on("exit", code => {
  process.exit(code ?? 0);
});
