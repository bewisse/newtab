<template>
  <v-app>
    <v-content>
      <background />
      <topsites />
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
  }
}
</script>
