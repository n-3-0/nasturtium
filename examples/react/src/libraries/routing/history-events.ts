let hooked: {
    pushState: typeof history["pushState"],
    replaceState: typeof history["replaceState"],
};

export function useHistoryEvents() {
    if(hooked) return hooked;
    const oldPushState = history.pushState;
    function pushState(data, unused, url, ...other) {
        const ret = oldPushState.call(history, data, unused, url, ...other);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    }
    history.pushState = pushState;

    const oldReplaceState = history.replaceState;
    function replaceState(...args: any[]) {
        const ret = oldReplaceState.apply(history, args);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    }
    history.replaceState = replaceState;

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });

    hooked = { pushState, replaceState }

    return hooked;
}
