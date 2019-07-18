<template>
  <v-hover>
    <a slot-scope="{ hover }" 
        class="button-container"
        :class="{'button-container-hover': hover}"
        v-ripple
        :href="href"
        @click="$emit('click', $event.target.value)">
      <img :src="imageUrl"
          width="48px"
          height="48px"
          class="button-image"
          :class="{'button-image-hover': hover}"
          :title="title" />
      <div class="button-text body-1"
          :class="{'button-text-hover': hover}">
        {{title}}
      </div>
    </a>
  </v-hover>
</template>

<style scoped>
.button-container {
  border-radius: 5px;
  color: #000;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  padding: 5px;
  text-align: center;
  text-decoration: none;
}

.button-container-hover {
  background-color: rgba(255, 255, 255, .3);
}

.button-image {
  background-color: #fff;
  border-radius: 50%;
  margin: auto;
  padding: 5px;
  text-align: center;
}

.button-text {
  background-color: #fff;
  border-radius: 5px;
  padding: 4px;
  width: 96px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script>
export default {
  props: ['href', 'imageUrl', 'title']
}
</script>
