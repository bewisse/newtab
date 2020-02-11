chrome.runtime.onInstalled.addListener(e => {
  if (chrome.runtime.OnInstalledReason.INSTALL === e.reason) {
    chrome.tabs.create({url: '/pages/newtab.html'})
  }
})
