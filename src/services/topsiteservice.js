const TOP_SITES_KEY = 'topSites'
const HIDDEN_URLS_KEY = 'hiddenUrls'

class TopSitesService {
  getTopSites() {
    const browserTopSitesPromise = new Promise((resolve, reject) => {
      chrome.topSites.get(topSites => {
        chrome.storage.local.get(HIDDEN_URLS_KEY, result => {
          const hiddenUrls = new Set()
          if (result.hiddenUrls) {
            for (let hiddenUrl of result.hiddenUrls) {
              hiddenUrls.add(hiddenUrl)
            }
          }
          topSites = topSites.filter(topSite => !hiddenUrls.has(topSite.url))
            .map(topSite => {
              return {
                title: topSite.title,
                url: topSite.url
              }
            })
          resolve(topSites)
        })
      })
    })
    const customTopSitesPromise = new Promise((resolve, reject) => {
      chrome.storage.local.get(TOP_SITES_KEY, result => {
        let items = []
        if (result.topSites) {
          items = result.topSites
        }
        resolve(items)
      })
    })
    return Promise.all([browserTopSitesPromise, customTopSitesPromise])
      .then(promises => {
        return promises[0].concat(promises[1])
      })
  }

  addTopSite(topSite) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(TOP_SITES_KEY, result => {
        let topSites = result.topSites
        if (!topSites) {
          topSites = []
        }
        topSites.push({title: topSite.title, url: topSite.url})
        chrome.storage.local.set({ topSites: topSites }, () => {
          resolve()
        })
      })
    })
  }

  removeTopSite(topSite) {
    const removeFromCustomPromise = new Promise((resolve, reject) => {
      chrome.storage.local.get(TOP_SITES_KEY, result => {
        let topSites = result.topSites
        if (!topSites) {
          resolve()
          return
        }
        for (let i = 0; i < topSites.length; ++i) {
          if (topSites[i].url === topSite.url) {
            topSites.splice(i, 1)
            break
          }
        }
        chrome.storage.local.set({ topSites: topSites }, () => {
          resolve()
        })
      })
    })
    const addToHiddenPromise = new Promise((resolve, reject) => {
      chrome.storage.local.get(HIDDEN_URLS_KEY, result => {
        let hiddenUrls = result.hiddenUrls
        if (!hiddenUrls) {
          hiddenUrls = []
        }
        hiddenUrls.push(topSite.url)
        chrome.storage.local.set({ hiddenUrls: hiddenUrls }, () => {
          resolve()
        })
      })
    })
    return Promise.all([removeFromCustomPromise, addToHiddenPromise])
  }
}

const topSitesService = new TopSitesService()

export default topSitesService
