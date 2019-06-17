
function onError(error) {
	console.log(`Error: ${error}`);
}

function open() {
      chrome.sidebarAction.open();
}

function close() {
      chrome.sidebarAction.close();
}

function onGot(item) {
  if (typeof (item.settings) == 'undefined' || item.settings['views'] == 'slideBar') {
     chrome.sidebarAction.isOpen({}).then(result => {
        if (result == true) {
          close();
        } else {
          open();
        }
      });

    chrome.browserAction.onClicked.addListener(open);
	} else {
    chrome.tabs.create({
      "url": item.settings['links']
    });
	}

}

chrome.storage.local.get('settings').then(onGot, onError);
