import { createPrimitive } from "nasturtium";

import { element } from "./template.html";
document.body.append(element);

const select = element as Reactive.Select;
const state = createPrimitive<string>("");

select.value = () => state.value;
select.onchange = () => state.value = select.value

setTimeout(() => state.value = "3", 2000);
