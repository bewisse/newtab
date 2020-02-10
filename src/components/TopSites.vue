<template>
  <v-layout justify-center wrap class="topsites">
    <draggable v-model="topSites"
        v-if="hasPermission"
        class="d-inline"
        @end="onDragEnd()"
        :options="{draggable:'.item'}">  
      <v-hover v-for="item in topSites"
          :key="item.url">
        <div class="topsite" slot-scope="{ hover }">
          <imagetextbutton
              :title="item.title"
              class="item"
              :href="item.metadata"
              :imageUrl="item.imageUrl" />
          <editshortcutdialog @topSitesUpdated="refresh()" :topsite="item">
            <v-btn flat icon dark class="more-icon" :class="hover ? 'd-flex' : ''">
              <v-icon>more_vert</v-icon>
            </v-btn>
          </editshortcutdialog>
        </div>
      </v-hover>
      <editshortcutdialog @topSitesUpdated="refresh()">
        <imagetextbutton
            title="Add shortcut"
            :imageUrl="require('./assets/baseline-add-24px.svg')" />
      </editshortcutdialog>
    </draggable>
    <div v-else>
      <v-btn @click="requestPermission" color="primary">
        Show top sites
      </v-btn>
    </div>
  </v-layout>
</template>

<style scoped>
.topsites {
  position: relative;
}

.topsite {
  display: inline-flex;
  position: relative;
}

.more-icon {
  display: none;
  position: absolute;
  right: -12px;
  top: -12px;
}
</style>

<script>
import draggable from 'vuedraggable'
import editshortcutdialog from './EditShortcutDialog'
import imagetextbutton from './ImageTextButton'
import suggestionService from '../services/suggestion'

export default {
  components: {
    draggable,
    editshortcutdialog,
    imagetextbutton
  },

  data() {
    return {
      topSites: [],
      hasPermission: false
    }
  },

  created() {
    if (chrome.topSites) {
      this.hasPermission = true
      this.refresh()
    }
  },

  methods: {
    requestPermission() {
      chrome.permissions.request({
        permissions: ['topSites']
      }, granted => {
        if (granted) {
          this.hasPermission = true
          this.refresh()
        }
      })
    },
    refresh() {
      suggestionService.suggestTopSites().then(topSites => {
        chrome.storage.local.get(['topSitesOrder'], (result) => {
          const topSitesOrder = new Map()
          let i = 0
          if (result.topSitesOrder) {
            for (const topSiteUrl of result.topSitesOrder) {
              topSitesOrder.set(topSiteUrl, i++)
            }
          }
          for (const topSite of topSites) {
            if (!topSitesOrder.has(topSite.metadata)) {
              topSitesOrder.set(topSite.metadata, i++)
            }
          }
          topSites.sort((a, b) => {
            const aIndex = topSitesOrder.get(a.metadata)
            const bIndex = topSitesOrder.get(b.metadata)
            return aIndex - bIndex
          })
          this.topSites = topSites
        })
      })
    },

    remove(item) {
      const self = this
      suggestionService.remove(item).then(() => {
        self.refresh()
      })
    },

    onDragEnd() {
      const sortedUrls = this.topSites.map(topSite => topSite.metadata)
      chrome.storage.local.set({
        topSitesOrder: sortedUrls
      })
    }
  }
}
</script>
