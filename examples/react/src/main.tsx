import "nasturtium/implementations/react";

import ReactDOM from "react-dom/client"
import { Router } from "./libraries/routing/router";

import "./routes";

import "./assets/app.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(<Router />);
