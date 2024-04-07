// https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/router/utils.ts#L946
export type CompiledPathParam = { paramName: string; isOptional?: boolean };

export function compilePath(
    path: string,
    caseSensitive = false,
    end = true
): [RegExp, CompiledPathParam[]] {
    const params: CompiledPathParam[] = [];
    let regexpSource = "^" + path
        .replace(/\/*\*?$/, "") // Ignore trailing / and /*, we'll handle it below
        .replace(/^\/*/, "/") // Make sure it has a leading /
        .replace(/[\\.*+^${}|()[\]]/g, "\\$&") // Escape special regex chars
        .replace(/\/:([\w-]+)(\?)?/g, (_, paramName: string, isOptional) => {
            params.push({ paramName, isOptional: isOptional != null });
            return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
        });

    if(path.endsWith("*")) {
        params.push({ paramName: "*" });
        regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
    } else if(end) {
        regexpSource += "\\/*$";
    } else if(path !== "" && path !== "/") {
        regexpSource += "(?:(?=\\/|$))";
    }

    return [
        new RegExp(regexpSource, caseSensitive ? undefined : "i"),
        params
    ];
}