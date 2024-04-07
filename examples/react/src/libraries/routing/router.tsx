import React, { ComponentProps, useEffect } from "react";
import { useHistoryEvents as bindHistory } from "./history-events";
import { currentRoute } from "./state";
import { createStator } from "nasturtium/types/stator";

const history = bindHistory();

export interface RouteOptions {
    element?: React.ReactNode;
    template?: React.ReactNode;
}

interface RouteNode {
    strict?: boolean;
    branches: { [key: string | number | symbol]: RouteNode };
    path: string;
    args?: string[];
    edge?: boolean;

    template?: React.ReactNode;
    element?: React.ReactNode;
    notFound?: React.ReactNode;

    parseArgs(path: string): Record<string, string>;
    regex?: RegExp;
}

interface RouteMatch extends RouteNode {
    route: string;
    args: any;
}

export interface KnownRoute<P extends string> {
    readonly path: P;
    args: string[];
    parseArgs(path: string): Record<string, string>;
    goto(data?: any, args?: any, replace?: boolean): void;
}

const root: RouteNode = {
    path: "/",
    branches: {},
    args: [],
    strict: false,
    parseArgs: () => ({}),
};

const ARGUMENT = Symbol("argument");
const ANY = Symbol("any");
const NOTFOUND = Symbol("notfound");
const ALL = Symbol("all");

export function addRoute<
    P extends string
>(path: P, options: RouteOptions): KnownRoute<P> {
    const segments = path.split("/");

    // Relative path
    if(segments[0]) {
        console.log("Can't deal with relative paths right now:", path);
        return;
    }

    segments.shift();

    let targetBranch = root;
    let currentPath = "";
    for(const segment of segments) {
        if(segment[0] === ":") {
            currentPath += `/${segment}`;

            if(!targetBranch[ARGUMENT]) {
                targetBranch.branches[ARGUMENT] = {
                    path: currentPath,
                    branches: {},
                    args: [segment.substring(1)],
                    strict: false,
                    parseArgs: () => ({}),
                };
            }

            targetBranch = targetBranch.branches[ARGUMENT];
            continue;
        }

        if(segment === "*") {
            currentPath += `/*`;
            if(!targetBranch[ANY]) {
                targetBranch.branches[ANY] = {
                    path: currentPath,
                    branches: {},
                    args: [],
                    strict: false,
                    parseArgs: () => ({}),
                };
            }

            targetBranch = targetBranch.branches[ANY];
            continue;
        }

        // Deep wildcards should be the last segment in the chain
        if(segment === "**") {
            currentPath += `/**`;
            if(!targetBranch[ANY]) {
                targetBranch.branches[ANY] = {
                    path: currentPath,
                    branches: {},
                    args: [],
                    strict: false,
                    parseArgs: () => ({}),
                };
            }

            targetBranch = targetBranch.branches[ANY];
            break;
        }

        // Not found endpoints can be added at any depth
        if(segment === "!") {
            if(!targetBranch[NOTFOUND]) {
                targetBranch.branches[NOTFOUND] = {
                    path: currentPath,
                    branches: {},
                    args: [],
                    strict: false,
                    parseArgs: () => ({}),
                };
            }

            targetBranch = targetBranch.branches[ANY];
            continue;
        }

        // Handle root outside loop
        if(segment !== "") {
            currentPath += `/${segment}`;
            if(!targetBranch[segment]) {
                targetBranch.branches[segment] = {
                    path: currentPath,
                    branches: {},
                    args: [],
                    strict: false,
                    parseArgs: () => ({}),
                };
            }

            targetBranch = targetBranch.branches[segment];
        }
    }

    if(options.template) {
        targetBranch.template = options.template;
    }

    if(options.element) {
        targetBranch.element = options.element;
    }

    targetBranch.edge = true;
    targetBranch.args = segments.reduce((args, segment) => segment[0] !== ":" ? args : (args.push(segment.substring(1)), args), [] as string[]);
    if(targetBranch.args.length) {
        const regex = new RegExp(
            path.replaceAll(/\/(:\w+)/gi, "/(\\w+)").replaceAll("*", "\\*").replaceAll(".", "\\.").replaceAll("/", "\\/"),
            "gi"
        );

        targetBranch.regex = regex;
        targetBranch.parseArgs = (path: string) => {
            const results: Record<string, any> = {};
            const match = regex.exec(path).slice(1);

            return targetBranch.args.reduce((args, key, i) => (args[key] = match[i], args), results);
        }
    }

    return {
        path,
        args: targetBranch.args,
        parseArgs: targetBranch.parseArgs,
        goto: (data = {}, args = {}, replace = false) => {
            const newPath = path.replace(/\/(:\w+)/gi, (_, arg) => `/${args[arg]}`);

            if(replace) {
                return history.replaceState(data, "", newPath);
            }

            history.pushState(data, "", newPath);
        }
    };
}

const cachedMatches: Record<string, RouteMatch> = {};

export function matchRoute(path: string) {
    if(cachedMatches[path]) {
        return cachedMatches[path];
    }

    const segments = path.split("/");

    // Relative path
    if(segments[0]) {
        console.log("Can't deal with relative paths right now:", path);
        return null;
    }

    segments.shift();

    let targetBranch = root;
    let notFound = targetBranch.branches[NOTFOUND];
    let template = targetBranch.template;

    for(const segment of segments) {
        if(targetBranch.template) {
            // Use the deepest template possible
            template = targetBranch.template;
        }

        if(targetBranch.branches[NOTFOUND]) {
            // Use the deepest not found page possible
            notFound = targetBranch.branches[NOTFOUND];
        }

        if(targetBranch.branches[segment]) {
            // Exact match
            targetBranch = targetBranch.branches[segment];
            continue;
        }

        if(targetBranch.branches[ARGUMENT]) {
            // :arg match
            targetBranch = targetBranch.branches[ARGUMENT];
            continue;
        }

        if(targetBranch.branches[ANY]) {
            // Wildcard match
            targetBranch = targetBranch.branches[ANY];
            continue;
        }

        if(targetBranch.branches[ALL]) {
            // Deep wildcard match
            targetBranch = targetBranch.branches[ALL];
            continue;
        }

        if(targetBranch.branches[NOTFOUND]) {
            // Deep wildcard match
            targetBranch = notFound;
            break;
        }
    }

    if(!targetBranch.edge && targetBranch !== notFound) {
        return notFound as RouteMatch;
    }

    const args = targetBranch.parseArgs(path);

    cachedMatches[path] = {
        ...targetBranch,
        route: path,
        args,
        template,
        notFound: notFound?.element
    };

    return cachedMatches[path];
}

export const currentMatch = currentRoute.makeComputed(route => matchRoute(route));
export const isCurrentMatch = createStator(path => currentMatch.use().route === path);

export function Router() {
    const match = currentMatch.use();
    const { template, element, notFound } = match;

    return template || element || notFound;
}

export function Outlet() {
    const { template, element, notFound } = currentMatch.use();
    if(!template) return null;

    return element || notFound;
}

// TODO: Is there some sort of analysis that can be done to redirect before mount?
export function Redirect({ to = "/", replace = false, data = {} }) {
    useEffect(() => {
        if(replace) {
            history.pushState(data, "", to);
        } else {
            history.replaceState(data, "", to);
        }
    }, []);

    return null;
}

export type LinkProps = ComponentProps<"a"> & {
    data?: any;
    replace?: boolean;
};

function detectLeftButton(event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return false;
    } else if ('buttons' in event) {
        return event.buttons === 1;
    } else if ('which' in event) {
        return event.which === 1;
    } else {
        return (event.button == 1 || event.type == 'click');
    }
}

export const Link = React.forwardRef(function Link({ href, data, replace, ...props }: LinkProps, ref: any) {
    return (
        <a ref={ref} {...props} href={href} onClick={e => {
            if(!detectLeftButton(e)) {
                return props?.onClick(e);
            }

            e.preventDefault();

            if(props.onClick) {
                return props.onClick(e);
            }

            if(replace) {
                return history.replaceState(data, "", href);
            }

            history.pushState(data, "", href);
        }} />
    )
});
