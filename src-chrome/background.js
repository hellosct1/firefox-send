const appUrl = chrome.extension.getURL("https://send.firefox.com");

/* target Tab open */
function TargetTab(tab) {
  chrome.tabs.update(tab.id, {
    active: true
  });
  chrome.windows.update(tab.windowId, {
    focused: true
  });
}


function execute() {
  chrome.tabs.create({
    url: appUrl
  });
}

function prepare(tabs) {
  if (tabs.length > 0) {
    const appTab = tabs[0];
    TargetTab(appTab);
  } else {
    execute();
  }
}

function start(tabs) {
  const activeTab = tabs[0];
  crawlUrl = activeTab.url;

  chrome.tabs.query({
      url: appUrl
    },
    prepare
  );
}

function onGot(tab) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, start);
}

chrome.browserAction.onClicked.addListener(onGot);
