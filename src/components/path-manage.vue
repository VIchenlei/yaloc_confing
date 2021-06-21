<template>
  <div>
    <div class="dlg-window" v-if="isShow">
      <div class="dlg-bg">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="select-warp">
          <select v-model="selectOption">
            <option value="handAdd">手工创建模式</option>
            <option value="historyAdd">历史选择模式</option>
          </select>
        </div>
        <div class="btns">
            <button class="sure" @click="makesure">下一步</button>
            <button @click="close">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import dialogHead from '@/components/dialog-head'
import {mapState} from 'vuex'
export default {
  data () {
    return {
      headMsg: {
        title: '创建路径模板',
        closer: true
      },
      selectOption: 'handAdd'
    }
  },
  computed: {
    ...mapState({
      isShow: state => state.stateStore.showPathManage
    })
  },
  watch: {

  },
  methods: {
    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeShowPathManage')
    },
    // 确定函数
    makesure () {
      this.$store.commit('stateStore/chaneInitRecompose')
      switch (this.selectOption) {
        case 'handAdd':
          this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: 'handAdd'})
          break
        case 'historyAdd':
          this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: 'historyAdd'})
          this.$store.commit('stateStore/changeHistoryPath', {
            data: null
          })
          break
      }
      this.close()
    },
    //拖拽函数
    draggable () {
      let target = this.$el.querySelector('.dlg-bg')
      let handle = this.$el.querySelector('.tips-title')
      if(target && handle){
        window.setDraggable({
          target: target,
          handle: handle
        })
      }
    }
  },
  updated () { 
    if(this.$store.state.stateStore.showPathManage){
       this.draggable()
    }
  },
  components: {
    dialogHead
  }
}
</script>
<style lang="sass" scoped>
@import '../style/defs.sass'
.dlg-bg
  // max-height: 40rem
.btns
  display: flex
  justify-content: space-around
  margin: 1rem
.select-warp
  height: 7rem
  display: flex
  flex-direction: column
  align-items: center
  justify-content: space-around
  select, input
    height: 2.5rem
</style>
