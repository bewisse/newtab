<template>
  <v-card color="rgba(255, 255, 255, 0)" class="content">
    <v-btn @click="requestPermission(['clipboardRead'])"
        color="primary"
        v-if="!permissions.includes('clipboardRead')">
      Show clipboard
    </v-btn>
    <v-btn @click="requestPermission(['sessions', 'tabs'])"
        color="primary"
        v-if="!permissions.includes('sessions')">
      Show recently closed sessions
    </v-btn>
    <v-btn @click="requestPermission(['history'])"
        color="primary"
        v-if="!permissions.includes('history')">
      Show recent history
    </v-btn>
    <v-list subheader
        class="transparent"
        :dense="$vuetify.breakpoint.mdAndDown"
        v-for="(suggestion, suggestionIndex) in suggestions"
        :key="suggestionIndex">
      <v-subheader>{{suggestion.title}}</v-subheader>
      <v-list-tile
          v-for="(item, itemIndex) in suggestion.items"
          :key="itemIndex"
          avatar
          :href="!item.requireClickHandler ? item.metadata : ''"
          @click="item.requireClickHandler ? open(item, $event) : ''">
        <v-list-tile-avatar>
          <v-icon large v-if="item.icon">{{item.icon}}</v-icon>
          <img :src="item.imageUrl" v-if="item.imageUrl">
        </v-list-tile-avatar>

        <v-list-tile-content>
          <v-list-tile-title v-text="item.title"></v-list-tile-title>
          <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action @click.stop.prevent='remove(item)' v-if='item.deletionToken'>
          <v-icon color="gray">
            clear
          </v-icon>
        </v-list-tile-action>
      </v-list-tile>
      <v-divider v-if="suggestionIndex != suggestions.length - 1"></v-divider>
    </v-list>
  </v-card>
</template>

<style scoped>
.content {
  background-image: linear-gradient(to right, #fff 20%, rgba(255, 255, 255, .8));
  margin-bottom: 64px;
  width: 100%;
}
</style>


<script>
import suggestionService from '../services/suggestion'

export default {
  data() {
    return {
      clipboard: [],
      recentSearches: [],
      recentSessions: [],
      history: [],
      permissions: []
    }
  },

  computed: {
    suggestions: function() {
      const suggestions = []
      const addSuggestionIfNotEmpty = (suggestion) => {
        if (suggestion.items.length > 0) {
          suggestions.push(suggestion)
        }
      }
      addSuggestionIfNotEmpty({
        title: 'Clipboard',
        items: this.clipboard
      })
      addSuggestionIfNotEmpty({
        title: 'Recent search',
        items: this.recentSearches
      })
      addSuggestionIfNotEmpty({
        title: 'Recently closed',
        items: this.recentSessions
      })
      addSuggestionIfNotEmpty({
        title: 'History',
        items: this.history
      })
      return suggestions
    }
  },

  created() {
    chrome.permissions.getAll(result => {
      this.permissions = result.permissions
      this.refreshSuggestions()
    })
  },

  methods: {
    requestPermission(permissions) {
      chrome.permissions.request({
        permissions
      }, granted => {
        if (granted) {
          this.permissions.push(...permissions)
          this.refreshSuggestions()
        }
      })
    },

    refreshSuggestions() {
      const initialY = window.scrollY
      const allPromises = []
      if (this.permissions.includes('clipboardRead')) {
        suggestionService.suggestClipboard().then(items => {
          this.clipboard = items
        })
      }
      suggestionService.suggestRecentSearches().then(items => {
        this.recentSearches = items
      })
      if (this.permissions.includes('sessions')) {
        suggestionService.suggestRecentSessions().then(items => {
          if (items.length > 0) {
            this.recentSessions = items
          }
          setTimeout(() => {
            suggestionService.suggestRecentSessions().then(items => {
              this.recentSessions = items
            })
          }, 3000)
        })
      }
      if (this.permissions.includes('history')) {
        suggestionService.suggestHistory().then(items => {
          this.history = items
        })
      }
      Promise.all(allPromises).then(() => {
        window.scrollTo(0, initialY)
      })
    },

    open(item, event) {
      suggestionService.open(item, {openAsNewTab: event.ctrlKey})
    },

    remove(item) {
      suggestionService.remove(item).then(this.refreshSuggestions)
    }
  }
}
</script>
