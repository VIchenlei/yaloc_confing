<template>
  <div>
    <div class="dlg-window" v-if="isShow" v-show="!previewing">
      <div class="dlg-bg">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="path-time" v-if="rows && rows.length > 0">
          <span>考勤时间：{{startTime}} - {{endTime}}</span>
          <div class="controlWarp">
            <select-input :topicname="tableName" oldvalue="0" name="control" @chooseItem="chooseControl"></select-input>
            <input type="text" v-model="controlTime">
            <span>单位(min)</span>
            <button @click="changControl">确定</button>
          </div>
          <button @click="preview">预览</button>
        </div>
        <div class="content-warp">
          <div class="inner-content-warp">
            <p v-for="(row, i) in rows" :key="row.index" class="list">
              <span v-show="!modifyMessageEnd" @click="addPoint(i)" class="iconwarp hint--bottom-right" aria-label="添加轨迹点">
                  <img class='pointImg' src="../assets/add.png" alt="">
              </span>
              <span v-show="!modifyMessageEnd" @click="deletePoint(i)" class="iconwarp hint--bottom-right" aria-label="删除轨迹点">
                  <img class='pointImg' src="../assets/reduce.png" alt="">
              </span>
              <span v-show="!modifyMessageEnd" >分站名称:</span>
              <select-input v-show="!modifyMessageEnd" :rowIndex="i" :topicname="tableName" :oldvalue="row.reader_id" :name="'reader_id'" :disabled="row.old_state === 1 ? true : false" @chooseItem="choose"></select-input>
              <span>坐标X:</span>
              <input class="point" type="text" v-model="row.x">
              <span>坐标Y:</span>
              <input class="point" type="text" v-model="row.y">
              <span v-if="tableName === 'rpt_att_staff'" >时间:</span>
              <input class="time-input" v-if="tableName === 'rpt_att_staff'" type="text" v-model="row.end_time" disabled="disabled">
              <span class="timeSpan">持续时间(min):</span>
              <input class="point" type="text" v-model="row.last_time" @input="computeSpeed">
              <span class="timeSpan">速度(km/h):</span>
              <input class="point" type="text" v-model="row.speed" disabled="disabled">
            </p>
            <p class="list" v-show="rows && rows.length > 0 && !modifyMessageEnd">
              <span @click="addPoint(rows.length-1)" class="iconwarp hint--bottom-right" aria-label="添加轨迹点">
                  <img class='pointImg' src="../assets/add.png" alt="">
              </span>
            </p>
          </div>
          <blank-message :blankMsg="message" class="blank-message" v-if="!rows || rows.length <= 0"></blank-message>
        </div>
        <div class="btns">
          <button class="sure" @click="makesure">确定</button>
          <button @click="close">取消</button>
        </div>
      </div>
    </div>
    <div class="botton-warp" v-show="previewing">
      <button class="preview-botton" @click="changePreviewing">返回</button>
    </div>
  </div>
</template>
<script>
import {getRows, trim, composeUpdateDBReq, getMessage, clone} from '@/js/utils/utils.js'
import dialogHead from '@/components/dialog-head'
import blankMessage from '../components/blank-message.vue'
import selectInput from '@/components/select-input'
import {mapState} from 'vuex'
export default {
  data () {
    return {
      isShow: false,
      headMsg: {
        title: '手工路径模板修改',
        closer: true,
      },
      virtual_path_id: 'virtual_path_id',
      field_value: 1,
      rows: null,
      message: '当前无数据',
      previewing: false,
      pathId: null,
      valid: 0,
      tableName: null,
      objID: null,
      startTime: null,
      endTime: null,
      maxTime: null,
      minTime: null,
      modifyMessageEnd: false,
      controlTime: 0,
      controlNunmber: 0
    }
  },

  watch: {
    '$store.state.stateStore.UpdateOldPathMsg': {
      handler: function (result) {
        this.isShow = result.showUpdateOldPath
        this.tableName = result.tableName
        if(result.data){
          this.headMsg.title = '历史轨迹修改'
          this.startTime = new Date(result.data.start_time).format('yyyy-MM-dd hh:mm:ss')
          this.endTime = new Date(result.data.end_time).format('yyyy-MM-dd hh:mm:ss')
          this.objID = result.data.staff_id
          let shiftID = result.data.shift_id
          this.queryDB(shiftID)
        }
      },
      deep: true
    },
    '$store.state.socketStore.reptShowResult': {
      handler: function (result) {
        if(result.def.name === 'updatePathRpt'){
          this.rows = result.rows.hasOwnProperty('pathSql') ? clone(result.rows.pathSql) : []
          let oldrows = clone(result.rows.rptSql)
          this.$store.commit('stateStore/changeShowXhint',{
            showXhint: false,
            data: null
          })
          if(this.rows.length > 0){
            if (this.tableName === 'rpt_att_staff') {
              let endTimeArr = oldrows[0]
              this.endTime = endTimeArr.end_time
              this.startTime = endTimeArr.start_time
            }
          }
        }
      },
      deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        if(result.data.name === "updatePathRpt"){
          let msg = {
            value: result.code === 0 ? 'success' : 'failure',
            tip: result.code === 0 ? '修改成功' : '修改失败'
          }
          window.xdata.commit('metaStore/saveHintip', msg)
          if(result.code === 0) this.close()
        }
      },
      deep: true
    },
    '$store.state.mapService.modifyMessage': {
      handler: function (result) {
        
        if(result.modifyId === 'hisTrackLine' && result.modifyData && result.modifyData.length > 0 && this.isShow) {
          this.previewing = false
          this.modifyMessageEnd = true
          this.$store.commit('stateStore/changeIsPreview', this.previewing)
          this.$store.commit('stateStore/changeShowMonitor',{showMonitor: false, handName: null})
          let oldRows = clone(this.rows)
          if(oldRows && oldRows.length === result.modifyData.length){
            this.rows = result.modifyData.map((item,i) =>{
              if(oldRows[i].x === item[0] && oldRows[i].y === (item[1] * -1)){
                item = oldRows[i]
              }else{
                oldRows[i].x = item[0]
                oldRows[i].y = item[1] * -1
                item = oldRows[i]
              }
              return item
            })
          }else{
            this.rows = result.modifyData.map((item,i) =>{
              let oldObj = oldRows.filter(it => it.x === item[0] && it.y === (item[1] * -1))
              if(oldObj[0]){
                item = oldObj[0]
              }else{
                if (this.tableName === 'rpt_att_staff' && i === 0) {
                  item = {x:item[0],y: (item[1] * -1),begin_time: this.startTime}
                } else {
                  item = {x:item[0],y: (item[1] * -1)}
                }
              }
              return item
            })
          }
          
        }
      },
      deep: true
    },
    '$store.state.stateStore.hintChangeTime': {
      handler: function (result) {
        let toChange = result.toChange
        if (toChange) {
          this.changeTime()
        }
      },
      deep: true
    },
  },

  methods: {
    // 查询数据函数
    queryDB (shiftID) {
      this.$store.commit('stateStore/changeShowXhint',{
        showXhint: true,
        data: null
      })
      let that = this
      let sql = null
      sql = {
        pathSql: `select reader_id, begin_pt, round(timestampdiff(second,hl.begin_time,hl.last_time)/60,2) as last_time, date_format(last_time, "%Y-%m-%d %H:%i:%s") as end_time, round( speed * 7.2, 1) as speed, bt.staff_id, bt.card_id, date_format(begin_time, "%Y-%m-%d %H:%i:%s") as begin_time, hl.area_id, direction from his_location_staff_ hl,dat_staff_extend bt left join (select ras.staff_id,ras.start_time as rpt_start_time, ras.end_time as rpt_end_time from rpt_att_staff ras left join dat_staff ds ON ds.staff_id = ras.staff_id where ras.staff_id = ${this.objID} and ras.shift_id = ${shiftID} and ras.start_time BETWEEN "${new Date(this.startTime).format('yyyy-MM-dd hh:mm:ss')}" AND "${new Date(this.endTime).format('yyyy-MM-dd hh:mm:ss')}" and timestampdiff(SECOND, start_time, end_time) >= 10) aa on aa.staff_id = bt.staff_id where hl.obj_id=bt.staff_id and bt.staff_id= ${this.objID} and begin_time >= aa.rpt_start_time and begin_time <= aa.rpt_end_time order by begin_time, end_time;`,
        rptSql: `select ras.staff_id,ds.name,ras.card_id, date_format(ras.start_time, "%Y-%m-%d %H:%i:%s") as start_time, date_format(ras.end_time, "%Y-%m-%d %H:%i:%s") as end_time from rpt_att_staff ras left join dat_staff ds on ds.staff_id = ras.staff_id where 1=1 and ras.staff_id = ${this.objID} and ras.shift_id = ${shiftID} and ras.start_time BETWEEN "${new Date(this.startTime).format('yyyy-MM-dd hh:mm:ss')}" AND "${new Date(this.endTime).format('yyyy-MM-dd hh:mm:ss')}" and timestampdiff(SECOND, start_time, end_time) >= 10;`
      }
      let message = {
        cmd: 'query',
        data: {
          name: 'updatePathRpt',
          sql: sql
        }
      }
      console.log('message', message)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'REPT-FETCH-DATA',
        data: {
          cmd: 'REPT',
          data: message,
          def: {
            name: 'updatePathRpt'
          }
        }
      })
    },

    // 拖拽函数
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

    // 点击预览函数
    preview () {
      this.previewing = true
      let msg = this.processTrackDataTime(this.rows)
      this.$store.commit('stateStore/changeIsPreview', this.previewing)
      this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: 'updatePath'})
      if(this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
        this.$store.commit('olMapTrackLayer/hideTrack')
      }
      this.$store.commit('olMapTrackLayer/drawWholeTrack',{msg: msg, PatrolPath: 'PatrolPath'})
    },

    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeUpdateOldPath', {
          showUpdateOldPath: false,
          tableName: null,
          data: null
      })
      this.rows = null
      this.controlTime = 0,
      this.controlNunmber = 0
      if(this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
        this.$store.commit('olMapTrackLayer/hideTrack')
      }
      this.modifyMessageEnd = false
    },

    // 计算速度函数
    computeSpeed () {
      this.rows = this.rows.map((item,index) =>{
        item.speed = this.rows[index+1] && this.rows[index].last_time ? this.GetDistance(this.rows[index+1].x, this.rows[index+1].y, this.rows[index].x, this.rows[index].y) / this.rows[index].last_time * 60 : 0
        let beginTime = this.rows[index].begin_time
        let last_time = this.rows[index].last_time ? this.rows[index].last_time : 0
        item.end_time = new Date(new Date(beginTime).getTime() + last_time*60*1000).format('yyyy-MM-dd hh:mm:ss')
        if (this.rows[index+1]) {
          this.rows[index+1].begin_time = item.end_time
        }
        if (isNaN(item.speed)) {
          item.speed = 0
        } else if (!isFinite(item.speed)) {
          item.speed = 0
        } else {
          item.speed = item.speed.toFixed(1)
        }
        return item
      })
    },

    // 计算两点距离函数
    GetDistance (p2x, p2y, p1x, p1y) {
      let dx = Math.abs(p2x - p1x)
      let dy = Math.abs(p2y - p1y)
      return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2)) * 2 / 1000
    },

    //增加点函数
    addPoint (i) {
      let point = clone(this.rows)[i]
      point.old_state = 0
      this.rows.splice(i+1,0,point)
      this.computeSpeed()
    },

    //删除点函数
    deletePoint (i){
      this.rows.splice(i,1)
      this.computeSpeed()
    },

    //select选择返回函数
    choose(data){
      if(data[1] === 'reader_id'){
        let readerId = Number(data[0])
        let rowIndex = data[2]
        let readerObj = xdata.state.metaStore.data.reader.get(readerId)
        if (readerObj) {
          this.rows[Number(rowIndex)].x = readerObj.x
          this.rows[Number(rowIndex)].y = readerObj.y
        }
      }
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

    // 更改预览状态函数
    changePreviewing (evt) {
      this.previewing = false
      this.$store.commit('stateStore/changeIsPreview', this.previewing)
      this.$store.commit('mapService/choosePreFeature')
      this.$store.commit('stateStore/changeShowMonitor',{showMonitor: false, handName: null})
    },

    // 确定函数
    makesure () {
      let checkRows = true
       let noticeServer = [1]
      let tipText = ''
      let detail = ''
      this.rows.some(item => {
        if (!item.speed && item.speed != 0 ) {
          checkRows = false
          tipText = '请填入速度'
          return true
        }
      })
      if (!checkRows) {
        window.xdata.commit('metaStore/saveHintip', {value: 'failure', tip: tipText})
        return
      }
      let sql = {}
      let req = null
      let groupid = new Date().format('yyyy-MM-dd hh:mm:ss')
      for (let i = 0; i < this.rows.length; i++) {
        sql[`${i}`] = `INSERT into his_virtual_location_staff (obj_id, begin_pt, begin_time, last_time, speed, old_begin_time, old_last_time, groupid, user_id) VALUES(${this.objID},'${this.rows[i].x + ',' + this.rows[i].y}',"${this.rows[i].begin_time}","${this.rows[i].end_time}",${this.rows[i].speed ? (this.rows[i].speed/7.2).toFixed(3) : 0}, "${this.startTime}", "${this.endTime}", "${groupid}", "${xdata.username}")`
      }
      detail = `员工编号:${this.objID}`
      req = composeUpdateDBReq('INSERT', 'updatePathRpt', detail, sql)
      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },

    chooseControl (data) {
      if(data[1] === 'control'){
        this.controlNunmber = Number(data[0])
      }
    },

    changControl () {
      this.$store.commit('stateStore/changeHintChangeTime',{
        toChange: false
      })
    },

    changeTime () {
      let controlTime = Number(this.controlTime)
      let controlNunmber = this.controlNunmber
      // this.startTime = this.computeTime(this.startTime, controlTime, controlNunmber)
      // this.endTime = this.computeTime(this.endTime, controlTime, controlNunmber)
      this.rows.map(item => {
        item.begin_time = this.computeTime(item.begin_time, controlTime, controlNunmber)
        item.end_time = this.computeTime(item.end_time, controlTime, controlNunmber)
      })
    },

    computeTime (time, controlTime, controlNunmber) {
      if (controlNunmber == 1) { //向后平移
        return new Date(new Date(time).getTime() + controlTime * 60 * 1000 ).format('yyyy-MM-dd hh:mm:ss')
      } else {
        return new Date(new Date(time).getTime() - controlTime * 60 * 1000 ).format('yyyy-MM-dd hh:mm:ss')
      }
      
    }
  },

  updated () { 
    if(this.$store.state.stateStore.UpdateOldPathMsg.showUpdateOldPath){
       this.draggable()
    }
  },

  components: {
    dialogHead,
    blankMessage,
    selectInput
  }
}
</script>
<style lang="sass" scoped>
@import '../style/defs.sass'
.path-time
  padding: 1rem 2rem 1rem 1rem
  display: flex
  display: flex
  flex-direction: row
  justify-content: space-between
  span
    font-weight: 700
    width: auto
  .controlWarp
    display: flex
    align-items: center
    width: 17rem
    justify-content: space-between
    select
      width: 5rem
      border: 1px solid #c0c2c3
      height: 1.6rem
    input
      width: 3rem
      height: 1.6rem
.content-warp
  max-height: 40rem
  overflow-y: scroll
  overflow-y: auto
  overflow-x: hidden
.inner-content-warp
  margin: 1rem
  border: 1px solid #999999
.alarm-search
  display: flex
  margin-top: 1rem
  align-items: center
  div
    margin-left: 2rem
  button
    margin-left: 3rem
.list
  position: relative
  .time-input
    width: 9rem
.pointImg
  width: 1.25rem
  height: 1.25rem
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
.point
  width: 4rem
  text-align: center
.iconwarp
  width: 2rem
.timeSpan
  width: 7rem
.btns
  display: flex
  justify-content: space-around
  margin: 1rem
.tips
  color: red
.enableNull
  color: red
  font-size: 12px
.botton-warp
  position: absolute
  left: 10px
  top: 10px
  z-index: 999
.drog-botton
  cursor: move
</style>