import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import tar from "tar";

const baseDir = path.resolve();
const sourceDir = path.join(baseDir, "src");
const buildDir = path.join(baseDir, "build");

const esmDir = path.join(buildDir, "esm");
const typesDir = path.join(buildDir, "types");

const packageJson = path.join(buildDir, "package.json");

console.log("Adding additional files...");

await fsp.copyFile(path.join(baseDir, "README.md"), path.join(buildDir, "README.md"));
await fsp.writeFile(path.join(buildDir, "index.js"), `exports = module.exports = require("./cjs/index.js");\n`);

console.log("Adding sanitized package.json...");

const json = JSON.parse(await fsp.readFile(path.join(baseDir, "package.json"), "utf8"));

delete json.scripts;
delete json.devDependencies;
json.main = "./index.js";

await fsp.writeFile(packageJson, JSON.stringify(json, null, 4), "utf8");

console.log("Adding file extensions to ESM version...");
async function readdir(root, all = []) {
    const files = await fsp.readdir(root);
    for(const file of files) {
        const fullPath = path.join(root, file);

        if((await fsp.stat(fullPath)).isDirectory()) {
            await readdir(fullPath, all);
        } else {
            all.push(fullPath);
        }
    }

    return all;
}

const allFiles = (await readdir(esmDir, [])).filter(x => x.endsWith(".js"));

for(const file of allFiles) {
    const source = await fsp.readFile(file, "utf-8");
    const transpiled = source.replace(/(import .* from\s+['"])(.*)(?=['"])/g, '$1$2.js');
    await fsp.writeFile(file, transpiled);
}

console.log(`Modified ${allFiles.length} ES modules.`);

console.log("Copying over global types...");

const allDeclarations = (await readdir(sourceDir, [])).filter(x => x.endsWith(".d.ts"));

for(const file of allDeclarations) {
    const filename = path.relative(sourceDir, file);
    await fsp.copyFile(file, path.join(typesDir, filename));
}

console.log(`Copied ${allDeclarations.length} d.ts files.`);

console.log("Building tarball...");

const files = await fsp.readdir(buildDir);

const writeStream = tar.create({ gzip: true, cwd: buildDir, prefix: "nasturtium" }, files);
writeStream.pipe(fs.createWriteStream(path.join(baseDir, `${json.name}-${json.version}.tar.gz`)));

console.log("Done!");
