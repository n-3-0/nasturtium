import { createSemaphore } from "nasturtium/types/semaphore";
import { createStator } from "nasturtium/types/stator";

export const currentLocation = createSemaphore<void>(signal => window.addEventListener("locationchange", () => signal()));
export const currentRoute = currentLocation.makeComputed(() => window.location.pathname);
export const currentQuery = currentLocation.makeComputed(() => window.location.search);
export const currentParams = currentQuery.makeComputed(search => new URLSearchParams(search));

/** @reactive */
export const getParam = createStator<Record<string, string>>(key => currentParams.use().get(key));
/** @reactive */
export const getArrayParam = createStator<Record<string, string[]>>(key => currentParams.use().getAll(key));
/** @reactive */
export const matchesRoute = createStator<Record<string, boolean>>(key => currentRoute.use().startsWith(key));
