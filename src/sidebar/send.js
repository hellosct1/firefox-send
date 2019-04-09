var url  = "https://send.firefox.com/";
 
var panel = browser.runtime.getURL(url);

browser.sidebarAction.setPanel({panel: panel});
  
