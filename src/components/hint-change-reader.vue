<template>
  <div class="dlg-window" v-if="isShow">
    <div class="dlg-bg">
      <div class="tips">
        <div>警告：请确定开始与结尾为井上分站?</div>
        <div>点击确定：继续保存</div>
        <div>点击取消：取消保存</div>
      </div>
      <div class="btns">
        <button class="sure" @click="makesure">确定</button>
        <button class="cancel" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>
<script>
import {mapState} from 'vuex'

export default {
  data () {
    return {
    }
  },
  computed: {
    ...mapState({
      isShow: state => state.stateStore.hintChangeReader.isShow,
    })
  },
  watch: {
  },
  methods: {
    close () {
      this.$store.commit('stateStore/changeHintChangeReader', {toChange: false})
    },
    makesure(){
      this.$store.commit('stateStore/changeHintChangeReader', {toChange: true})
    }
  }
}
</script>
<style lang="sass" scoped>
  @import '../style/defs.sass'
  .dlg-bg
    max-height: 40rem
  .list
    position: relative
    .tip
      position: absolute
      right: 3rem
      top: 3rem
      font-size: 12px
      color: red
  p
    display: flex
    align-items: center
    @include wh(100%, 4rem)
    padding: 0 1rem
  span
    width: 10rem
  select, input
    height: 1.5rem
  .btns
    display: flex
    justify-content: space-around
    margin: 1rem
  .tips
    color: red
    display: flex
    align-items: center
    font-weight: bold
    justify-content: space-between
    flex-direction: column
    height: 7rem
    padding: 2rem
    @include wh(20rem, 7rem)
</style>
