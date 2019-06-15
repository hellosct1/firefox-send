var settings = {};

function saveSettings(e) {
  settings['links'] = document.querySelector("#links").value;
	settings['views'] = document.querySelector("#views").value;

	browser.storage.local.set({"settings" : settings});
	e.preventDefault();
}

function init() {
  settings['links'] = 'https://send.firefox.com';
  settings['views'] = 'sideBar';

	browser.storage.local.set({"settings" : settings});

  window.location.reload();
	return;
}

function restoreSettings(item='') {

	if (typeof (item.settings) == 'undefined') {
		init();
	}
  document.getElementById("links").value = item.settings['links'];
  document.getElementById("views").value = item.settings['views'];

}

var gettingItem = browser.storage.local.get(['settings']);
gettingItem.then(restoreSettings);
document.querySelector("form").addEventListener("submit", saveSettings);
