const matcher = /\.html$/;

export function allowHtml() {
    return {
        name: "allow-html",
        transform: (src, id, other) => {
            if(!matcher.test(id)) return;

            // "sanitized" lol
            const sanitized = src.replace(/(?<!\\)`/gi, "\\`");

            return {
                code: [
                    `export const container = document.createElement("div");`,
                    `export const source = \`${sanitized}\`;`,
                    `container.innerHTML = source`,
                    `export const elements = [...container.children];`,
                    `export const element = elements[0];`,
                    `export default element;`
                ].join("\n"),
            };
        }
    };
}
