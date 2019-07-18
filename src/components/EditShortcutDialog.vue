<template>
  <v-dialog
      v-model="dialog"
      width="500"
      @keydown.esc="dialog = false">
    <slot slot="activator"></slot>
    <v-card>
      <v-card-title class="headline" primary-title>
        {{topsite ? 'Edit shortcut' : 'Add shortcut'}}
      </v-card-title>

      <v-card-text>
        <v-autocomplete label="Name" v-model="title"
            :items="autocompleteEntries"
            :search-input.sync="search"
            item-text="title"
            hide-no-data
            @change="onNameChange"
            return-object>
        </v-autocomplete>
        <v-text-field label="URL" v-model="url">
        </v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-btn v-if="topsite" flat @click="removeShortcut()">
          Remove
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn flat @click="dialog = false">
          Cancel
        </v-btn>
        <v-btn color="primary" :disabled="!title || !url" flat
            @click="saveShortcut()">
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import topSitesService from '../services/topsiteservice'

export default {
  props: ['topsite'],

  data() {
    return {
      title: this.topsite ? this.topsite.title : '',
      url: this.topsite ? this.topsite.url : '',
      autocompleteEntries: [],
      dialog: false,
      search: null
    }
  },

  mounted() {
    if (!this.title) {
      this.handleSearch_('')
    } else {
      this.autocompleteEntries.push({
        title: this.title,
        url: this.url
      })
    }
  },

  watch: {
    search(val) {
      this.handleSearch_(val || '')
    }
  },

  methods: {
    handleSearch_(val) {
      const tabsPromise = new Promise((resolve, reject) => {
        chrome.tabs.query({}, (tabs) => {
          let items = []
          for (let item of tabs) {
            if (!item.url || !item.title) {
              continue
            }
            items.push({
              title: item.title,
              url: item.url
            })
          }
          resolve(items)
        })
      })
      const historyPromise = new Promise((resolve, reject) => {
        chrome.history.search({text: val}, historyItems => {
          let items = []
          for (let item of historyItems) {
            if (!item.url || !item.title) {
              continue
            }
            items.push({
              title: item.title,
              url: item.url
            })
          }
          resolve(items)
        })
      })
      Promise.all([tabsPromise, historyPromise]).then(([tabs, history]) => {
        let items = [{
          title: val,
          url: this.url
        }]
        let urls = new Set()
        let titles = new Set()
        for (let item of tabs.concat(history)) {
          if (urls.has(item.url) || titles.has(item.title)) {
            continue
          }
          urls.add(item.url)
          titles.add(item.title)
          items.push(item)
        }
        this.autocompleteEntries = items
      })
    },

    onNameChange(entry) {
      this.title = entry.title
      this.url = entry.url
    },

    removeShortcut() {
      topSitesService.removeTopSite(this.topsite).then(() => {
        this.dialog = false
        this.$emit('topSitesUpdated')
      })
    },

    saveShortcut() {
      const removeTopSitePromise = (this.topsite)
        ? topSitesService.removeTopSite(this.topsite)
        : Promise.resolve()
      removeTopSitePromise.then(() => {
        topSitesService.addTopSite({title: this.title, url: this.url}).then(() => {
          this.dialog = false
          this.$emit('topSitesUpdated')
        })
      })
    }
  }
}
</script>
