<template>
  <div class="dlg-window" v-if="isShow">
    <div class="dlg-bg">
      <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
      <div class="dlg-body about-content">
        <span class="system-title">{{sysInfo.name}}</span>
        <p>
          <span>{{sysInfo.version[0]}}</span>
          <span>{{sysInfo.version[1]}}</span>
        </p>
        <p>
          <span>{{sysInfo.time[0]}}</span>
          <span>{{sysInfo.time[1]}}</span>
        </p>
        <p>
          <span>{{sysInfo.author[0]}}</span>
          <span>{{sysInfo.author[1]}}</span>
        </p>
        <p><a href="http://www.beijingyongan.com" target="_blank">联系我们</a></p>
      </div>
    </div>
  </div>
</template>
<script>
import dialogHead from '@/components/dialog-head'
import {sysInfo} from '../js/def/sysinfo.js'
import {mapState} from 'vuex'
export default {
  data () {
    return {
      headMsg: {
        title: '关于...',
        closer: true
      },
      sysInfo: sysInfo
    }
  },
  computed: {
  ...mapState({
      isShow: state => state.stateStore.showAbouts
    })
  },
  methods:{
    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeShowAbouts')
    }
  },
  watch: {
    
  },
  components: {
    dialogHead
  }
}
</script>
<style lang="sass" scoped>
@import '../style/defs.sass'
.about-content
  @include wh(18rem,10rem)
  padding: 1rem
  p
    padding: .2rem 1rem
    a
      color: #0099ff
  .system-title
    padding: 0 1rem 1rem
    font-weight: bold
    color: #000

</style>
