import path from "path";
import fs from "fs/promises";

const baseDir = path.resolve();
const buildDir = path.join(baseDir, "build");

await fs.rm(buildDir, { recursive: true, force: true });
