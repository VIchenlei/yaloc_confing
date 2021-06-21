<template>
  <div>
    <div class="dlg-window" v-if="isShow">
      <div class="dlg-bg">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="edit-warp">
          <div>
            <p v-for="row in rows" :key="row.index" class="list" v-show="chooseShow(row)">
              <span>
                <span>{{row.field_label}}</span>
                <span class="enableNull" v-if="!row.field_enableNull">必填</span>
              </span>
              <select-input :topicname="name" :name="row.field_name" :oldvalue="row.field_value" id="" @chooseItem="choose" v-if="row.field_type === 'SELECT' && (row.field_name == 'staff_id' || row.field_name == 'obj_id') && cmd == 'DELETE'" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)"></select-input>
              <select-input :topicname="name" :name="row.field_name" :oldvalue="row.field_value" id="" @chooseItem="choose" v-if="row.field_type === 'SELECT' && row.field_name !== 'staff_id' && row.field_name !== 'obj_id'" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)"></select-input>
              <fuzzy-search v-if="row.field_name === 'obj_id' && cmd !== 'DELETE'" :oldvalue="row.field_value" :ref="row.field_name" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)" :opts="{typeDef: typeDef, dataSet: dataSet}"></fuzzy-search>
              <input type="text" v-if="row.field_type !== 'SELECT' && row.field_type !== 'DATETIME'" v-model="row.field_value" :ref="row.field_name" min="1" :data-enableNull="row.field_enableNull" @blur="checkInput($event, row.field_name, row.field_type)" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <input type="datetime-local" step="01" v-if="row.field_type === 'DATETIME'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
              <span class="tip"></span>
            </p>    
            <p v-if="isDelete" class="tips">注意：数据删除后将无法恢复！您确认要删除本记录？</p>
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
      rows: [],
      isShow: false,
      name: null,
      titles: null,
      fields: null,
      headMsg: {
        title: null,
        closer: true
      },
      tableName: null,
      cmd: null,
      alarmId: null,
      tip: false,
      isDelete: false,
      currtEventType: 3,
      typeDef: null,
      dataSet: null,
      oldRows:null
    }
  },
  watch: {
    '$store.state.stateStore.alarmDialogMsg': {
      handler: function (result) {
        if (result.showAlarmDialog) {
          this.name = this.$store.state.stateStore.alarmDialogMsg.dialogName
          let {row, controlName} = this.$store.state.stateStore.alarmDialogMsg
          this.cmd = controlName
          this.currtEventType = (row && row.event_type_id) ? row.event_type_id : this.currtEventType
          this.fields = edit_def[this.name] && edit_def[this.name].def.fields
          this.headMsg.title = edit_def[this.name] && edit_def[this.name].def.label
          this.tableName = edit_def[this.name] && edit_def[this.name].def.table
          let maxid = this.$store.state.metaStore.maxIDs[this.name]
          let rows = getRows(row, edit_def[this.name].def, maxid)
          let msg = getMessage(controlName, rows, edit_def[this.name].def, maxid)
          if (controlName === 'UPDATE' || controlName === 'DELETE') {
            this.alarmId = row.id
          }
          this.isDelete = controlName === 'DELETE' ? true : false
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
            return item
          })
          this.oldRows = clone(this.rows)
          this.tableKeyName = msg.key
          this.getFuzzyDef()
        }
        
        this.isShow = result.showAlarmDialog
      },
      deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        let updateRes = metaUpdateRes(result, this.name, this.cmd)
        if (updateRes) this.close()
      },
      deep: true
    }
  },
  methods: {
    // 动态生成标签
    chooseShow (row) {
      let show = true
      let id = this.currtEventType
      if (id === 40 && row.field_name === 'area_id') return false
      if (id === 3 && row.field_name === 'obj_id') return false
      if (id !== 40 && row.field_name === 'credentials_id') return false
      return show
    },
    // 模糊查询结果接收函数
    getResult (result) {
      let desc=this.dataSet.desc
      if(desc!=='name'){     
        this.$el.querySelector('#searchinput').value = result[desc].name
      }else{
        this.$el.querySelector('#searchinput').value = result[0][desc].name     
      }
    },
    // 关闭函数
    close () {
      this.currtEventType = 3
      this.$store.commit('stateStore/changeAlarmDialog',{type: false})
    },

  // 确定函数
    makesure () {
      switch (this.cmd) {
        case 'INSERT':
          // 添加
          this.doInsert()
          break
        case 'UPDATE':
          // 更新的
          this.doUpdate()
          break
        case 'DELETE':
          // 删除的
          this.doDelete()
          break
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
      let keyValue = null,noticeServer = [1], alarmObj = {},alarmSql = null, detail = ''
      for (let i = 0; i < this.rows.length; i++ ){
        let fieldName = this.rows[i].field_name
        let fieldType = this.rows[i].field_type
        let fieldEnableNull = this.rows[i].field_enableNull
        if (fieldName === 'obj_id' && this.currtEventType === 3) {
          fieldEnableNull = true
        }
        if (fieldName === 'area_id' && this.currtEventType === 40){
          fieldEnableNull = true
        }
        let ele = this.$refs[fieldName][0]
        let fieldValue = ele && ele.value
        if (fieldType === 'SELECT') {
          ele = ele.$el
          fieldValue = ele.value
        }
        if (fieldName === 'obj_id') {
          let fuzzysearch = this.$refs[fieldName][0].$el
          let value = fuzzysearch.querySelector('#searchinput').value
          if (value) fieldValue = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
        }
        if(!fieldValue && !fieldEnableNull) return this.testUnenableNullData()
        if (fieldValue) {
          fieldValue = this.formatFieldValue(fieldType, fieldValue)
          noticeServer.push(fieldValue)
          if (i === 0) {
            keyValue = fieldValue
          }
          alarmObj[fieldName] = fieldValue
          detail = editDetail(fieldName, fieldValue, detail, this.name)
        }
      }
      if (alarmObj.start_time && alarmObj.end_time && (alarmObj.start_time >= alarmObj.end_time)) {
        return this.checkSpell('开始时间需要小于于当前时间!')
      }
      if (this.currtEventType === 40) {
        let startTime = alarmObj.start_time
        let expireTime = this.getDate(startTime)
        let bindObj = getCardBindObjectInfo('','00'+ alarmObj.obj_id)
        let staffId = bindObj && bindObj.staff_id
        alarmSql = `INSERT into dat_credentials_staff (staff_id,credentials_id,expire_time,warn) VALUES(${staffId},${alarmObj.credentials_id},"${expireTime}",0)`
      } else {
        let objTypeId = null
        if (this.currtEventType === 3) {
          objTypeId = 2
        } else if (this.currtEventType === 6 || this.currtEventType === 33) {
          objTypeId = 4
        } else {
          objTypeId = 9
        }
        let objId = this.currtEventType === 3 ? alarmObj.area_id : alarmObj.obj_id
        let id = turnId(3,alarmObj.event_type_id,objTypeId,objId)
        let baseFields = 'id,source,event_id,event_type_id,obj_type_id,obj_id,dis_type,map_id,area_id, cur_time, stat'
        let baseValues = `${id.toString()},1,${alarmObj.event_id},${alarmObj.event_type_id},${objTypeId},${objId},3,5,${alarmObj.area_id}`
        let sbaseValues = baseValues + `, "${alarmObj.start_time}", 0`
        if (alarmObj.end_time) {
          let ebaseValues = baseValues + `, "${alarmObj.end_time}", 100`
          alarmSql = {
            '1i': `INSERT into ${this.tableName} (${baseFields}) VALUES(${sbaseValues})`,
            '12': `INSERT into ${this.tableName} (${baseFields}) VALUES(${ebaseValues})`
          }
        } else {
          alarmSql = `INSERT into ${this.tableName} (${baseFields}) VALUES(${sbaseValues})`
        }
      }
      if (detail) keyValue = detail
      let req = composeUpdateDBReq('INSERT', this.name, keyValue, alarmSql)
      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },

    // 更新数据函数
    doUpdate () {
      if (this.tip) return this.checkSpell('请检查值是否填写正确!')
      let noticeServer = [3],signArr = [],alarmObj = {}, oldObj ={},baseSql = '',alarmSql = null, detail = ''
      let keyele = this.$refs[this.tableKeyName][0]
      let keyValue = keyele && keyele.value
      if (!keyValue) {
        keyValue = keyele && keyele.oldvalue
      }
      for (let i = 0; i < this.rows.length; i++) {
        let fieldName = this.rows[i].field_name
        let fieldEnableNull = this.rows[i].field_enableNull
        if (fieldName === 'obj_id' && this.currtEventType === 3) {
          fieldEnableNull = true
        }
        if (fieldName === 'area_id' && this.currtEventType === 40){
          fieldEnableNull = true
        }
        if ((this.currtEventType !== 40 && fieldName === 'credentials_id') || (this.currtEventType === 3 && fieldName === 'obj_id')){
          continue
        }
        let inputValue = null
        let ele = this.$refs[fieldName][0]
        let value = ele && ele.value
        if (this.rows[i].field_type === 'SELECT') {
          ele = ele.$el
          value = ele.value
        }
        if (fieldName === 'obj_id') {
           let fuzzysearch = this.$refs[fieldName][0].$el
           let fuzzyvalue = fuzzysearch.querySelector('#searchinput').value
           if (fuzzyvalue) value = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
        }
        if (!value && !fieldEnableNull) return this.testUnenableNullData()
        if (fieldName === 'obj_id') {
          if (Number(value) != Number(this.oldRows[i].field_value)) {
            signArr.push(fieldName)
          }
          detail = editDetail(fieldName, Number(value), detail, this.name)
        } else {
          if (value != this.oldRows[i].field_value) {
            signArr.push(fieldName)
            detail = editDetail(fieldName, value, detail, this.name)
          }
        }
        oldObj[fieldName] = this.oldRows[i].field_value
        if (value) {
          inputValue = this.formatFieldValue(this.rows[i].field_type, value)
          if (!['start_time', 'end_time'].includes(fieldName)) {
            baseSql += `,${fieldName}=${inputValue}`
          }
          noticeServer.push(inputValue)
          alarmObj[fieldName] = inputValue
        }
      }
      if (alarmObj.start_time && alarmObj.end_time && (alarmObj.start_time >= alarmObj.end_time)) {
        return this.checkSpell('开始时间需要小于于当前时间!')
      }

      if (this.currtEventType === 3 && signArr.includes('area_id')) {
        baseSql += `,obj_id=${alarmObj.area_id}`
      }
      if (signArr.length < 1) {
        let msg = {
          value: 'failure',
          tip: '数据没有修改，请确认后再提交！'
        }
        window.xdata.commit('metaStore/saveHintip', msg)
        return
      } else {
        baseSql = baseSql.replace(',', '')
        let oldStartTime = oldObj.start_time
        let oldEndTime = oldObj.end_time
        let sbaseSql = baseSql
        let ebaseSql = baseSql
        if (signArr.includes('start_time')) {
          sbaseSql += `,cur_time="${new Date(alarmObj.start_time).format('yyyy-MM-dd hh:mm:ss')}"`
        } 
        if (signArr.includes('end_time') && alarmObj.end_time) {
          ebaseSql += `,cur_time="${new Date(alarmObj.end_time).format('yyyy-MM-dd hh:mm:ss')}"`
        }
        if (signArr.includes('end_time')){
          let objTypeId = null
          if (this.currtEventType === 3) {
            objTypeId = 2
          } else if (this.currtEventType === 6 || this.currtEventType === 33) {
            objTypeId = 4
          } else {
            objTypeId = 9
          }
          let objId = this.currtEventType === 3 ? alarmObj.area_id : alarmObj.obj_id
          let id = turnId(3,alarmObj.event_type_id,objTypeId,objId)
          let baseFields = 'id,source,deal,event_id,event_type_id,obj_type_id,obj_id,dis_type,map_id,area_id, cur_time, stat'
          let baseValues = `${id.toString()},1,0,${alarmObj.event_id},${alarmObj.event_type_id},${objTypeId},${objId},3,5,${alarmObj.area_id}`
          let ebaseValues = baseValues + `, "${alarmObj.end_time}", 100`
          if (oldEndTime) {
            if (alarmObj.end_time) {
              alarmSql = `UPDATE ${this.tableName} set ${ebaseSql} where ${this.tableKeyName}=${keyValue} and id = ${this.alarmId.split('+')[1]} and date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${oldEndTime}"`
            } else {
              alarmSql = `DELETE FROM ${this.tableName} WHERE id = ${this.alarmId.split('+')[1]} AND event_id = ${oldObj.event_id} AND stat = 100 AND date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${oldEndTime}"`
            }
          } else {
            alarmSql = `INSERT into ${this.tableName} (${baseFields}) VALUES(${ebaseValues})`
          }
          if (signArr.length > 1) {
            alarmSql = {
              '1u': `UPDATE ${this.tableName} set ${sbaseSql} where ${this.tableKeyName}=${keyValue} and id = ${this.alarmId.split('+')[1]} and date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${oldStartTime}"`,
              '2e': alarmSql
            }
          } 
        } else {
          alarmSql = `UPDATE ${this.tableName} set ${sbaseSql} where ${this.tableKeyName}=${keyValue} and id = ${this.alarmId.split('+')[1]} and date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${oldStartTime}"`
          if (oldEndTime) {
            alarmSql = {
              '1u': alarmSql,
              '2u': `UPDATE ${this.tableName} set ${baseSql} where ${this.tableKeyName}=${keyValue} and id = ${this.alarmId.split('+')[1]} and date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${oldEndTime}"`
            }
          }
        }
        if (signArr.length > 0) keyValue = detail
        let req = composeUpdateDBReq('UPDATE', this.name, keyValue, alarmSql)
        req.data['notice'] = noticeServer
        this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
          cmd: 'META-UPDATE-DB',
          data: req
        })
      }
    },

    // 删除数据函数
    doDelete () {
      let detail = ''
      let keyele = this.$refs[this.tableKeyName][0]
      let keyValue = keyele && keyele.value
      if (!keyValue) {
        keyValue = keyele && keyele.oldvalue
      }
      let noticeServer = this.$refs['event_type_id'][0].oldvalue
      let timeSearch = `date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${this.rows[5].field_value}"`
      if (this.rows[6].field_value) {
        timeSearch = `( date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${this.rows[5].field_value}" or date_format(cur_time,"%Y-%m-%dT%H:%i:%s") = "${this.rows[6].field_value}")`
      }
      let sql = `DELETE FROM ${this.tableName} WHERE id = ${this.alarmId.split('+')[1]} AND ${this.rows[0].field_name} = ${this.rows[0].field_value} AND ${this.rows[2].field_name} = ${this.rows[2].field_value} AND ${timeSearch}`
      detail = this.getDeleteDetail()
      if (detail) keyValue = detail
      let req = composeUpdateDBReq('DELETE', this.name, keyValue, sql)
      req.data['notice'] = noticeServer
      console.log(sql)
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
        if (field_value === undefined) continue
        detail = editDetail(field_name, field_value, detail, this.name)
      }
      return detail
    },

    // select选择函数
    choose(data){
      if (data[1] === 'event_type_id' && this.tableName === 'his_event_data') {
        this.currtEventType = parseInt(data[0], 10)
        this.getFuzzyDef()
        this.$refs['obj_id'] && this.$refs['obj_id'][0].updateData({typeDef: this.typeDef, dataSet: this.dataSet})
      }
    },
    // 获取特殊的模糊查询配置
    getFuzzyDef(){
      let ID = this.currtEventType
      let fieldName = null
      let datas = null
      if ([6,33].includes(ID)) {
        fieldName = 'reader'
        datas = xdata.state.metaStore.data[fieldName] && Array.from(xdata.state.metaStore.data[fieldName].values())
      } else if (ID == 3) {
        fieldName = 'area'
        datas = xdata.state.metaStore.data[fieldName] && Array.from(xdata.state.metaStore.data[fieldName].values())
      } else {
        fieldName = 'staffs'
        datas = xdata.state.metaStore['staffs'] && Array.from(xdata.state.metaStore['staffs'].values())
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
      value = value ? new Date(value).format('yyyy-MM-ddThh:mm:ss') : ''
      return value
    },

    // 获取value
    getValue (value, name) {
      if (this.cmd !== 'INSERT') return value
      if (name === 'event_id') return new Date().getTime()
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
    // 是否可编辑函数
    isReadonly (field_name,field_enableEdit) {
      let readonly = true
      if (this.tableName !== 'dat_user' && this.tableName !== 'dat_user_tool' && field_name === 'user_id') return true
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
  },
  updated () { 
    if(this.$store.state.stateStore.alarmDialogMsg.showAlarmDialog){
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
