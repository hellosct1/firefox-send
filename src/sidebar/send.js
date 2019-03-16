var url = "https://send.firefox.com"; 

var thisPanel = browser.extension.getURL(url);

function toggle(panel) {
   browser.sidebarAction.setPanel({panel: thisPanel});
}


var gettingPanel = browser.sidebarAction.getPanel({});
gettingPanel.then(toggle);
  
