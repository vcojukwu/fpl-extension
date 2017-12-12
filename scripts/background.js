chrome.pageAction.onClicked.addListener(function(tab) {
  alert("Page Action Clicked");
});

function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.indexOf("fantasy.premierleague.com/a/leagues/standings") > -1) {
    chrome.pageAction.show(tabId);
    tablink = tab.url;
    chrome.tabs.sendMessage(tabId, {url: tablink});
  } else {
    chrome.pageAction.hide(tabId);
  }
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);
