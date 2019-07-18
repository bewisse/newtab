import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import root from './root.vue'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.use(Vuetify)

/* eslint-disable no-new */
new Vue({
  el: '#root',
  render: h => h(root)
})
