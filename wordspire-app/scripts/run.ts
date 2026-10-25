import { spawn } from "node:child_process";
import { getEnv } from "../src/lib/config/env";
getEnv();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...process.argv.slice(2)], { stdio: "inherit", env: process.env });
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
child.on("error", error => { throw error; });
child.on("exit", code => { process.exitCode = code ?? 1; });
