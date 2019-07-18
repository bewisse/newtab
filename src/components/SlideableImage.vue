<template>
  <div>
    <img class="background-image"
        v-if="oldImage && oldImage.src"
        :class="{transition: enableTransition, 'transition-out': enableTransition}"
        :src="oldImage.src"
         />
    <img class="background-image"
        v-if="image && image.src"
        :class="{transition: enableTransition, 'transition-reset': oldImage && !enableTransition}"
        :src="image.src"
        @load="onImageLoaded" />
  </div>
</template>

<style scoped>
.background-image {
  height: 100%;
  left: 0;
  object-fit: cover;
  overflow: hidden;
  position: absolute;
  width: 100%;
  will-change: left;
}

.transition {
  transition: left 500ms ease-out;
}

.transition-out {
  left: -100%;
}

.transition-reset {
  left: 100%;
}
</style>

<script>
export default {
  props: ['image'],

  data() {
    return {
      enableTransition: false,
      oldImage: null
    }
  },

  methods: {
    onImageLoaded() {
      if (this.oldImage) {
        this.enableTransition = true
      }
      setTimeout(this.fixImagePosition, 1000)
      this.$emit('load', this.image)
    },

    fixImagePosition() {
      this.enableTransition = false
      this.oldImage = this.image
    }
  }
}
</script>
