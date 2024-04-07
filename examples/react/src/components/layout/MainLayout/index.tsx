import { Root } from "nasturtium/extensions/react/react-domv2";
import { Outlet } from "../../../libraries/routing/router";
import { Navbar } from "../Navbar";

import { currentRoute } from "../../../libraries/routing/state";

import "./style.scss";

export function MainLayout() {
    const onElementLoad = (section: HTMLElement) => {
        const route = currentRoute.use();
        section.setAttribute("page", route);
    };

    return (
        <Root $={onElementLoad}>
            <Navbar />
            <Outlet />
        </Root>
    );
}
