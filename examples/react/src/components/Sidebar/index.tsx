import { cn } from "../../utils/cn";

import { Link, isCurrentMatch } from "../../libraries/routing/router";

import "./style.scss";

function SidebarLink({ path, label }) {
    const matchesRoute = isCurrentMatch(path);

    return (
        <Link href={path} className={cn("link", matchesRoute && "is-match")}>
            {label}
        </Link>
    );
}

export function Sidebar() {
    return (
        <div className="sidebar">
            <SidebarLink path="/home" label="Home" />
            <SidebarLink path="/components" label="Components" />
        </div>
    );
}
