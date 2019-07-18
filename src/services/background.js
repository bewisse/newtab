const BACKGROUND_KEY = 'background'

class BackgroundImageService {
  expireCurrentImage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(BACKGROUND_KEY, result => {
        if (result.background) {
          let images = result.background
          if (images.length > 1) {
            images.shift()
          }
          if (images.length <= 1) {
            this.preloadImage_(images[0])
            this.downloadImages_().then(newImages => {
              this.preloadImage_(newImages[0])
              chrome.storage.local.set({ background: images.concat(newImages) }, () => {
                resolve()
              })
            })
          } else {
            this.preloadImage_(images[0])
            chrome.storage.local.set({ background: images }, () => {
              resolve()
            })
          }
        }
      })
    })
  }

  getNextImage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(BACKGROUND_KEY, result => {
        if (result.background) {
          let images = result.background
          let nextImage = images[0]
          if (images.length > 1) {
            this.preloadImage_(images[0])
          }
          resolve(nextImage)
          return
        }
        this.downloadImages_().then(images => {
          chrome.storage.local.set({ background: images })
          this.preloadImage_(images[1])
          resolve(images[0])
        }).catch(e => {
          reject(e)
        })
      })
    })
  }

  markImageAsDownloaded(image) {
    return fetch(image.download, {
      headers: {
        'Accept-Version': 'v1',
        'Authorization': 'Client-ID 15ec47e8911652b51ae87e0660631f74cf884746f1392c3bf50224334994c221'
      }
    })
  }

  preloadImage_(image) {
    const preloadImage = new Image()
    preloadImage.src = image.src
  }

  downloadImages_() {
    return fetch(
      'https://api.unsplash.com/photos/random?' +
      `featured=1&count=30&h=${screen.availHeight}&` +
      `orientation=landscape&w=${screen.availWidth}`,
      {
        headers: {
          'Accept-Version': 'v1',
          'Authorization': 'Client-ID 15ec47e8911652b51ae87e0660631f74cf884746f1392c3bf50224334994c221'
        }
      })
      .then(result => {
        return result.json()
      })
      .then(result => {
        return result.map(image => {
          return {
            src: image.urls.custom,
            link: image.links.html,
            download: image.links.download_location,
            user: image.user.name,
            userLink: image.user.links.html,
            description: image.location ? image.location.name : ''
          }
        })
      })
  }
}

const backgroundImageService = new BackgroundImageService()

export default backgroundImageService
