import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeMonolith } from "./analyze.js";
const d = dirname(fileURLToPath(import.meta.url));
console.log(JSON.stringify(analyzeMonolith({ rootDir: resolve(process.argv[2] ?? join(d, "../fixtures/sample-monolith/src")) }), null, 2));
