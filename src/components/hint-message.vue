<template>
  <div class="dlg-window" v-if="isShow">
    <div class="dlg-bg">
      <p class="tips">是否确定更改部门的显示隐藏？</p>
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
      isShow: state => state.stateStore.showHint,
      checkStatus : state=> state.stateStore.checkStatus
    })
  },
  watch: {
  },
  methods: {
    close () {
      this.$store.commit('stateStore/changeShowHint',{
        checkStatus: this.checkStatus
      })
    },
    makesure(){
      this.$store.commit('stateStore/changeShowHint',{
        checkStatus: !this.checkStatus
      })
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
