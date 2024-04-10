import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import tar from "tar";

const baseDir = path.resolve();
const sourceDir = path.join(baseDir, "src");
const buildDir = path.join(baseDir, "build");

const esmDir = path.join(buildDir, "esm");
const typesDir = path.join(buildDir, "types");

const pkgJson = path.join(buildDir, "package.json");

console.log("Adding additional files...");

await fsp.copyFile(path.join(baseDir, "README.md"), path.join(buildDir, "README.md"));
await fsp.writeFile(path.join(buildDir, "index.js"), `exports = module.exports = require("./cjs/index.js");\n`);

const packageJson = JSON.parse(await fsp.readFile(path.join(baseDir, "package.json"), "utf8"));

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

packageJson.exports ??= {};
packageJson.files ??= [];

packageJson.exports["./package.json"] = "./package.json";
for(const file of allFiles) {
    // Step 1 - copy the source and clean imports for mjs
    const source = await fsp.readFile(file, "utf-8");
    const transpiled = source.replace(/(import .* from\s+['"])(.*)(?=['"])/g, '$1$2.js');
    await fsp.writeFile(file, transpiled);

    // Step 2 - write the exports and files definitions in the package.json
    const localPath = path.relative(esmDir, file);
    const { dir, name, base } = path.parse(localPath);

    if(name === "index") {
        if(!dir) {
            packageJson.files.push(
                `./types/${name}.d.ts`,
                `./cjs/${base}`,
                `./esm/${base}`,
            );

            packageJson.exports["."] = {
                "types": `./types/${name}.d.ts`,
                "default": `./cjs/${base}`,
                "import": `./esm/${base}`,
                "require": `./cjs/${base}`,
                "node": `./esm/${base}`,
            };
        } else {
            packageJson.files.push(
                `./types/${dir}/${name}.d.ts`,
                `./cjs/${dir}/${base}`,
                `./esm/${dir}/${base}`,
            );

            packageJson.exports[`./${dir}`] = {
                "types": `./types/${dir}/${name}.d.ts`,
                "default": `./cjs/${dir}/${base}`,
                "import": `./esm/${dir}/${base}`,
                "require": `./cjs/${dir}/${base}`,
                "node": `./esm/${dir}/${base}`,
            };
        }
    } else {
        const fullName = path.join(dir, name);
        const fullNameWithExt = path.join(dir, base);

        packageJson.files.push(
            `./types/${fullName}.d.ts`,
            `./cjs/${fullNameWithExt}`,
            `./esm/${fullNameWithExt}`,
        );

        packageJson.exports[`./${fullName}`] = {
            "types": `./types/${fullName}.d.ts`,
            "default": `./cjs/${fullNameWithExt}`,
            "import": `./esm/${fullNameWithExt}`,
            "require": `./cjs/${fullNameWithExt}`,
            "node": `./esm/${fullNameWithExt}`,
        };
    }
}

console.log(`Modified ${allFiles.length} ES modules.`);

console.log("Copying over global types...");
const allDeclarations = (await readdir(sourceDir, [])).filter(x => x.endsWith(".d.ts"));

for(const file of allDeclarations) {
    const filename = path.relative(sourceDir, file);
    const destination = path.join(typesDir, filename);

    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await fsp.copyFile(file, destination);

    packageJson.files.push(`./${filename}`);
    packageJson.exports[`./${filename}`] = {
        "types": `./types/${filename}`,
    };
}

console.log(`Copied ${allDeclarations.length} d.ts files.`);

console.log("Adding sanitized package.json...");
delete packageJson.scripts;
delete packageJson.devDependencies;
packageJson.main = "./index.js";

await fsp.writeFile(pkgJson, JSON.stringify(packageJson, null, 4), "utf8");

console.log("Building tarball...");

const files = await fsp.readdir(buildDir);

const writeStream = tar.create({ gzip: true, cwd: buildDir, prefix: "nasturtium" }, files);
writeStream.pipe(fs.createWriteStream(path.join(baseDir, `${packageJson.name}-${packageJson.version}.tar.gz`)));

console.log("Done!");
