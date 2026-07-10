/**
 * @module @yoltra/devtools-ext
 */

/**
 * Creates the Yoltra DevTools panel in the browser's DevTools sidebar.
 *
 * Registers a new panel named "Yoltra" that loads `panel.html` as its
 * content page.
 */
chrome.devtools.panels.create("Yoltra", "", "panel.html");
