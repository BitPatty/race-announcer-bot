/**
 * Tell jest that we're not in a browser
 * to avoid any kind of Cross-Origin-Requests
 * due to axios using XHR-Requests as default
 * adapter
 */
global.XMLHttpRequest = undefined;
