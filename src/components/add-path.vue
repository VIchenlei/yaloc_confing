<template>
  <div class="dlg-window" v-show="isShow">
    <div class="dlg-bg">
      <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
      <div class="add-content">
        <div class="inner-add-content">
          <p>
            <span>路径模板名称：</span>
            <input type="text" v-model="pathName">
          </p>
          <p v-for="(row, i) in rows" :key="row.index" class="list">
            <span>坐标X:</span>
            <input type="text" v-model="row[0]">
            <span>坐标Y:</span>
            <input type="text" v-model="row[1]">
            <span class="left-content" v-if="i != (rows.length-1)">持续时间(min):</span>
            <input class="left-content time-input" v-if="i !== (rows.length-1)" type="text" v-model="row[2]" @input="computeSpeed" @focus="drawHintLine(row,rows[i+1])" @blur="hideHintLine(row,rows[i+1])">
            <span class="left-content" v-if="i !== (rows.length-1)" >速度(km/h):</span>
            <input class="left-content" v-if="i !== (rows.length-1)" type="text" v-model="row[3]" disabled="disabled">
            <span class="left-content" v-if="i != (rows.length-1)">总时间(min):</span>
            <input class="left-content" v-if="i !== (rows.length-1)" type="text" :value="getCountTime(row,i)" disabled="disabled">
          </p>
        </div>   
      </div> 
      <div class="btns">
        <button class="sure" @click="makesure">确定</button>
        <button class="cancel" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>
<script>
import {getRows, trim, composeUpdateDBReq, getMessage, metaUpdateRes, clone} from '@/js/utils/utils.js'
import dialogHead from '@/components/dialog-head'
import {mapState} from 'vuex'
export default {
  data () {
    return {
      virtual_path_id: 'virtual_path_id',
      field_value: 1,
      field_type: 'SELECT', 
      rows: null,
      pathId: 0,
      pathName: '',
      headMsg: {
        title: '手动路径模板添加',
        closer: true
      },
      valid: true
    }
  },
  computed: {
  ...mapState({
      isShow: state => state.olMapMeasureLayer.showAddpath
    })
  },
  watch: {
    '$store.state.olMapMeasureLayer.path_message': {
      handler: function (result) {
        if(result && result.path_data){
          this.pathName = ''
          this.rows = clone(result.path_data)
          this.valid = result.valid
        }
      },
      deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        if(result.data.name === "his_virtual_path" && result.data.op ==='INSERT'){
          let msg = {
            value: result.code === 0 ? 'success' : 'failure',
            tip: result.code === 0 ? '新增成功' : '新增失败'
          }
          window.xdata.commit('metaStore/saveHintip', msg)
          if(result.code === 0) this.close()
        }
      },
      deep: true
    },
    '$store.state.mapService.modifyMessage': {
      handler: function (result) {
        if(result.modifyId !== 'hisTrackLine' && result.modifyData && result.modifyData.length > 0) {
          let oldRows = clone(this.rows)
            // console.log(oldRows,result.modifyData)
          if(oldRows.length === result.modifyData.length){
            this.rows = result.modifyData.map((item,i) =>{
              if(Number(oldRows[i][0]) === item[0] && Number(oldRows[i][1]) === item[1]){
                item = oldRows[i]
              }else{
                oldRows[i][0] = item[0]
                oldRows[i][1] = item[1]
                item = oldRows[i]
              }
              return item
            })
          }else{
            this.rows = result.modifyData.map((item,i) =>{
              let oldObj = oldRows.filter(it => Number(it[0]) === item[0] && Number(it[1]) === item[1])
              if(oldObj[0]){
                item = oldObj[0]
              }else{
                item = [item[0],item[1]]
              }
              return item
            })
          }
          this.$store.commit('olMapMeasureLayer/changeShowAddpath')
        }
      },
      deep: true
    },
    '$store.state.stateStore.saveDB': {
      handler: function (result) {
        this.saveDB()
      },
      deep: true
    },
  },
  methods: {
    //关闭函数
    close () {
      this.$store.commit('olMapMeasureLayer/hideAdd')
      this.$store.commit('stateStore/changeShowPathHint',false)
    },
    //计算速度函数
    computeSpeed (evt) {
      this.rows = this.rows.map((item,index) =>{
        item[3] = this.rows[index+1] && this.rows[index][2] ? this.GetDistance(this.rows[index+1][0], this.rows[index+1][1], this.rows[index][0], this.rows[index][1]) / this.rows[index][2]*60 : 0
        item[3] = item[3].toFixed(1)
        return item
      })
    },
    //获取点距离函数
    GetDistance (p2x, p2y, p1x, p1y) {
      let dx = Math.abs(p2x - p1x)
      let dy = Math.abs(p2y - p1y)
      return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2)) * 2 / 1000
    },
    //确定函数
    makesure () {
      if(!this.pathName){
        window.xdata.commit('metaStore/saveHintip', {value: 'failure', tip: '请输入路径名称'})
        return
      }else{
        let value = value = trim(this.pathName)
        let table = xdata.state.metaStore.data.virtual_path
        let isHas = table && Array.from(table.values()).some(item => item.name === value)
        if (isHas) return window.xdata.commit('metaStore/saveHintip', {value: 'failure', tip: '路径名称已被注册！'})
      }
      let checkRows = true
      let tipText = ''
      this.rows.some(item => {
        if (!item[3] && item.speed != 0) {
          checkRows = false
          tipText = '请填入速度'
          return true
        } 
        // else if (item[3] > 25) {
        //   checkRows = false
        //   tipText = '速度需小于25km/h'
        // }
      })
      if (!checkRows) {
        window.xdata.commit('metaStore/saveHintip', {value: 'failure', tip: tipText})
        return
      }
      if(!this.valid){
        this.$store.commit('stateStore/changeShowPathHint', true)
        this.$store.commit('olMapMeasureLayer/changeShowAddpath')
      }else{
        this.saveDB()
      }
    },
    // 更改页面显示函数
    changeisShow () {
      this.$store.commit('olMapMeasureLayer/changeShowAddpath')
    },
    // 设置拖拽函数
    draggable () {
      let target = this.$el.querySelector('.dlg-bg')
      let handle = this.$el.querySelector('.tips-title')
      if(target && handle){
        window.setDraggable({
          target: target,
          handle: handle
        })
      }
      
    },
    // 获取总时间累加函数
    getCountTime (row,i) {
        let countTime = this.rows.slice(0,i+1).reduce(function (preTotal,item) {
        let number = item[2] ? Number(item[2]) : 0
        return preTotal + number
      },0)
      return countTime
    },
    // 存数据sql函数
    saveDB () {
      let noticeServer = [1]
      let store = window.xdata.state.metaStore && window.xdata.state.metaStore
      this.pathId = store.maxIDs['virtual_path'] + 1
      let DVPsql = `INSERT into dat_virtual_path (virtual_path_id, name, type, valid) VALUES(${this.pathId}, '${this.pathName}', 1, ${this.valid ? 1 : 0})`
      let DVPreq = composeUpdateDBReq('INSERT', 'virtual_path', 0, DVPsql)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: DVPreq
      })
      let sql = {}
      for (let i = 0; i < this.rows.length; i++) {
        sql[`${i}`] = `INSERT into his_virtual_path (virtual_path_id, begin_pt, last_time, speed) VALUES(${this.pathId},'${this.rows[i][0]},${this.rows[i][1] * -1}',${this.rows[i][2] ? this.rows[i][2] : 0},${this.rows[i][3]})`
      }
      let req = composeUpdateDBReq('INSERT', 'his_virtual_path', 0, sql)
      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },
    drawHintLine (row,nextRow) {
      let rows = [
        {
          x: Number(row[0]),
          y: Number(row[1]) * -1
        },
        {
          x: Number(nextRow[0]),
          y: Number(nextRow[1]) *-1
        }
      ]
      let msg = this.processTrackDataTime(rows)
      this.$store.commit('olMapTrackLayer/drawHintLine',{msg: msg, PatrolPath: 'HintPath'})
    },
    hideHintLine (row) {
      this.$store.commit('olMapTrackLayer/hideHintTrack')
    },
    // 格式化数据函数
    processTrackDataTime (rows) {
      let id = xdata.state.mapStore.defaultMapID
      let msg = {
        mapID: id,
        rows: rows,
      }
      return msg
    },
  },
  updated(){
    if(this.$store.state.olMapMeasureLayer.showAddpath){
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
.add-content
  max-height: 40rem
  overflow-y: scroll
  overflow-y: auto
  overflow-x: hidden
.inner-add-content
  margin: 1rem
  border: 1px solid #999999
.list
  position: relative
  .left-content
    margin-top: 4rem
  .time-input
    width: 4rem
p
  display: flex
  align-items: center
  @include wh(100%, 4rem)
  padding: 0 1rem
span
  width: 5rem;
  text-align: center
select, input
  height: 1.5rem
.btns
  display: flex
  justify-content: space-around
  margin: 1rem
.tips
  color: red
.enableNull
  color: red
  font-size: 12px
</style>
