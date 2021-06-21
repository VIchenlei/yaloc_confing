<template>
  <div>
    <div class="dlg-window" v-if="isShow" v-show="!previewing">
      <div class="dlg-bg">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="path-valid" v-if="tableName === 'virtual_path'">
          <span>路径是否有效：</span>
          <select-input topicname="virtual_path" name="valid" :oldvalue="valid" @chooseItem="choose" ></select-input>
        </div>
        <div class="path-valid" v-if="tableName === 'rpt_att_staff' && minTime">
          <span>考勤时间：{{minTime}} - {{maxTime}}</span>
        </div>
        <div class="content-warp">
          <div class="inner-content-warp">
            <p v-for="(row, i) in rows" :key="row.index" class="list">
              <span>坐标X:</span>
              <input type="text" v-model="row.x">
              <span>坐标Y:</span>
              <input type="text" v-model="row.y">
              <span v-if="tableName === 'rpt_att_staff'" >时间:</span>
              <input class="time-input" v-if="tableName === 'rpt_att_staff'" type="text" v-model="row.end_time" disabled="disabled">
              <span class="left-content" v-if="i != (rows.length-1)">持续时间(min):</span>
              <input class="left-content" v-if="i !== (rows.length-1)" type="text" v-model="row.last_time" @input="computeSpeed" @focus="drawHintLine(row,rows[i+1])" @blur="hideHintLine(row,rows[i+1])">
              <span class="left-content" v-if="i !== (rows.length-1)" >速度(km/h):</span>
              <input class="left-content" v-if="i !== (rows.length-1)" type="text" v-model="row.speed" disabled="disabled">
            </p>
          </div>
          <blank-message :blankMsg="message" class="blank-message" v-if="!rows || rows.length <= 0"></blank-message>
        </div>
        <div class="btns">
          <button @click="preview">预览</button>
          <button class="sure" @click="makesure">确定</button>
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
      minTime: null
    }
  },

  watch: {
    '$store.state.stateStore.UpdatePathMsg': {
      handler: function (result) {
        this.isShow = result.showUpdatePath
        this.tableName = result.tableName
        if(result.data){
          if(result.tableName === 'virtual_path'){
            this.pathId = result.data.virtual_path_id
            this.valid = result.data.valid
            this.headMsg.title = '手工路径模板修改'
          }else{
            this.headMsg.title = '历史轨迹修改'
            this.startTime = new Date(result.data.start_time).format('yyyy-MM-dd hh:mm:ss')
            this.endTime = new Date(result.data.end_time).format('yyyy-MM-dd hh:mm:ss')
            this.objID = result.data.staff_id
          }
          this.queryDB()
        }
      },
      deep: true
    },
    '$store.state.socketStore.reptShowResult': {
      handler: function (result) {
        if(result.def.name === 'updatePath'){
          this.rows = clone(result.rows)
          let oldrows = clone(result.rows)
          if(this.rows.length > 0){
            if (this.tableName === 'rpt_att_staff') {
              let endTimeArr = oldrows.sort(function (a, b) {
                return new Date(b.begin_time).getTime()-new Date(a.begin_time).getTime();
              });
              this.maxTime = endTimeArr[0].end_time
              this.minTime = endTimeArr.pop().begin_time
            }
            let msg = this.processTrackDataTime(result.rows)
            this.$store.commit('olMapTrackLayer/drawWholeTrack',{msg: msg, PatrolPath: 'PatrolPath'})
          }
        }
      },
      deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        if(result.data.name === "updatePath"){
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
          this.$store.commit('stateStore/changeIsPreview', this.previewing)
          let oldRows = clone(this.rows)
          if(oldRows.length === result.modifyData.length){
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
                  item = {x:item[0],y: (item[1] * -1),begin_time: this.minTime}
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
    }
  },

  methods: {
    // 查询数据函数
    queryDB () {
      let that = this
      let sql = null
      if (this.tableName === 'virtual_path'){
        sql = `select id, begin_pt, last_time, speed from his_virtual_path where virtual_path_id = ${this.pathId}`
      } else{
        sql = `select begin_pt, round(timestampdiff(second,hl.begin_time,hl.last_time)/60,2) as last_time, date_format(last_time, "%Y-%m-%d %H:%i:%s") as end_time, round( speed * 7.2, 1) as speed, bt.staff_id, bt.card_id, date_format(begin_time, "%Y-%m-%d %H:%i:%s") as begin_time, hl.area_id, direction from his_location_staff_ hl,dat_staff_extend bt where hl.obj_id=bt.staff_id and bt.staff_id= ${this.objID} and begin_time >= "${this.startTime}" and begin_time <= "${this.endTime}" order by begin_time;`
      }
      let message = {
        cmd: 'query',
        data: {
          name: 'updatePath',
          sql: sql,
        }
      }
      console.log('查询轨迹sql',sql)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'REPT-FETCH-DATA',
        data: {
          cmd: 'REPT',
          data: message,
          def: {
            name: 'updatePath'
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
      this.$store.commit('stateStore/changeIsPreview', this.previewing)
    },

    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeUpdatePath', {
          showUpdatePath: false,
          tableName: null,
          data: null
      })
      this.rows = null
      if(this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
        this.$store.commit('olMapTrackLayer/hideTrack')
      }
    },

    // 计算速度函数
    computeSpeed (evt) {
      this.rows = this.rows.map((item,index) =>{
        item.speed = this.rows[index+1] && this.rows[index].last_time ? this.GetDistance(this.rows[index+1].x, this.rows[index+1].y, this.rows[index].x, this.rows[index].y) / this.rows[index].last_time * 60 : 0
        if (this.tableName === 'rpt_att_staff') {
          // 计算结束时间以及下个点的开始时间
          let beginTime = this.rows[index].begin_time
          let last_time = this.rows[index].last_time ? this.rows[index].last_time : 0
          item.end_time = new Date(new Date(beginTime).getTime() + last_time*60*1000).format('yyyy-MM-dd hh:mm:ss')
          if (this.rows[index+1]) {
            this.rows[index+1].begin_time = item.end_time
          }
        }
        item.speed = item.speed.toFixed(1)
        return item
      })
    },

    // 计算两点距离函数
    GetDistance (p2x, p2y, p1x, p1y) {
      let dx = Math.abs(p2x - p1x)
      let dy = Math.abs(p2y - p1y)
      return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2)) * 2 / 1000
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
    },

    // 确定函数
    makesure () {
      let checkRows = true
       let noticeServer = [1]
      let tipText = ''
      this.rows.some(item => {
        if (!item.speed && item.speed != 0 ) {
          checkRows = false
          tipText = '请填入速度'
          return true
          // else if (item.speed > 25) {
          //   checkRows = false
          //   tipText = '速度需小于25km/h'
          // }
        } else if (this.tableName === 'rpt_att_staff' && item.end_time > this.maxTime){
          checkRows = false
          tipText = '修改后时间超过考勤时间！'
        }
      })
      if (!checkRows) {
        window.xdata.commit('metaStore/saveHintip', {value: 'failure', tip: tipText})
        return
      }
      let sql = {}
      let req = null
      if (this.tableName === 'virtual_path') {
        this.updateValid()
        for (let i = 0; i < this.rows.length; i++) {
          sql[`${i}`] = `INSERT into his_virtual_path (virtual_path_id, begin_pt, last_time, speed) VALUES(${this.pathId},'${this.rows[i].x + ',' + this.rows[i].y}',${this.rows[i].last_time ? this.rows[i].last_time : 0},${this.rows[i].speed})`
        }
        req = composeUpdateDBReq('INSERT', 'updatePath', 0, sql)
        let hisSql = `DELETE FROM his_virtual_path WHERE virtual_path_id = ${this.pathId}`
        req.data['emptySql'] = hisSql
      } else {
        for (let i = 0; i < this.rows.length; i++) {
          sql[`${i}`] = `INSERT into his_virtual_location_staff (obj_id, begin_pt, begin_time, last_time, speed, old_begin_time, old_last_time, user_id) VALUES(${this.objID},'${this.rows[i].x + ',' + this.rows[i].y}',"${this.rows[i].begin_time}","${this.rows[i].end_time}",${this.rows[i].speed ? (this.rows[i].speed/7.2).toFixed(3) : 0}, "${this.minTime}", "${this.maxTime}", "${xdata.username}")`
        }
        req = composeUpdateDBReq('INSERT', 'updatePath', 0, sql)
      }

      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },

    // 更改有效性以及lastUpdate sql函数
    updateValid () {
      let nowTime = new Date().format('yyyy-MM-dd hh:mm:ss')
      let updatesql = `UPDATE dat_virtual_path SET valid = ${this.valid}, lastUpdate = "${nowTime}" WHERE virtual_path_id = ${this.pathId}`
      let updatereq = composeUpdateDBReq('UPDATE', 'virtual_path', this.pathId, updatesql)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: updatereq
      })
    },

    // 选中有效性函数
    choose(data){
      if(data[1] === 'valid'){
        this.valid = Number(data[0])
      }
    },
    drawHintLine (row,nextRow) {
      let rows = [
        {
          x: Number(row.x),
          y: Number(row.y)
        },
        {
          x: Number(nextRow.x),
          y: Number(nextRow.y)
        }
      ]
      let msg = this.processTrackDataTime(rows)
      this.$store.commit('olMapTrackLayer/drawHintLine',{msg: msg, PatrolPath: 'HintPath'})
    },
    hideHintLine (row) {
      this.$store.commit('olMapTrackLayer/hideHintTrack')
    }
  },

  updated () { 
    if(this.$store.state.stateStore.UpdatePathMsg.showUpdatePath){
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
.path-valid
  padding-left: 1rem
  padding-top: 1rem
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
  .left-content
    margin-top: 4rem
  .time-input
    width: 9rem
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
.botton-warp
  position: absolute
  left: 10px
  top: 10px
  z-index: 999
.drog-botton
  cursor: move
</style>
