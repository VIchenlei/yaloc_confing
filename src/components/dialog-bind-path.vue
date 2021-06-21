<template>
  <div>
    <div class="dlg-window" v-if="isShow">
      <div class="dlg-bg">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="edit-warp">
          <div>
            <p class="list">
              <span>
                <span>员工</span>
                <span class="enableNull">必填</span>
              </span>
              <fuzzy-search :opts="{typeDef: typeDef, dataSet: dataSet}" morechoose='true'></fuzzy-search>
            </p>
            <div class="choose-scorll">
              <div class="choose-result">
                <span v-for="row in chooseRows" :key="row.index">
                  <span>{{row.name}}</span>
                  <span @click="deleteChooseRows(row.staffId)">X</span>
                </span>
              </div>
            </div> 
            <div v-for="item in rows" :key="item.index" class="listWarp">
              <p v-for="row in item" :key="row.index" class="list">
                <span>
                  <span>{{row.field_label}}</span>
                  <span class="enableNull" v-if="!row.field_enableNull">必填</span>
                </span>
                <select-input :topicname="topicName" :name="row.field_name" :oldvalue="row.field_value" id="" @chooseItem="choose" v-if="row.field_type === 'SELECT'" :ref="row.field_name" :data-enableNull="row.field_enableNull"></select-input>
                <input type="datetime-local" step="01" v-if="row.field_type === 'DATETIME'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull">
                <span class="tip"></span>
              </p>
            </div>
            <p class="list">
              <span @click="addPath()" class="iconwarp hint--bottom-right" aria-label="添加">
                  <img class='pointImg' src="../assets/add.png" alt="">
              </span>
            </p>
          </div>
        </div>
        <div class="btns">
          <button class="sure" @click="makesure">确定</button>
          <button class="cancel" @click="close">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {getRows, trim, composeUpdateDBReq, getMessage, getShiftByTime} from '@/js/utils/utils.js'
import dialogHead from '@/components/dialog-head'
import {mapState} from 'vuex'
import selectInput from '@/components/select-input'
import {insert_def} from '@/js/def/dialog_edit_def.js'
import {metaUpdateRes, clone} from '@/js/utils/utils'
import fuzzySearch from '@/components/fuzzy-search'

export default {
  data () {
    return {
      rows: [],
      name: null,
      titles: null,
      fields: null,
      isShow: false,
      headMsg: {
        title: null,
        closer: true
      },
      tableName: null,
      topicName: null,
      cmd: null,
      tip: false,
      typeDef: null,
      dataSet: null,
      chooseRows:[]
    }
  },
  watch: {
    '$store.state.stateStore.dialogPathMsg': {
      handler: function (result) {
        if (result.showDialogPath) {
          this.name = this.$store.state.stateStore.dialogPathMsg.dialogName
          this.fields = insert_def[this.name] && insert_def[this.name].def.fields
          this.headMsg.title = insert_def[this.name] && insert_def[this.name].def.label
          this.tableName = insert_def[this.name] && insert_def[this.name].def.table
          this.topicName = insert_def[this.name] && insert_def[this.name].def.name
          let maxid = this.$store.state.metaStore.maxIDs[this.name]
          let row = this.$store.state.stateStore.dialogPathMsg.row
          let controlName = this.$store.state.stateStore.dialogPathMsg.controlName
          this.cmd = controlName
          let rows = getRows(row, insert_def[this.name].def, maxid)
          let msg = getMessage(controlName, rows, insert_def[this.name].def, maxid)
          this.rows = [msg.rows.map(item =>{
            if(item.field_type === 'DATETIME'){
              item.field_value = this.getDateTime(item.field_value)
            }else if(item.field_type !== 'SELECT' && item.field_type !== 'CHECKBOX' && item.field_type !== 'COLOR' && item.field_type !== 'DATETIME' && item.field_type !== 'DATETIMEDETAIL'){
              item.field_value = this.getValue(item.field_value, item.field_name)
            }
            return item
          })]
          this.getFuzzySearch()
        }
        this.isShow = result.showDialogPath
      },
      deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        let updateRes = metaUpdateRes(result, this.topicName, this.cmd)
        if (updateRes) this.close()
      },
      deep: true
    }
  },
  methods: {
    // 模糊查询结果接收函数
    getResult (result) {
      let row = result[0]
      let searchData = this.chooseRows.find(item => item.staffId == row.staff_id)
      if (searchData) {
        this.chooseRows.splice(this.chooseRows.indexOf(searchData), 1)
      } else {
        this.chooseRows.push({
          name: row.name,
          staffId: row.staff_id
        })
      }
    },
    // 模糊查询函数
    getFuzzySearch () {
      let name = this.name
      let datas = xdata.state.metaStore.staffs && Array.from(xdata.state.metaStore.staffs.values())
      this.typeDef = {
        name: 'staff',
        label: '人员',
        placeholder: '请输入员工编号、名称',
        cb: this.getResult 
      }
      this.dataSet = {
        desc: 'name',  
        keys: ['staff_id','name','spy'],
        data: datas,
        addpath:true
      }
    },

    // 获取value
    getValue (value, name) {
      if (this.cmd !== 'INSERT') return value
      if (name === 'event_id') return new Date().getTime()
      return value
    },

    // 关闭函数
    close () {
      this.chooseRows = []
      this.$store.commit('stateStore/changeBindPath',{type: false})
    },
    // 确定函数
    makesure () {
      switch (this.cmd) {
        case 'INSERT':
          this.doInsert()
          break
      }
    },

    // 检查input输入
    checkInput (evt, fieldName, fieldType) {
      let target = evt.target
      let value = target.value
      let tip = target.parentElement.querySelector('.tip')
      let isQualified = true
      if (fieldName === 'measure_grade') {
        isQualified = /^1|2{1}$/ig.test(value)
      } else if (fieldName === 'status' || fieldName === 'device_status' && this.tableName === 'dat_alarm_measure' || this.tableName === 'dat_device_status') {
        isQualified = /^0|1|2{1}$/ig.test(value)
      } else if (fieldName.includes('status') || fieldName.includes('type')) {
        isQualified = /^0|1|3{1}$/ig.test(value)
      } else if (this.tableName === 'his_event_data' && fieldName === 'stat'){
        isQualified = /^0|100{1}$/ig.test(value)
      } else if (fieldType === 'NUMBER') {
        isQualified = !isNaN(Number(value))
      }
      if (!isQualified) {
        tip.innerText = '请填写正确值'
        this.tip = true
      } else {
        tip.innerText = ''
        this.tip = false
      }
    },

    // 提示信息
    checkSpell (text) {
      let msg = {
        value: 'failure',
        tip: text
      }
      window.xdata.commit('metaStore/saveHintip', msg)
    },

    // 检查必填字段是否填写函数
    testUnenableNullData () {
      let msg = {
          value: 'failure',
          tip: '请把必填字段填写完整'
        }
      window.xdata.commit('metaStore/saveHintip', msg)
    },

    // 添加数据函数
    doInsert () {
      if (this.tip) return this.checkSpell('请检查值是否填写正确!')
      if (this.chooseRows.length < 1) return this.checkSpell('请选择员工！')
      let sql = {},keyValue = null,noticeServer = [1]
      let userName = xdata && xdata.username
      let fields = 'staff_id, shift_id, duty_date, is_virtual, virtual_path_id, begin_time, task_type, user_id'
      for (let i = 0; i < this.rows.length; i++) {
        let dutyDate = null,shiftId = null,beginTime = null
        let virtualPathId = this.$refs['virtual_path_id'][i] && this.$refs['virtual_path_id'][i].$el.value
        let time = this.$refs['begin_time'][i] && this.$refs['begin_time'][i].value
        if (virtualPathId && time) {
          virtualPathId = this.formatFieldValue('SELECT', virtualPathId)
          time = new Date(time).format('yyyy-MM-dd hh:mm:ss')
          let currentTime = new Date().format('yyyy-MM-dd hh:mm:ss')
          if(this.topicName === 'his_leader_arrange_1'){
            if(time < currentTime) return this.checkSpell('开始时间需要大于当前时间!')
          } else if(this.topicName === 'his_leader_arrange_2'){
            if(time > currentTime) return this.checkSpell('开始时间需要小于于当前时间!')
          }
          dutyDate = this.getDate(time)
          beginTime = new Date(time).format('hh:mm:ss')
          shiftId = getShiftByTime(beginTime)
        } else {
          return this.testUnenableNullData()
        }
        for (let j = 0; j < this.chooseRows.length; j++) {
          let chooseRow= this.chooseRows[j]
          let staffId = chooseRow.staffId
          // if (i === 0 && j === 0) {
          //   keyValue = staffId
          // }
          console.log(chooseRow)
          noticeServer.push(staffId)
          const taskType = this.topicName === 'his_leader_arrange_1' ? 1 : 2
          let values = `${staffId}, ${shiftId}, "${dutyDate}", 1, ${virtualPathId}, "${beginTime}", ${taskType}, "${userName}"`
          sql[`${i + '-' +j}`] = `INSERT into his_leader_arrange (${fields}) VALUES(${values})`
        }
      }

      let req = composeUpdateDBReq('INSERT', this.topicName, keyValue, sql)
      req.data['notice'] = noticeServer
      console.log(req)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },

    addPath() {
      let i = this.rows.length - 1
      let row = clone(this.rows)[i]
      this.rows.push(row)
    },

    deleteChooseRows(staffId) {
      this.chooseRows = this.chooseRows.filter(item => item.staffId != staffId)
    },
    // 格式化value函数
    formatFieldValue (type, value) {
      let ret = null
      switch (type) {
        case 'NUMBER':
        case 'SELECT':
          ret = +value // Number
          break
        case 'DATETIME':
          ret = value
          break
        default:
          value = value && trim(value)
          ret = `"${value}"` // String
          break
      }

      return ret
    },

    // 格式化时间函数
    getTime (value) {
      return new Date('2018-12-12 '+ value).format('hh:mm')
    },

    // 格式化日期函数
    getDate (value) {
      return new Date(value).format('yyyy-MM-dd')
    },

    // 格式化日期时间函数
    getDateTime (value) {
      value = value ? new Date(value).format('yyyy-MM-ddThh:mm:ss') : null
      return value
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
    // select选择函数
    choose(data){
      
    }
  },
  updated () { 
    if(this.$store.state.stateStore.dialogPathMsg.showDialogPath){
       this.draggable()
    }
  },
  components: {
    dialogHead,
    selectInput,
    fuzzySearch
  }
}
</script>
<style lang="sass" scoped>
  @import '../style/defs.sass'
  .edit-warp
    max-height: 40rem
    overflow-y: scroll
    overflow-y: auto
    overflow-x: hidden
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
    @include wh(90%, 4rem)
    padding: 0 2rem
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
  .enableNull
    color: red
    font-size: 12px
  .iconwarp
    width: 2rem
  .pointImg
    width: 1.25rem
    height: 1.25rem
  .listWarp 
    p:nth-child(1)
      padding: 0 1rem
  .choose-scorll
    display: flex
    justify-content: flex-end
    padding: 0 1rem
    .choose-result
      max-width: 13rem
      overflow-x: auto
      overflow-y: hidden
      display: flex
      flex-wrap: nowrap
      font-size: 13px
      span
        width: auto
        background: #0099ff
        color: #ffffff
        margin: 2px
        flex: 0 0 auto
        white-space: nowrap
        span
          cursor: pointer


</style>
