import { spawn } from "node:child_process";
import { once } from "node:events";
import { getEnv } from "../src/lib/config/env";

getEnv();
const args = process.argv.slice(2);
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], { stdio: "inherit", env: process.env });
const stop = (signal: NodeJS.Signals) => child.kill(signal);
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
  if (code === 0 && args[0] === "build" && process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
    await import("./migrate");
  }
} finally {
  process.off("SIGINT", stop);
  process.off("SIGTERM", stop);
}
