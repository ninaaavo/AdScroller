//write the JS for your background script here (everything you want your extension to be doing in the background/communicating with the browser)

// Purely just take care of turning the extension on and off

// waiting for the moment you install the extension
chrome.runtime.onInstalled.addListener(() => {
  // setting badge text
  chrome.action.setBadgeText({
    text: "OFF",
  });
  // putting isOn to local storage
  chrome.storage.local.set({ isOn: "OFF" });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get("isOn", (data) => {
    newState = !data.isOn;
    chrome.storage.local.set({ isOn: newState }, () => {
      chrome.action.setBadgeText({
        text: newState ? "ON" : "OFF",
      });
    });
  });

  chrome.scripting.executeScript({
    target: {
      tabId: tab.id,
    },
    files: ["content.js"],
  });
});

// monitoring if someone is change tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.scripting.executeScript({
    target: {
      tabId: activeInfo.tabId,
    },
    files: ["content.js"],
  });
});

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["content.js"],
  });
});
