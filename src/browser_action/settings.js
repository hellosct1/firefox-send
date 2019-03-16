(function(browser) {
  "use strict";
 
  var url = "https://send.firefox.com/";
  
  // message
  document.getElementById("message").textContent ="Transfer for Firefox send";
  
    
  // open slidebar
  document.getElementById("open").onclick = function() {
  browser.sidebarAction.open();
  };

  // close slidebar
  document.getElementById("close").onclick = function() {
    browser.sidebarAction.close();
  };
  
  // open new tab
  document.getElementById("newTab").onclick = function() {
    browser.tabs.create({ "url": url });
  };
   
})(browser);
