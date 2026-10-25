import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const sourceRoot = join(process.cwd(), "src");
const sourceFiles = [];

function collect(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) collect(path);
    else if (/\.(ts|tsx)$/.test(entry)) sourceFiles.push(path);
  }
}

collect(sourceRoot);
const violations = [];

for (const path of sourceFiles) {
  const source = readFileSync(path, "utf8");
  const name = relative(process.cwd(), path);
  if (name.startsWith("src/app/child/") || name.startsWith("src/components/child/")) {
    if (/<svg\b/i.test(source)) violations.push(`${name}: use the shared icon library instead of inline SVG`);
    if (/dangerouslySetInnerHTML/.test(source)) violations.push(`${name}: unsafe HTML injection is not allowed in child UI`);
  }
}

if (!sourceFiles.some((path) => path.endsWith("src/components/child/ChildShell.tsx"))) {
  violations.push("src/components/child/ChildShell.tsx: shared child shell is missing");
}

if (violations.length) {
  console.error(violations.map((item) => `✖ ${item}`).join("\n"));
  process.exit(1);
}

console.log(`WordSpire static lint passed (${sourceFiles.length} TypeScript files checked).`);
