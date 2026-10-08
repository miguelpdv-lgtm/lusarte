// Arranca el MySQL portable de desarrollo (.local/). Ver docs/DESARROLLO.md.
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const dir = readdirSync(".local").find((d) => d.startsWith("mysql-") && d !== "mysql-data");
const bin = dir && `.local/${dir}/bin/mysqld${process.platform === "win32" ? ".exe" : ""}`;
if (!bin || !existsSync(bin)) {
  console.error("No encontré MySQL en .local/. Sigue los pasos de docs/DESARROLLO.md.");
  process.exit(1);
}
spawn(bin, ["--defaults-file=.local/my.ini", "--console"], { stdio: "inherit" });
