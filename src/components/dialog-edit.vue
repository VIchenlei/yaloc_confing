<template>
  <div>
    <div class="dlg-window" v-if="isShow" v-show="!previewing">
      <div class="dlg-bg">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="edit-warp">
          <div>
            <p v-for="row in rows" :key="row.index" class="list" v-show="name !== 'virtual_path_his' || row.field_name !== 'type'">
              <span>
                <span>{{row.field_label}}</span>
                <span class="enableNull" v-if="!row.field_enableNull">必填</span>
              </span>
              <select-input :topicname="topicName" :name="row.field_name" :oldvalue="row.field_value" id="" @chooseItem="choose" v-if="row.field_type === 'SELECT' && (row.field_name == 'staff_id' || row.field_name == 'obj_id') && cmd == 'DELETE' && tableName !== 'rpt_att_staff_all'" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)"></select-input>
              <select-input :topicname="topicName" :name="row.field_name" :oldvalue="row.field_value" id="" @chooseItem="choose" v-if="row.field_type === 'SELECT' && row.field_name !== 'staff_id' && row.field_name !== 'obj_id'" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)"></select-input>
              <!-- <fuzzy-search v-if="(row.field_name === 'staff_id' || row.field_name === 'obj_id') && (/his_leader_arrange/.test(name) || name==='virtual_path_his') && cmd !== 'DELETE'" :oldvalue="row.field_value" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)" :opts="{typeDef: typeDef, dataSet: dataSet}"></fuzzy-search> -->
              <fuzzy-search v-if="(row.field_name === 'staff_id' || row.field_name === 'obj_id') && (/his_leader_arrange/.test(name) || name==='virtual_path_his' || name === 'virtual_path' || name === 'staff_extend' || name === 'alarm_mange') && cmd !== 'DELETE'" :oldvalue="row.field_value" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)" :opts="{typeDef: typeDef, dataSet: dataSet}"></fuzzy-search>
              <fuzzy-search v-if="row.field_name === 'staff_id' && tableName === 'rpt_att_staff_all' && cmd === 'DELETE'" :oldvalue="row.field_value" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)" :opts="{typeDef: typeDef, dataSet: dataSet}"></fuzzy-search>
              <input type="text" v-if="row.field_type !== 'SELECT' && row.field_type !== 'CHECKBOX' && row.field_type !== 'COLOR' && row.field_type !== 'DATETIME' && row.field_type !== 'TIME' && row.field_type !== 'DATE'" v-model="row.field_value" :ref="row.field_name" min="1" :data-enableNull="row.field_enableNull" @blur="checkInput($event, row.field_name, row.field_type)" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <input type="checkbox" v-if="row.field_type === 'CHECKBOX'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <input type="color" v-if="row.field_type === 'COLOR'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <input type="date" v-if="row.field_type === 'DATE'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <input type="time" v-if="row.field_type === 'TIME'" @blur="chooseShift" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <input type="datetime-local" v-if="row.field_type === 'DATETIME'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <span class="tip"></span>
            </p>    
            <p v-if="isDelete && tableName !== 'rpt_att_staff_all'" class="tips">注意：数据删除后将无法恢复！您确认要删除本记录？</p>
            <p v-if="isDelete  && tableName === 'rpt_att_staff_all'" class="tips">注意：数据删除后将无法恢复！您确认要删除这些数据？</p>
          </div>
        </div>
        <div class="btns">
          <!-- <button v-if="name === 'virtual_path_his' || name === 'virtual_path'" class="preview" @click="preview">预览</button> -->
          <button v-if="name === 'virtual_path' && cmd === 'UPDATE'" class="preview" @click="preview">预览</button>
          <button class="sure" @click="makesure">确定</button>
          <button v-if="name !== 'virtual_path_his'" class="cancel" @click="close">取消</button>
        </div>
      </div>
    </div>
    <div class="botton-warp" v-show="previewing">
      <button class="preview-botton" @click="changePreviewing">返回</button>
    </div>
  </div>
</template>
<script>
import {getRows, trim, composeUpdateDBReq, getMessage, getShiftByTime, dataNumberChange, editDetail} from '@/js/utils/utils.js'
import { getCardBindObjectInfo , getNameByID } from '@/js/utils/metaStoreDep.js'
import dialogHead from '@/components/dialog-head'
import {mapState} from 'vuex'
import selectInput from '@/components/select-input'
import {edit_def} from '@/js/def/dialog_edit_def.js'
import {metaUpdateRes, turnId, clone} from '@/js/utils/utils'
import fuzzySearch from '@/components/fuzzy-search'
import FUZZYSEARCHALARM from '@/js/def/fuzzy_search_alarm.js'

export default {
  data () {
    return {
      rows: {},
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
      tableKeyName: null,
      isDelete: false,
      tip: false,
      previewing: false,
      antoKey : null,
      typeDef: null,
      dataSet: null,
      hasPath: false,
      pathBindStaff: false,
      alarmId:null,
      oldRows:null
    }
  },
  watch: {
    '$store.state.stateStore.dialogEditMsg': {
      handler: function (result) {
        if (result.showDialogEdit) {
          this.name = this.$store.state.stateStore.dialogEditMsg.dialogName
          this.fields = edit_def[this.name] && edit_def[this.name].def.fields
          this.headMsg.title = edit_def[this.name] && edit_def[this.name].def.label
          this.tableName = edit_def[this.name] && edit_def[this.name].def.table
          this.topicName = edit_def[this.name] && edit_def[this.name].def.name
          let maxid = this.$store.state.metaStore.maxIDs[this.name]
          if(this.name === 'virtual_path_his'){
            maxid = this.$store.state.metaStore.maxIDs.virtual_path
          }
          let row = this.$store.state.stateStore.dialogEditMsg.row
          let controlName = this.$store.state.stateStore.dialogEditMsg.controlName
          this.cmd = controlName
          if (controlName === 'DELETE') {
            this.isDelete = true
            if(this.tableName === 'his_location_staff_' && row){
              this.antoKey = row.id
            }
          } else {
            this.isDelete = false
          }
          if ((controlName === 'UPDATE' || controlName === 'DELETE') && this.topicName === 'alarm_mange'){
            this.alarmId = row.id
          }
          if (controlName === 'DELETE' && this.topicName === 'virtual_path' && row.virtual_path_id) {
            this.queryPathBindStaff(row.virtual_path_id)
          }
          let rows = getRows(row, edit_def[this.name].def, maxid)
          let msg = getMessage(controlName, rows, edit_def[this.name].def, maxid)
          this.rows = msg.rows.map(item =>{
            if(item.field_type === 'TIME'){
              item.field_value = this.getTime(item.field_value)
            }else if(item.field_type === 'DATE'){
              item.field_value = this.getDate(item.field_value)
            }else if(item.field_type === 'DATETIME'){
              item.field_value = this.getDateTime(item.field_value)
            }else if(item.field_type !== 'SELECT' && item.field_type !== 'CHECKBOX' && item.field_type !== 'COLOR' && item.field_type !== 'DATETIME' && item.field_type !== 'DATETIMEDETAIL'){
              item.field_value = this.getValue(item.field_value, item.field_name)
            }
            if (item.field_name === 'start_time' && this.tableName === 'rpt_att_staff_all') {
              item.field_value = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).format('yyyy-MM-ddThh:mm:ss')
            } else if (item.field_name === 'end_time' && this.tableName === 'rpt_att_staff_all') {
              item.field_value = new Date().format('yyyy-MM-ddThh:mm:ss')
            }
            return item
          })
          this.oldRows = clone(this.rows)
          this.tableKeyName = msg.key
          this.getFuzzySearch()
        }
        this.isShow = result.showDialogEdit
      },
      deep: true
    },
    '$store.state.socketStore.reptShowResult': {
        handler: function (result) {
            if(result.def.name.data && result.def.name.data.name === 'TrackData'){
              if(result.rows && result.rows.length > 0){
                this.previewing = true
                this.$store.commit('stateStore/changeIsPreview', this.previewing)
                let msg = this.processTrackDataTime(result.rows)
                this.$store.commit('olMapTrackLayer/drawWholeTrack',{msg: msg, PatrolPath: 'PatrolPath'})
                this.hasPath = true
              }else{
                window.xdata.commit('metaStore/saveHintip', { value: 'failure', tip: '该人员路径不存在！' })
                this.hasPath = false
              } 
            }else if(result.def.name === 'PathBindStaff' && result.rows){
              this.pathBindStaff = result.rows.length > 0 ? true : false
            }
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
      let desc=this.dataSet.desc
      if(desc!=='name'){     
        this.$el.querySelector('#searchinput').value = result[desc].name
      }else{
        this.$el.querySelector('#searchinput').value = result[0][desc].name     
      }
    },
    // 模糊查询函数
    getFuzzySearch () {
      let name = this.name
      if (name === 'alarm_mange') {
        let datas = null
        let eventType = this.rows[2].field_value ? this.rows[2].field_value : 1
        this.getFuzzyDef(eventType)
      } else {
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
      }
      this.fuzzysearch = {typeDef: this.typeDef, dataSet: this.dataSet}
    },

    // 获取value
    getValue (value, name) {
      if (this.cmd !== 'INSERT') return value
      if (name === 'event_id') return new Date().getTime()
      return value
    },

    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeDialogEdit',{type: false})
      if(this.name === 'virtual_path_his' && this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
        this.$store.commit('olMapTrackLayer/hideTrack')
      }
      
    },
    // 确定函数
    makesure () {
      switch (this.cmd) {
        case 'INSERT':
          this.doInsert()
          break
        case 'UPDATE':
          this.doUpdate()
          break
        case 'DELETE':
          this.doDelete()
          break
      }
    },

    // 预览函数
    preview () {
      let startTime = new Date(this.$refs["start_time"][0].value).format('yyyy-MM-dd hh:mm:ss')
      let endTime = new Date(this.$refs["end_time"][0].value).format('yyyy-MM-dd hh:mm:ss')
      let objID = null
      if(this.name === 'virtual_path_his'){
        let fuzzysearch = this.$refs["obj_id"][0].$el
        objID = fuzzysearch.querySelector('#searchinput').value
        if (objID) objID = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
      }else if(this.name === 'virtual_path'){
        // objID = this.$refs["obj_id"][0].$el.value
        let fuzzysearch = this.$refs["obj_id"][0].$el
        objID = fuzzysearch.querySelector('#searchinput').value
        if (objID) objID = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
        this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: 'historyEdit'})
      }
      let sql = `select bt.staff_id, bt.card_id, begin_time, last_time, speed, begin_pt, hl.area_id, direction from his_location_staff_ hl,dat_staff_extend bt where hl.obj_id=bt.staff_id and bt.staff_id= ${objID} and begin_time >= "${startTime}" and begin_time <= "${endTime}" order by begin_time;`
      let message = {
        cmd: 'query',
        data: {
          name: 'TrackData',
          pageSize: 5000,  // 最近5000条
          pageIndex: 0,
          sql: sql
        }
      }
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'REPT-FETCH-DATA',  
        data:{
            data: message,
            cmd: 'REPT',
            def: {
              name: message
            },
        }
      })
    },

    // 根据virtual_path_id获取staff_id
    queryPathBindStaff (virtualPathId) {
      let sql = `select staff_id as total from his_leader_arrange where virtual_path_id = ${virtualPathId}`
      let message = {
        cmd: 'query',
        data: {
          name: 'PathBindStaff',
          pageSize: 100,
          pageIndex: 0,
          sql: sql
        }
      }
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'REPT-FETCH-DATA',  
        data:{
            data: message,
            cmd: 'REPT',
            def: {
              name:'PathBindStaff'
            },
        }
      })
    },

    // 修改预览状态
    changePreviewing (evt) {
      this.previewing = false
      if(this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
        this.$store.commit('olMapTrackLayer/hideTrack')
      }
      this.$store.commit('stateStore/changeIsPreview', this.previewing)
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

      if(/^dat_/ig.test(this.tableName) && fieldName === 'name'){
        value = trim(value)
        let tablename = this.tableName.slice(4)
        let table = xdata.state.metaStore.data[tablename]
        let isHas = table && Array.from(table.values()).some(item => item.name === value)
        if (isHas) {
          tip.innerText = '该名称已被注册'
          this.tip = true
        } else {
          tip.innerText = ''
          this.tip = false
        }
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
      if (!this.hasPath && this.topicName === 'virtual_path') return this.checkSpell('请预览路径是否存在!')
      let keyValue = null,readerSql = null,driverSql = null,fields = '',values = '',noticeServer = [1],pathID =null, beginTime = '', endTime = '', angle = 0, alarmObj = {}
      for (let i = 0; i < this.rows.length; i++) {
        let fieldName = this.rows[i].field_name
        let fieldType = this.rows[i].field_type
        let fieldEnableNull = this.rows[i].field_enableNull
        let ele = this.$refs[fieldName][0]
        let fieldValue = ele && ele.value
        if (fieldType === 'SELECT') {
          ele = ele.$el
          fieldValue = ele.value
        }
        if ((fieldName === 'staff_id' || fieldName === 'obj_id') && (/his_leader_arrange/.test(this.name) || this.name==='virtual_path_his' || this.name === 'virtual_path' || this.name === 'staff_extend' || this.name === 'alarm_mange')) {
           let fuzzysearch = this.$refs[fieldName][0].$el
           let value = fuzzysearch.querySelector('#searchinput').value
           if (value) fieldValue = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
        }
        if(!fieldValue && !fieldEnableNull) return this.testUnenableNullData()
        if(fieldValue){
          fieldValue = this.formatFieldValue(fieldType, fieldValue)
          if(this.tableName === 'his_location_staff_' && fieldName === 'virtual_path_id'){
            pathID = fieldValue
            continue;
          }else if(this.tableName === 'his_location_staff_' && fieldName === 'begin_time'){
            beginTime = trim(fieldValue.replace(/"/g, " "))
            continue;
          }else if(fieldName === 'staff_id' && /his_leader_arrange/.test(this.name)){
            let staffExtend = xdata.state.metaStore.staffs.get(fieldValue)
            if (!staffExtend.card_id) return this.checkSpell('该人员没有绑卡！')
          }
          noticeServer.push(fieldValue)
          if (i === 0) {
            keyValue = fieldValue
          }
          if(this.tableName === 'his_leader_arrange' && fieldName === 'begin_time'){
            let currentTime = '"'+ new Date().format('yyyy-MM-dd hh:mm')+ '"'
            let fieldValueTime = `"${this.rows[2].field_value} ${trim(fieldValue.replace(/"/g, " "))}"` 
            if(this.topicName === 'his_leader_arrange_1'){
              if(fieldValueTime < currentTime) return this.checkSpell('开始时间需要大于当前时间!')
            } else if(this.topicName === 'his_leader_arrange_2'){
              if(fieldValueTime > currentTime) return this.checkSpell('开始时间需要小于于当前时间!')
            }
          }
          fields += ','
          values += ','
          fields += fieldName
          values += fieldValue
          alarmObj[fieldName] = fieldValue
        }
      }
      if (this.tableName === 'his_leader_arrange') {
        let userName = xdata && xdata.username
        fields += ', user_id, is_virtual'
        values += `, '${userName}', 1`
      } else if(this.tableName === 'his_event_data') {
        let id = turnId(alarmObj.dis_type,alarmObj.event_type_id,alarmObj.obj_type_id,alarmObj.obj_id)
        fields += ', id, source'
        values += `, ${id.toString()}, 1`
      }
      fields = fields.replace(',', '')
      values = values.replace(',', '')
      let sql = `INSERT into ${this.tableName} (${fields}) VALUES(${values})`
      let req = composeUpdateDBReq('INSERT', this.topicName, keyValue, sql)
      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },

    // 更细你数据函数
    doUpdate () {
      if (this.tip) return this.checkSpell('请检查值是否填写正确!')
      if (this.tableName === 'number_bars') {        
        let dataNumberStore = JSON.parse(window.localStorage.getItem('dataNumber'))
        let optName = 'dataNumber'
        let optNameNumber = this.$refs[optName][0].value
        if (Number(optNameNumber) <= 0 ) {
          let msg = {
            value: 'failure',
            tip: '数据条目需大于0，请确认后再提交！'
          }
          window.xdata.commit('metaStore/saveHintip', msg)
          return
        }
        dataNumberStore[0][optName] = Number(optNameNumber)
        window.localStorage.setItem('dataNumber', JSON.stringify(dataNumberStore))
        dataNumberChange('update')
        this.$store.commit('stateStore/changeIsDataNumber')
        this.close()
        return
      }
      let sql = '', readerSql = null, driverSql = null, noticeServer = [3],whereSql = '',signObj = {},fields = '',values = '',alarmObj = {}, detail = '', textValue = null
      let keyele = this.$refs[this.tableKeyName][0]
      let keyValue = keyele && keyele.value
      if (!keyValue) {
        keyValue = keyele && keyele.oldvalue
      }
      for (let i = 0; i < this.rows.length; i++) {
        let fieldName = this.rows[i].field_name
        let fieldEnableNull = this.rows[i].field_enableNull
        let fieldType = this.rows[i].field_type
        let oldFieldValue = this.oldRows[i].field_value  // 用于判断字段是否修改
        oldFieldValue = fieldType === 'STRING' ? `"${oldFieldValue}"` : oldFieldValue
        let inputValue = null
        let ele = this.$refs[fieldName][0]
        let value = ele && ele.value
        if (fieldType === 'SELECT') {
          ele = ele.$el
          value = ele.value
        }
        if ((fieldName === 'staff_id' || fieldName === 'obj_id') && (/his_leader_arrange/.test(this.name) || this.name==='virtual_path_his' || this.name === 'virtual_path' || this.name === 'staff_extend' || this.name === 'alarm_mange')) {
           let fuzzysearch = this.$refs[fieldName][0].$el
           let fuzzyvalue = fuzzysearch.querySelector('#searchinput').value
           if (fuzzyvalue) value = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
        }
        if(!value && !fieldEnableNull) return this.testUnenableNullData()
        if(value){
          if (this.tableName === 'his_event_data' && value != this.oldRows[i].field_value && fieldName !== 'cur_time') {
            if (fieldName === 'obj_id') {
              if (Number(value) != Number(this.oldRows[i].field_value)) {
                signObj[fieldName] = value
              }
            } else {
              if (value != this.oldRows[i].field_value) {
                signObj[fieldName] = value
              }
            }
          }
          inputValue = this.formatFieldValue(this.rows[i].field_type, value)
          textValue = inputValue
          if(this.tableName === 'his_leader_arrange' && fieldName === 'begin_time'){
            let currentTime = '"'+ new Date().format('yyyy-MM-dd hh:mm')+ '"'
            let fieldValueTime = `"${this.rows[2].field_value} ${trim(inputValue.replace(/"/g, " "))}"` 
            if(this.topicName === 'his_leader_arrange_1'){
              if(fieldValueTime < currentTime) return this.checkSpell('开始时间需要大于当前时间!')
            } else if(this.topicName === 'his_leader_arrange_2'){
              if(fieldValueTime > currentTime) return this.checkSpell('开始时间需要小于于当前时间!')
            }
          }
          noticeServer.push(inputValue)
          if (oldFieldValue != inputValue) {
            if (!/his_leader_arrange/.test(this.tableName)) {
              detail = editDetail(fieldName, textValue, detail, this.name)
            }
            sql += `,${fieldName}=${inputValue}`
            if(this.tableName === 'his_event_data'){
              if(fieldName !== 'stat') {
                fields += ','
                values += ','
                fields += fieldName
                values += inputValue
              }
              alarmObj[fieldName] = inputValue
            }
          }
        }
      }

      if (!sql) {
        let msg = {
          value: 'failure',
          tip: '数据没有修改，请确认后再提交！'
        }
        window.xdata.commit('metaStore/saveHintip', msg)
        return
      } else {
        if (this.tableName === 'dat_user' || this.tableName === 'dat_user_tool') {
          keyValue = '"' + keyValue + '"'
        }
        let oldsql = sql
        sql = sql.replace(',', '')
        if(this.tableName === 'dat_staff_extend'){
          sql += `, user_id = '${xdata.username}'`
        }
        if(this.tableName === 'his_leader_arrange'){
          sql = `UPDATE ${this.tableName} set ${sql}, state=0 where ${this.tableKeyName}=${this.rows[0].field_value} and ${this.rows[3].field_name} = ${this.rows[3].field_value}`
        }else if(this.tableName === 'his_event_data'){
          sql = this.dealAlarmSql(oldsql,keyValue,signObj,fields,values,alarmObj)
        }else{
          sql = `UPDATE ${this.tableName} SET ${sql} WHERE ${this.tableKeyName} = ${keyValue}`
        }
        if (['dat_user', 'dat_staff_extend', 'dat_vehicle_extend'].includes(this.tableName)) {
          const keyIndex = this.fields.names.findIndex((item, i) => {
            return item === this.tableKeyName
          })
          const keyLabel = this.fields.labels[keyIndex]
          detail = `${keyLabel}:${keyValue};${detail}`
          keyValue = detail
        }
        let req = composeUpdateDBReq('UPDATE', this.topicName, keyValue, sql)
        req.data['notice'] = noticeServer
        console.log(req)
        this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
          cmd: 'META-UPDATE-DB',
          data: req
        })
      }
    },

    // 删除数据函数
    doDelete () {
      if (this.pathBindStaff && this.topicName === 'virtual_path') return this.checkSpell('该路径已绑定！')
      let detail = ''
      let keyele = this.$refs[this.tableKeyName][0]
      let keyValue = keyele && keyele.value
      if (!keyValue) {
        keyValue = keyele && keyele.oldvalue
      }
      let noticeServer = [2]
      if (this.tableName === 'dat_user' || this.tableName === 'dat_user_tool') {
          keyValue = '"' + keyValue + '"'
        }
      noticeServer.push(keyValue)
      let sql = null
      if (this.tableName === 'his_location_staff_') {
        sql = `DELETE FROM ${this.tableName} WHERE id = ${this.antoKey} AND ${this.tableKeyName} = ${keyValue}`
      } else if (this.tableName === 'rpt_att_staff'){
        let start_time = new Date(this.rows[3].field_value).format('yyyy-MM-dd hh:mm:ss')
        let end_time = new Date(this.rows[4].field_value).format('yyyy-MM-dd hh:mm:ss')
        let readerTime = new Date(new Date(start_time).getTime()- 0.5 * 60 * 60 * 1000).format('yyyy-MM-dd hh:mm:ss')
        sql = {
          'd1': `DELETE FROM rpt_att_staff WHERE staff_id = ${this.rows[0].field_value} AND card_id = ${this.rows[2].field_value} AND start_time >= "${start_time}" and end_time <= "${end_time}";`,
          'd2': `DELETE FROM his_location WHERE obj_id = ${this.rows[0].field_value} AND begin_time >= "${start_time}" AND last_time <= "${end_time}";`,
          'd3': `DELETE FROM his_location_area WHERE obj_id = ${this.rows[0].field_value} AND enter_time >= "${start_time}" AND leave_time <= "${end_time}";`,
          'd4': `DELETE FROM his_location_reader WHERE obj_id = ${this.rows[0].field_value} AND enter_time >= "${readerTime}" AND leave_time <= "${end_time}";`,
          'd5': `DELETE FROM his_event_data WHERE obj_id = ${this.rows[2].field_value} AND cur_time >= "${start_time}" AND cur_time <= "${end_time}";`
        }
        detail += `${detail}${sql['d1']}` 
      } else if (this.tableName === 'rpt_att_staff_all'){
        let start_time = new Date(this.rows[1].field_value).format('yyyy-MM-dd hh:mm:ss')
        let end_time = new Date(this.rows[2].field_value).format('yyyy-MM-dd hh:mm:ss')
        let objId = null
        let fuzzysearch = this.$refs['staff_id'][0].$el
        let fuzzyvalue = fuzzysearch.querySelector('#searchinput').value
        if (fuzzyvalue) objId = Number(fuzzysearch.querySelector('#searchinput').getAttribute('data-type'))
        let staffObj = xdata.state.metaStore.staffs && xdata.state.metaStore.staffs.get(objId)
        let cardId = staffObj && staffObj.card_id
        sql = {
          'd1': `DELETE FROM rpt_att_staff WHERE staff_id = ${objId} AND card_id = ${cardId} AND start_time >= "${start_time}" and start_time <= "${end_time}";`,
          'd2': `DELETE FROM his_location WHERE obj_id = ${objId} AND begin_time >= "${start_time}" AND begin_time <= "${end_time}";`,
          'd3': `DELETE FROM his_location_area WHERE obj_id = ${objId} AND enter_time >= "${start_time}" AND enter_time <= "${end_time}";`,
          'd4': `DELETE FROM his_location_reader WHERE obj_id = ${objId} AND enter_time >= "${start_time}" AND enter_time <= "${end_time}";`,
          'd5': `DELETE FROM his_event_data WHERE obj_id = ${cardId} AND cur_time >= "${start_time}" AND cur_time <= "${end_time}";`
        }
        if (!objId || !this.rows[1].field_value || !this.rows[2].field_value) return this.checkSpell('请完善删除条件')
        detail += `${detail}${sql['d1']}`
      } else if (this.tableName === 'his_event_data') {
        sql = `DELETE FROM ${this.tableName} WHERE id = ${this.alarmId.split('+')[1]} AND ${this.rows[2].field_name} = ${this.rows[2].field_value} AND ${this.rows[3].field_name} = ${this.rows[3].field_value} AND ${this.rows[8].field_name} = ${this.rows[8].field_value} AND date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${this.rows[12].field_value}"`
      } else if (this.tableName === 'his_leader_arrange'){
        sql = `DELETE FROM ${this.tableName} WHERE ${this.tableKeyName} = ${keyValue} AND ${this.rows[1].field_name} = ${this.rows[1].field_value} AND ${this.rows[2].field_name} = "${this.rows[2].field_value}"`
      } else {
        sql = `DELETE FROM ${this.tableName} WHERE ${this.tableKeyName} = ${keyValue}`
      }
      if (this.tableName === 'his_event_data') {
        let eventTypeID = this.$refs['event_type_id'][0].oldvalue
        noticeServer = eventTypeID
      }
      if(this.tableName === 'dat_virtual_path') {
        let hisSql = `DELETE FROM his_virtual_path WHERE virtual_path_id = ${keyValue}`
        let hisReq = composeUpdateDBReq('DELETE', 'his_virtual_path', keyValue, hisSql)
        this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
          cmd: 'META-UPDATE-DB',
          data: hisReq
        })
      }
      let req = composeUpdateDBReq('DELETE', this.topicName, keyValue, sql)
      if (detail) req.data['detail'] = detail
      req.data['notice'] = noticeServer
      console.log(req)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },

    // 获取删除详细内容 用于记录入库
    getDeleteDetail () {
      let detail = ''
      for (let i = 0; i < this.rows.length; i++) {
        const { field_name, field_value } = this.rows[i]
        detail = editDetail(field_name, field_value, detail, this.name)
      }
      return detail
    },

    // 格式化value函数
    formatFieldValue (type, value) {
      let ret = null
      switch (type) {
        case 'NUMBER':
        case 'SELECT':
          ret = +value // Number
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

    // 是否可编辑函数
    isReadonly (field_name,field_enableEdit) {
      let readonly = true
      if (this.tableName !== 'dat_user' && this.tableName !== 'dat_user_tool' && field_name === 'user_id') return true
      if (this.tableName === 'rpt_att_staff_all') return false
      if (this.cmd === 'INSERT' && field_name === 'stat') return true
      if(this.cmd === 'DELETE'){
        readonly = true
      }else if(this.cmd === 'UPDATE'){
        if (field_name === 'event_id') return true
        field_enableEdit = field_enableEdit ? field_enableEdit : false
        readonly = field_name === this.tableKeyName ? true : !field_enableEdit
      }else{
        readonly = false
      }
      return readonly
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

    //  处理画线数据函数
    processTrackDataTime (ds) {
      if (ds && ds[0]) {
        let smapID = ds[0]['map_id']
        let mapID = smapID ? parseInt(smapID, 10) : -1
        if (mapID > 0) {
          let cardID = ds[0]['card_id']
          let count = ds.length
          let startTime = ds[0]['cur_time']
          let endTime = ds[count - 1]['cur_time']
          let msg = {
            cardID: cardID,
            mapID: mapID,
            rows: ds,
            startTime: new Date(startTime).getTime(),  // ms
            endTime: new Date(endTime).getTime()  // ms
          }
          return msg
        }
      }
    },

    // select选择函数
    choose(data){
      if(data[1] === 'shift_id' && this.tableName === 'his_leader_arrange'){
        let shiftId = Number(data[0])
        let shiftStartTime = xdata.state.metaStore.data.shift.get(shiftId).start_time
        this.rows[4].field_value = shiftStartTime
      } else if (data[1] === 'obj_type_id' && this.tableName === 'his_event_data') {
        this.getFuzzyDef(Number(data[0]))
        this.$refs['obj_id'] && this.$refs['obj_id'][0].updateData({typeDef: this.typeDef, dataSet: this.dataSet})
      }
    },

    // 获取特殊的模糊查询配置
    getFuzzyDef(ID){
      let datas = null
      let eventTypeObj = xdata.state.metaStore.data.obj_type && xdata.state.metaStore.data.obj_type.get(ID)
      let fieldName = eventTypeObj.description
      if (fieldName.includes('&')) {
        let fieldNameObj = fieldName.split('&')
        datas = []
        for(let i = 0; i < fieldNameObj.length; i++) {
          let data = xdata.state.metaStore[fieldNameObj[i]] && Array.from(xdata.state.metaStore[fieldNameObj[i]].values())
          datas = datas.concat(data)
        }
        fieldName = 'staffs'
      } else {
        datas = xdata.state.metaStore.data[fieldName] && Array.from(xdata.state.metaStore.data[fieldName].values())
      }
      let fuzzyDef = FUZZYSEARCHALARM[fieldName]
      this.typeDef = {
        name: fuzzyDef.name,
        label: '告警主体',
        placeholder: '请输入名称、字母、编号',
        cb: this.getResult 
      }
      this.dataSet = {
        desc: fuzzyDef.desc,  
        keys: fuzzyDef.keys,
        data: datas,
      }
      
    },

    // input失去焦点选择的班次
    chooseShift(evt){
      let target = evt.target
      let timeValue = target.value
      if (this.tableName === 'his_leader_arrange') {
        this.rows[1].field_value = getShiftByTime(timeValue)
      }
    },

    dealAlarmSql (oldSql, keyValue,signObj,fields,values,alarmObj) {
      let alarmSql = null,undateSql='',insertSql=''
      undateSql = oldSql.replace(',', '')
      let insertArr = oldSql.replace(',', '').split(',')
      fields += ', deal, source'
      values += `, 0, 1`
      fields = fields.replace(',', '')
      values = values.replace(',', '')
      insertSql = `INSERT into ${this.tableName} (${fields}) VALUES(${values})`
      if(signObj.stat){
        if(signObj.stat == '100'){
          // stat由0变为100
          if(Object.keys(signObj).length > 1){
            // 其它字段有修改，先更新stat为0的这一条，然后在insert一条100的，这两条构成一个sql
            let noStatSql = undateSql.replace('stat=100', 'stat=0')
            alarmSql = {
              '1u': `UPDATE ${this.tableName} set ${noStatSql} where ${this.tableKeyName}=${keyValue} and id = ${this.alarmId.split('+')[1]}`,
              '2i': `INSERT into ${this.tableName} (${fields},stat, id) VALUES(${values},100, ${this.alarmId.split('+')[1]})`
            }
          }else{
            // 其它字段没有修改，只insert一条state为100
            alarmSql = `INSERT into ${this.tableName} (${fields},stat, id) VALUES(${values},100, ${this.alarmId.split('+')[1]})`
          }
        }else{
          // stat由100变为0，insert一条0的sql
          let id = turnId(alarmObj.dis_type,alarmObj.event_type_id,alarmObj.obj_type_id,alarmObj.obj_id)
          alarmSql = `INSERT into ${this.tableName} (${fields},stat, id) VALUES(${values},0,${id.toString()})`
        }
      }else{
        alarmSql = `UPDATE ${this.tableName} set ${undateSql} where ${this.tableKeyName}=${keyValue} and id = ${this.alarmId.split('+')[1]} and stat = ${alarmObj.stat}`
      }
      return alarmSql
    }
  },
  updated () { 
    if(this.$store.state.stateStore.dialogEditMsg.showDialogEdit){
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
.enableNull
  color: red
  font-size: 12px
.botton-warp
  position: absolute
  left: 3rem
  top: 3rem
  z-index: 999
  border: 1px solid #e3e3e3
  background: #f5f5f5
.drog-botton
  cursor: move
</style>
