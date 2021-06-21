<template>
  <div class="dlg-window" v-if="isShow">
    <div class="dlg-bg">
      <p class="tips">警告：该路径中包含非法路径</p>
      <p class="tips">点击确定：将路径强制存储</p>
      <p class="tips">点击取消：修改该条路径</p>
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
      isShow: state => state.stateStore.showPathHint
    })
  },
  watch: {
  },
  methods: {
    // 确定函数
    makesure () {
      this.$store.commit('stateStore/changeSaveDB')
    },
    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeShowPathHint', false)
    }
  },
  components: {
    
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
    border: 1px solid #9999
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
</style>
