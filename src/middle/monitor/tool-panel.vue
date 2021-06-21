<template>
  <div class="tool-panel">
      <ul class="toolTitle">
          <li v-for="(item,index) in ToolItems" :key="index" @click="showToolList($event)" :ref="item.name"  :name="item.name">
            <svg class = "icon">
                <use :xlink:href="item.iconName"></use>
            </svg>
          </li>
      </ul>
  </div>
</template>
<script>
import {ToolItems} from '../../js/def/tool_panel_def.js'
import { ToolList } from '../../js/def/tool_list_def.js'
export default {
  data () {
    return {
      ToolItems: ToolItems,
      activeArr: new Map(),
      isDrawing: false,
      handName: null
    }
  },
  watch: {
    '$store.state.olMapMeasureLayer.mode': {
      handler: function (result) {
        this.isDrawing = result === 'drawing' ? true : false
      },
      deep: true
    },
    '$store.state.stateStore.initRecompose': {
      handler: function (result) {
          this.initRecompose()
      },
      deep: true
    },
    '$store.state.stateStore.showMonitorMsg.handName': {
      handler: function (result) {
          this.handName = result 
      },
      deep: true
    }
  },
  methods: {
    // 工具点击触发函数
    showToolList: function (evt) {
      let name = evt.currentTarget.getAttribute('name')
      if (name ==='coordinate') {
        evt.currentTarget.classList.toggle('active')
        let status = evt.currentTarget.classList.contains('active')
        this.$store.commit('mapService/changeMouse', {flag: status})
      } else if (name === 'recompose' && !this.isDrawing && this.handName != 'historyAdd'){
        evt.currentTarget.classList.toggle('active')
        let status = evt.currentTarget.classList.contains('active')
        this.$store.commit('mapService/changeSelectState',status)
      }
    },
    // 初始化修改路径函数
    initRecompose (){
      let target = this.$refs['recompose'][0]
      target.classList.remove('active')
      let status = target.classList.contains('active')
      this.$store.commit('mapService/changeSelectState',status)
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../../style/defs.sass'
.tool-panel
    @include absolute-right(1rem,1rem)
    @include wh(20rem,4rem)
    border: 1px solid #e3e3e3
    background: #f5f5f5
    .icon
        fill: #ccc
    .toolTitle,li,.toolList
        margin: 0
    .toolTitle
        li
          @include align-middle-between
          justify-content: space-around
          margin-left: 1rem
          &.active
            border-top: 0
            .icon
              fill: $main-color
    .toolList
        @include wh(auto,auto)
        display: flex
        flex-direction: column
        height: auto
        padding: 0.5rem
        background: #FFF
        min-width: 100px
        position: absolute
        top: 5.4rem
        li
            @include wh(100%,1.75rem)
            font-size: 12px
            display: flex
            align-items: center 
            // &:active,&hover
            //   color:#09F
            span
                margin-left: .75rem
        .triangle
            width: 1px
            @include absolute-left(-2.7rem,60%)
            border-bottom: 16px solid #fff
            border-left: 10px solid transparent
            border-right: 9px solid transparent
</style>

