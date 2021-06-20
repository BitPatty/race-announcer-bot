/**
 * Tell jest that we're not in a browser
 * to avoid any kind of Cross-Origin-Requests
 * due to axios using XHR-Requests as default
 * adapter
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.XMLHttpRequest = undefined;
