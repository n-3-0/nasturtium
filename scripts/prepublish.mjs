import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import tar from "tar";

const baseDir = path.resolve();
const sourceDir = path.join(baseDir, "src");
const buildDir = path.join(baseDir, "build");

const esmDir = buildDir;
const cjsDir = path.join(buildDir, "cjs");
const typesDir = path.join(buildDir, "types");

const pkgJson = path.join(buildDir, "package.json");

console.log("Adding additional files...");

await fsp.copyFile(path.join(baseDir, "README.md"), path.join(buildDir, "README.md"));

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

const allFiles = (await readdir(cjsDir, [])).filter(x => x.endsWith(".js"));

packageJson.exports ??= {};
packageJson.files ??= [];

packageJson.exports["./package.json"] = "./package.json";
for(const file of allFiles) {
    const localPath = path.relative(cjsDir, file);
    const esmPath = path.join(esmDir, localPath);
    const { dir, name, base } = path.parse(localPath);

    // Step 1 - copy the source and clean imports for mjs
    const source = await fsp.readFile(esmPath, "utf-8");
    const transpiled = source.replace(/^((?:im|ex)port[^'";}]+}?\s*from\s*['"])(.*)(?=['"])/gm, '$1$2.js');
    await fsp.writeFile(esmPath, transpiled);

    // Step 2 - write the exports and files definitions in the package.json

    if(name === "index") {
        if(!dir) {
            packageJson.files.push(
                `./${base}`,
                `./${name}.d.ts`,
                `./cjs/${base}`,
            );

            packageJson.exports["."] = {
                "types": `./${name}.d.ts`,
                "default": `./${base}`,
                "import": `./${base}`,
                "require": `./cjs/${base}`,
                "node": `./${base}`,
            };
        } else {
            packageJson.files.push(
                `./${dir}/${base}`,
                `./${dir}/${name}.d.ts`,
                `./cjs/${dir}/${base}`,
            );

            packageJson.exports[`./${dir}`] = {
                "types": `./${dir}/${name}.d.ts`,
                "default": `./${dir}/${base}`,
                "import": `./${dir}/${base}`,
                "require": `./cjs/${dir}/${base}`,
                "node": `./${dir}/${base}`,
            };
        }
    } else {
        const fullName = path.join(dir, name);
        const fullNameWithExt = path.join(dir, base);

        packageJson.files.push(
            `./${fullNameWithExt}`,
            `./${fullName}.d.ts`,
            `./cjs/${fullNameWithExt}`,
        );

        packageJson.exports[`./${fullName}`] = {
            "types": `./${fullName}.d.ts`,
            "default": `./${fullNameWithExt}`,
            "import": `./${fullNameWithExt}`,
            "require": `./cjs/${fullNameWithExt}`,
            "node": `./${fullNameWithExt}`,
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
        "types": `./${filename}`,
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
