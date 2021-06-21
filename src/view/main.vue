<template>
  <div class="main">
    <head-view></head-view>
    <router-view v-show="!showMonitor"/>
    <monitor-view :style="{'visibility': showMonitor ? 'visible' : 'hidden'}" :handName="handName"></monitor-view>
    <foot-view></foot-view>
  </div>
</template>
<script>
import headView from '@/header/head'
import footView from '@/foot/foot'
import monitorView from '@/middle/monitor/sp_monitor'
import {mapState} from 'vuex'
export default {
  data () {
    return {
      showMonitor: false,
      handName: null
    }
  },
  computed: {
  },
  watch: {
    '$store.state.stateStore.showMonitorMsg': {
      immediate:true,
      handler: function (result) {
          if(result){
            this.showMonitor = result.showMonitor
            this.handName = result.handName
          }
      },
      deep: true
    },
  },
  components: {
    headView,
    footView,
    monitorView
  }
}
</script>
<style lang="sass">
  @import '../style/defs.sass'
  .main
    display: flex
    @include wh(100%, 100%)
    flex-direction: column
</style>

