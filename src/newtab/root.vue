<template>
  <v-app>
    <v-content>
      <background />
      <topsites />
      <v-dialog v-model="permissionDialog" persistent max-width="600">
        <v-card>
          <v-card-title class="headline">Grant Smart New Tab permissions</v-card-title>
          <v-card-text>
            <p class="body-1">
              Smart New Tab would like to request some additional permissions to optimize your
              new tab experiences. These permissions are optional. You can click "Grant all permssions"
              to give Smart New Tab access to all of them, or choose "Not now" to grant individual
              permission.
            </p>
            <p class="body-1">
              We need the following permissions:
              <ul>
                <li>Top sites: To show your most visited sites on top.</li>
                <li>Clipboard: Allow you to quickly search what is in your clipboard</li>
                <li>Recent sessions: Allow you to quickly resume your recently closed sessions across devices</li>
                <li>Recent history: Allow you to quickly resume your recently visited page</li>
                <li>Apps: To show all your apps at the bottom.</li>
              </ul>
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="denyPermission">
              Not now
            </v-btn>
            <v-btn color="primary" @click="requestPermission">
              Grant all permissions
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <section>
        <v-layout>
          <v-flex xs12 md8 offset-md2 lg6 offset-lg3>
            <suggestions />
          </v-flex>
        </v-layout>
      </section>
    </v-content>
    
    <apps />
  </v-app>
</template>

<style>
::-webkit-scrollbar { 
  display: none; 
}
</style>


<script>
import apps from '../components/Apps'
import background from '../components/Background'
import suggestions from '../components/Suggestions'
import topsites from '../components/TopSites'

export default {
  components: {
    apps,
    background,
    suggestions,
    topsites
  },
  data() {
    return { permissionDialog: false }
  },
  created() {
    chrome.storage.local.get(['permissionChecked'], (result) => {
      if (!result.permissionChecked) {
        this.permissionDialog = true
      }
    })
  },
  methods: {
    denyPermission() {
      this.permissionDialog = false
      chrome.storage.local.set({ permissionChecked: true })
    },
    requestPermission() {
      chrome.permissions.request({
        permissions: ['clipboardRead', 'history', 'management', 'sessions', 'topSites']
      }, granted => {
        chrome.storage.local.set({ permissionChecked: true }, () => {
          if (granted) {
            window.location.reload(true)
          }
        })
      })
    }
  }
}
</script>
