import topSitesService from './topsiteservice'

const TYPE_CLIPBOARD = 1
const TYPE_RECENT_SEARCH = 2
const TYPE_RECENT_SESSION = 3
const TYPE_HISTORY = 4
const TYPE_TOP_SITES = 5

class SuggestionService {
  suggestClipboard() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.select()
      document.execCommand('paste')
      const items = []
      const title = input.value
      if (title) {
        let metadata = title
        if (!title.startsWith('http://') && !title.startsWith('https://')) {
          metadata = `https://www.google.com/search?q=${title}`
        }
        items.push({
          title: title,
          metadata: metadata,
          icon: 'content_paste',
          type: TYPE_CLIPBOARD
        })
      }
      document.body.removeChild(input)
      resolve(items)
    })
  }

  suggestRecentSearches() {
    return fetch(
      'https://www.google.com/complete/search?' +
        'q=&xssi=t&client=psy-ab&psi=', {
        credentials: 'include',
        mode: 'cors'
      })
      .then(result => {
        return result.text()
      })
      .then(result => {
        return JSON.parse(result.replace(')]}\'', ''))
      })
      .then(result => {
        const autocompletion = result[1]
        let items = []
        for (let token of autocompletion) {
          const term = token[0]
          let deletionToken = null
          if (token[3]) {
            deletionToken = `https://www.google.com${token[3].du}`
          }
          const simpleTerm = term.replace('<b>', '').replace('</b>', '')
          items.push({
            title: simpleTerm,
            deletionToken: deletionToken,
            icon: 'history',
            metadata: `https://www.google.com/search?q=${simpleTerm}`,
            type: TYPE_RECENT_SEARCH
          })
        }
        return items
      })
      .catch(e => {
        return []
      })
  }

  suggestRecentSessions() {
    const allDevicesPromise = new Promise((resolve, reject) => {
      chrome.sessions.getDevices({}, devices => {
        resolve(devices)
      })
    })
    const currentDevicePromise = new Promise((resolve, reject) => {
      chrome.sessions.getRecentlyClosed({}, sessions => {
        resolve([{
          deviceName: '',
          sessions: sessions
        }])
      })
    })
    return Promise.all([currentDevicePromise, allDevicesPromise])
      .then(([currentDevice, allDevices]) => {
        const devices = currentDevice.concat(allDevices)
        let items = []
        let sessionIds = new Set()
        for (let device of devices) {
          const sessions = device.sessions.slice(0, 6)
          for (let session of sessions) {
            let title = null
            let metadata = null
            let url = null
            let imageUrl = null
            let icon = null
            let tab = session.tab
            let win = session.window
            if (!tab && win && win.tabs && win.tabs.length === 1) {
              tab = win.tabs[0]
            }
            if (tab) {
              if (device.deviceName) {
                title = `[${device.deviceName}] ${tab.title}`
              } else {
                title = tab.title
              }
              metadata = tab.sessionId
              url = tab.url
              if (tab.favIconUrl) {
                imageUrl = tab.favIconUrl
              } else {
                icon = 'insert_drive_file'
              }
            } else {
              const window = session.window
              title = `Restore window with ${window.tabs.length} tabs`
              metadata = window.sessionId
              icon = 'restore_page'
            }
            if (sessionIds.has(metadata)) {
              continue
            }
            sessionIds.add(metadata)
            items.push({
              title: title,
              metadata: metadata,
              subtitle: url,
              imageUrl: imageUrl,
              icon: icon,
              requireClickHandler: true,
              type: TYPE_RECENT_SESSION
            })
          }
        }
        return items.slice(0, 10)
      })
  }

  suggestHistory() {
    const MAX_HISTORY_SUGGESTIONS = 15
    const historyPromise = new Promise((resolve, reject) => {
      chrome.history.search({text: ''}, historyItems => {
        let items = []
        let urls = new Set()
        for (let item of historyItems) {
          const hostname = this.extractHostname_(item.url)
          if (!item.url || urls.has(hostname)) {
            continue
          }
          urls.add(hostname)
          items.push({
            title: item.title,
            metadata: item.url,
            subtitle: item.url,
            deletionToken: item.url,
            imageUrl: `chrome://favicon/size/32@2x/${item.url}`,
            type: TYPE_HISTORY
          })
        }
        resolve(items)
      })
    })
    const recentSessionsPromise = this.suggestRecentSessions()
    return Promise.all([historyPromise, recentSessionsPromise]).then(promises => {
      let history = promises[0]
      const recentSessions = promises[1]
      let urls = new Set()
      for (let session of recentSessions) {
        if (session.url) {
          urls.add(this.extractHostname_(session.url))
        }
      }
      history = history.filter(item => !urls.has(this.extractHostname_(item.url)))
      return history.slice(0, MAX_HISTORY_SUGGESTIONS)
    })
  }

  suggestTopSites() {
    return topSitesService.getTopSites().then(topSites => {
      return topSites.map(topSite => {
        return {
          title: topSite.title,
          metadata: topSite.url,
          url: topSite.url,
          deletionToken: topSite,
          imageUrl: `chrome://favicon/size/32@2x/${topSite.url}`,
          type: TYPE_TOP_SITES
        }
      })
    })
  }

  open(suggestion, {openAsNewTab} = {}) {
    switch (suggestion.type) {
      case TYPE_RECENT_SESSION:
        chrome.tabs.getCurrent(tab => {
          chrome.sessions.restore(suggestion.metadata)
          if (!openAsNewTab) {
            chrome.tabs.remove(tab.id)
          }
        })
        break
      default:
        console.error(`${suggestion.type} is not supported.`)
    }
  }

  remove(suggestion) {
    switch (suggestion.type) {
      case TYPE_RECENT_SEARCH:
        return fetch(suggestion.deletionToken)
      case TYPE_TOP_SITES:
        return topSitesService.removeTopSite(suggestion.deletionToken)
      case TYPE_HISTORY:
        return new Promise((resolve, reject) => {
          chrome.history.deleteUrl({url: suggestion.deletionToken}, () => {
            resolve()
          })
        })
      default:
        return new Promise((resolve, reject) => {
          resolve()
        })
    }
  }

  extractHostname_(url) {
    if (!url) {
      return ''
    }
    let hostname
    // find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf('//') > -1) {
      hostname = url.split('/')[2]
    } else {
      hostname = url.split('/')[0]
    }
    // find & remove port number
    hostname = hostname.split(':')[0]
    // find & remove "?"
    hostname = hostname.split('?')[0]
    return hostname
  }
}

const suggestionService = new SuggestionService()

export default suggestionService
