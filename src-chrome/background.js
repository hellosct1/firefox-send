function onError(error) {
	console.log(`Error: ${error}`);
}

function open() {
      browser.sidebarAction.open();
}

function close() {
      browser.sidebarAction.close();
}

function onGot(item) {

  if (typeof (item.settings) == 'undefined' || item.settings['views'] == 'slideBar') {
     browser.sidebarAction.isOpen({}).then(result => {
        if (result == true) {
          close();
        } else {
          open();
        }
      });

    browser.browserAction.onClicked.addListener(open);
	} else {
    browser.tabs.create({
      "url": item.settings['links']
    });
	}
}

browser.storage.local.get('settings').then(onGot, onError);
