<template>
  <div class="hintip-cont hide" ref="hintip-cont">
    <!-- <svg :class="'icon icon-tip {{value}}-tip'"><use xlink:href="/icons/icons.svg#icon-{value}-tip"></use></svg> -->
    <span>{{tip}}</span>
  </div>
</template>
<script>
const BG = {
  'success': '#DFF0D8',
  'failure': '#F2DEDE',
  'nochange': '#F80',
  'notsave': '#F80'
}
const that = this
export default {
  data () {
    return {
      value: null,
      tip: null,

    }
  },
  methods: {
    open (msg) {
      let value = msg.value
      this.value = value
      this.tip = msg.tip
      this.$el.classList.remove('hide')
      this.$refs['hintip-cont'].style = `background: ${BG[value]};`
      this.close()
    },
    close () {
      let self = this
      window.setTimeout(function () {
        self.$el.classList.add('hide') 
        self.$store.commit('metaStore/saveHintip', null)
      }, 3000)
    }
  },
  watch: {
    '$store.state.metaStore.hintip': {
      handler: function (result) {
        result && this.open(result)
      }
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../../style/defs.sass'
.hintip-cont
  position: absolute
  z-index: 9999
  top: 2rem
  margin-left: 50%
  border-radius: 5px
  font-size: 18px
  padding: 2rem
  @include flex-center
  transform: translateX(-50%)
</style>
