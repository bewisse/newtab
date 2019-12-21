<template>
  <div class="background" height="100%">
    <slideable-image :image="pendingImage" @load="onImageLoaded" />
    <div class="bottom-right">
      <div>
        <a href="https://www.google.com/search?q=weather"
            v-if="weather"
            class="link no-underline display-2">
          {{weather.degree}}
          <img :src="`https://${weather.icon}`" width="32px" height="32px" />
        </a>
      </div>
      <span class="display-3 time">{{time}}</span>
      <div class="subheading" v-if="image && image.user">
        Photo by <a :href="image.userLink" class="link">{{image.user}}</a> on <a href="https://unsplash.com/" class="link">Unsplash</a>
      </div>
      <a :href="image.link"
          class="link subheading"
          v-if="image && image.description">
        {{image.description}}
      </a>
    </div>
  </div>
</template>

<style scoped>
.background {
  background-color: #aaa;
  height: 100%;
  position: fixed;
  width: 100%;
}

.bottom-right {
  color: #fff;
  bottom: 80px;
  right: 10px;
  position: fixed;
  text-align: right;
  text-shadow: 1px 1px 5px #000;
}

.link {
  color: #fff;
}

.no-underline {
  text-decoration: none;
}
</style>

<script>
import backgroundImageService from '../services/background'
import slideableImage from './SlideableImage'
import weatherService from '../services/weather'

export default {
  components: {
    slideableImage
  },

  data() {
    return {
      image: {},
      pendingImage: {},
      time: '',
      weather: null
    }
  },

  methods: {
    updateDateTime() {
      let now = new Date()
      this.time = now.toLocaleTimeString()
    },

    updateBackgroundImage() {
      backgroundImageService.getNextImage().then(image => {
        this.pendingImage = image
      })
    },

    onImageLoaded(image) {
      this.image = image
      backgroundImageService.markImageAsDownloaded(image)
      setTimeout(() => {
        backgroundImageService.expireCurrentImage().then(() => {
          this.updateBackgroundImage()
        })
      }, 20000)
    }
  },

  created() {
    this.updateDateTime()
    setInterval(this.updateDateTime, 500)
    const self = this
    weatherService.getCurrentWeather().then(weather => {
      if (!weather) {
        // Retry in 5 seconds if the first call fails.
        setTimeout(() => {
          weatherService.getCurrentWeather().then(weather => {
            self.weather = weather
          })
        }, 5000)
      }
      self.weather = weather
    })
    this.updateBackgroundImage()
  }
}
</script>
