function open() {
    browser.sidebarAction.open();
}

browser.browserAction.onClicked.addListener(open);