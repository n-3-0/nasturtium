import { Link } from "../../../libraries/routing/router";
import "./style.scss";

export function Navbar() {
    return (
        <nav className="navbar">
            <Link href="/home"><h1>Nasturtium</h1></Link>
        </nav>
    );
}
