<template>
  <v-layout justify-center wrap>
    <draggable
        v-model="apps"
        v-if="hasPermission"
        @end="onDragEnd()">
      <v-btn icon
          :large="$vuetify.breakpoint.mdAndUp"
          @click="openApp(app)"
          @contextmenu.prevent="showContextMenu($event, app)"
          v-for="app in apps"
          :key="app.id"
          :title="app.title">
        <img :src="app.icon" :alt="app.title" width="80%" height="80%">
      </v-btn>
    </draggable>
    <v-menu
        v-model="showMenu"  
        :position-x="menuX"
        :position-y="menuY"
        absolute
        offset-y>
      <v-list>
        <v-list-tile @click="openApp(selectedApp)">
          <v-list-tile-title class="font-weight-bold">
            {{selectedApp.title}}
          </v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile v-if="selectedApp.optionsUrl"
            @click="goToOptions(selectedApp)">
          <v-list-tile-title>Options</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="uninstall(selectedApp)">
          <v-list-tile-title>Remove from Chrome...</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="createShortcut(selectedApp)">
          <v-list-tile-title>Create shortcuts...</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    <div v-if="!hasPermission">
      <v-btn @click="requestPermission" color="primary">
        Show apps
      </v-btn>
    </div>
  </v-layout>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  components: {
    draggable
  },

  data() {
    return {
      apps: [],
      menuX: 0,
      menuY: 0,
      selectedApp: {},
      showMenu: false,
      hasPermission: false
    }
  },

  created() {
    chrome.permissions.contains({
      permissions: ['management']
    }, result => {
      if (result) {
        this.hasPermission = true
        this.reset()
      }
    })
  },

  methods: {
    requestPermission() {
      chrome.permissions.request({
        permissions: ['management']
      }, granted => {
        if (granted) {
          this.hasPermission = true
          this.reset()
        }
      })
    },

    getLargestIcon_(icons) {
      let largestIcon = null
      for (let icon of icons) {
        if (!largestIcon || largestIcon.size < icon.size) {
          largestIcon = icon
        }
      }
      return largestIcon
    },

    reset() {
      const self = this
      chrome.management.getAll((extensions) => {
        let outputList = []
        for (let extension of extensions) {
          if (extension.type === 'extension' || extension.type === 'theme') {
            continue
          }
          outputList.push({
            title: extension.name,
            id: extension.id,
            optionsUrl: extension.optionsUrl,
            icon: self.getLargestIcon_(extension.icons).url
          })
        }
        chrome.storage.local.get(['appsOrder'], (result) => {
          const appsOrder = new Map()
          let i = 0
          if (result.appsOrder) {
            for (const appId of result.appsOrder) {
              appsOrder.set(appId, i++)
            }
          }
          for (const app of outputList) {
            if (!appsOrder.has(app.id)) {
              appsOrder.set(app.id, i++)
            }
          }
          outputList.sort((a, b) => {
            const aIndex = appsOrder.get(a.id)
            const bIndex = appsOrder.get(b.id)
            return aIndex - bIndex
          })
          self.apps = outputList
        })
      })
    },

    openApp(app) {
      chrome.tabs.getCurrent(tab => {
        chrome.management.launchApp(app.id)
        chrome.tabs.remove(tab.id)
      })
    },

    goToOptions(app) {
      chrome.tabs.update(/* tabId */ null, { url: app.optionsUrl })
    },

    createShortcut(app) {
      chrome.management.createAppShortcut(app.id)
    },

    uninstall(app) {
      const self = this
      chrome.management.uninstall(app.id, {showConfirmDialog: true}, () => {
        self.reset()
      })
    },

    onDragEnd() {
      const sortedIds = this.apps.map(app => app.id)
      chrome.storage.local.set({
        appsOrder: sortedIds
      })
    },

    showContextMenu(e, app) {
      this.showMenu = false
      this.menuX = e.clientX
      this.menuY = e.clientY
      this.selectedApp = app
      this.$nextTick(() => {
        this.showMenu = true
      })
    }
  }
}
</script>