<template>
  <div class="add-hispath">
      <div class="content-top">
        <!-- :class="(cmd === 'INSERT' && row.field_name === 'virtual_path_id') ? 'hidInput' : 'list'" -->
        <p v-for="row in rows" :key="row.index" class="list">
          <span>
            <span class="span-title">{{row.field_label}}</span>
            <span class="enableNull" v-if="!row.field_enableNull">必填</span>
          </span>
          <select-input topicname="virtual_path" :name="row.field_name" :oldvalue="row.field_value" id="" @chooseItem="choose" v-if="row.field_type === 'SELECT' && row.field_name !== 'obj_id'" :ref="row.field_name" :data-enableNull="row.field_enableNull"></select-input>
          <fuzzy-search class="fuzzy-search" v-if="row.field_name === 'obj_id'" :oldvalue="row.field_value" :ref="row.field_name" :data-enableNull="row.field_enableNull" :opts="{typeDef: typeDef, dataSet: dataSet}"></fuzzy-search>
          <input type="text" v-if="row.field_type !== 'SELECT' && row.field_type !== 'CHECKBOX' && row.field_type !== 'COLOR' && row.field_type !== 'DATETIME' && row.field_type !== 'TIME' && row.field_type !== 'DATE'" v-model="row.field_value" :ref="row.field_name" min="1" :data-enableNull="row.field_enableNull" :disabled="isReadonly(row.field_name,row.field_enableEdit)">
          <input type="datetime-local" v-if="row.field_type === 'DATETIME'" name="" id="" :ref="row.field_name" v-model="row.field_value" :data-enableNull="row.field_enableNull">
        </p>   
      </div>
      <div class="btns">
        <button @click="doQueryList">查询</button>
        <button @click="makeSure">确定</button>
      </div>
      <div class="content-bottom">
        <trackList ref="track-list"></trackList>
      </div>
  </div>
</template>
<script>
import {getRows, trim, composeUpdateDBReq, getMessage, getShiftByTime} from '@/js/utils/utils.js'
import fuzzySearch from '@/components/fuzzy-search'
import trackList from '@/components/track-list'
import selectInput from '@/components/select-input'
import {edit_def} from '@/js/def/dialog_edit_def.js'
export default {
  props:['opts'],
  data () {
    return {
      rows: {},
      name: 'virtual_path_his',
      cmd: null,
      tableKeyName: null,
      typeDef: null,
      dataSet: null,
      hasPath: false
    }
  },
  mounted(){
    this.init(this.opts)
  },
  watch: {
    '$store.state.socketStore.reptShowResult': {
        handler: function (result) {  
          if(result.def.name === 'addhisPath'){
            this.$store.commit('stateStore/changeShowXhint',{
              showXhint: false,
              data: null
            })
            if(result.rows && result.rows.length > 0){
              let msg = this.processTrackDataTime(result.rows)
              this.$store.commit('olMapTrackLayer/drawWholeTrack',{msg: msg, PatrolPath: 'PatrolPath'})
              this.hasPath = true
            }else{
              window.xdata.commit('metaStore/saveHintip', { value: 'failure', tip: '该人员路径不存在！' })
              this.hasPath = false
            } 
          }
        },
        deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        if(result.data.name === "virtual_path"){
          let textContent = this.cmd === 'INSERT' ? '新增' : '修改'
          let msg = {
            value: result.code === 0 ? 'success' : 'failure',
            tip: result.code === 0 ? `${textContent}成功` : `${textContent}失败`
          }
          window.xdata.commit('metaStore/saveHintip', msg)
        }
      },
      deep: true
    },
    'opts': {
      handler: function (result) {
        this.init(result) 
      },
      deep: true
    },
  },
  methods: {
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
    // 模糊查询结果接收函数
    getResult (result) {
      let desc = this.dataSet.desc
      if(desc !== 'name') {     
        this.$el.querySelector('#searchinput').value = result[desc].name
      } else {
        this.$el.querySelector('#searchinput').value = result[0][desc].name
      }
    },
    // 查询函数
    doQueryList () {
      this.$store.commit('stateStore/changeShowXhint',{
        showXhint: true,
        data: null
      })
      let startTime = new Date(this.$refs["start_time"][0].value).format('yyyy-MM-dd hh:mm:ss')
      let endTime = new Date(this.$refs["end_time"][0].value).format('yyyy-MM-dd hh:mm:ss')
      let objID = null
      let fuzzysearch = this.$refs["obj_id"][0].$el
      objID = fuzzysearch.querySelector('#searchinput').value
      if (objID) objID = fuzzysearch.querySelector('#searchinput').getAttribute('data-type')
      let staffAssociation = `left join dat_landmark dl1 on ras.landmark_id_start = dl1.landmark_id left join dat_landmark dl2 on ras.landmark_id_end = dl2.landmark_id left join dat_direction_mapper ddm1 on ras.landmark_direction_start = ddm1.direction_mapper_id left join dat_direction_mapper ddm2 on ras.landmark_direction_end = ddm2.direction_mapper_id order by ras.start_time desc;`
      let timeExpr = ` and ras.start_time >= "${startTime}" and ras.end_time <= "${endTime}" and TIMESTAMPDIFF(SECOND, start_time, end_time) >= 10`
      let sql = `select ras.card_id, ras.staff_id,date_format(ras.start_time, "%Y-%m-%d %H:%i:%s") as start_time, date_format(ras.end_time, "%Y-%m-%d %H:%i:%s") as end_time,ifnull(dl1.name,'') as sname,ddm1.name as sdir,ras.landmark_distance_start as sdis,ifnull(dl2.name,'') as ename,ddm2.name as edir,ras.landmark_distance_end as edis from (
          select ras.* from rpt_att_staff ras where ras.staff_id=${objID}${timeExpr}) ras ${staffAssociation}`
      let countSql = `select count(staff_id) as total from rpt_att_staff as ras where staff_id=${objID}${timeExpr};`
      let message = {
        cmd: 'query',
        data: {
          name: 'TrackList',
          pageSize: 100,
          pageIndex: 0,  
          total: -1,
          sql: sql,
          countSql: countSql
        }
      }
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
          cmd: 'REPT-FETCH-DATA',  
          data:{
              data: message,
              cmd: 'REPT',
              def: {
                  name: 'TrackList'
              },
          }
      })
    },
    // 检查必填字段是否填写函数
    testUnenableNullData () {
      let msg = {
          value: 'failure',
          tip: '请把必填字段填写完整'
        }
      window.xdata.commit('metaStore/saveHintip', msg)
    },
    makeSure () {
      switch (this.cmd) {
        case 'INSERT':
          this.doInsert()
          break
        case 'UPDATE':
          this.doUpdate()
          break
      }
    },
    // 确定函数，存储数据
    doInsert () {
      if(!this.hasPath) return window.xdata.commit('metaStore/saveHintip', { value: 'failure', tip: '该人员路径不存在！' })
      let keyValue = null,readerSql = null,driverSql = null,fields = '',values = '',noticeServer = [1],pathID =null, beginTime = '', endTime = '', angle = 0
      for (let i = 0; i < this.rows.length; i++) {
        let fieldName = this.rows[i].field_name
        let fieldType = this.rows[i].field_type
        let fieldEnableNull = this.rows[i].field_enableNull
        let ele = this.$refs[fieldName][0]
        let fieldValue = ele && ele.value
        let chooseTrack = this.$refs['track-list'].chooseTrack
        // if (this.cmd === 'INSERT' && fieldName === 'virtual_path_id') continue
        if (fieldName === 'obj_id') {
          fieldValue = chooseTrack && chooseTrack['staff_id']
        }else if(fieldName === 'start_time' || fieldName === 'end_time'){
          fieldValue = chooseTrack && chooseTrack[fieldName]
        }else if(fieldName === 'valid'){
          ele = ele.$el
          fieldValue = ele.value
        }
        if(!fieldValue && !fieldEnableNull) return this.testUnenableNullData()
        if(fieldValue){
          fieldValue = this.formatFieldValue(fieldType, fieldValue)
          noticeServer.push(fieldValue)
          if (i === 0) {
            keyValue = fieldValue
          }
          fields += ','
          values += ','
          fields += fieldName
          values += fieldValue
        }
      }
      fields = fields.replace(',', '')
      values = values.replace(',', '')
      let sql = `INSERT into dat_virtual_path (${fields}) VALUES(${values})`
      let req = composeUpdateDBReq('INSERT', 'virtual_path', keyValue, sql)
      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
    },
    // 修改函数，存储数据
    doUpdate () {
      if(!this.hasPath) return window.xdata.commit('metaStore/saveHintip', { value: 'failure', tip: '该人员路径不存在！' })
      let keyValue = null,sql = '',noticeServer = [1]
      for (let i = 0; i < this.rows.length; i++) {
        let fieldName = this.rows[i].field_name
        let fieldType = this.rows[i].field_type
        let fieldEnableNull = this.rows[i].field_enableNull
        let ele = this.$refs[fieldName][0]
        let fieldValue = ele && ele.value
        let chooseTrack = this.$refs['track-list'].chooseTrack
        if (fieldName === 'obj_id') {
          fieldValue = chooseTrack && chooseTrack['staff_id']
        }else if(fieldName === 'start_time' || fieldName === 'end_time'){
          fieldValue = chooseTrack && chooseTrack[fieldName]
        }else if(fieldName === 'valid'){
          ele = ele.$el
          fieldValue = ele.value
        }
        if(!fieldValue && !fieldEnableNull) return this.testUnenableNullData()
        if(fieldValue){
          fieldValue = this.formatFieldValue(fieldType, fieldValue)
          noticeServer.push(fieldValue)
          if (i === 0) {
            keyValue = fieldValue
          }else{
            sql += `,${fieldName}=${fieldValue}`
          }
        }
      }
      sql = sql.replace(',', '')
      sql = `UPDATE dat_virtual_path SET ${sql} WHERE ${this.tableKeyName} = ${keyValue}`
      let req = composeUpdateDBReq('UPDATE', 'virtual_path', keyValue, sql)
      req.data['notice'] = noticeServer
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'META-UPDATE-DB',
        data: req
      })
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
    // 初始化数据
    init(data){
      let initData = data ? data : null
      this.cmd = data ? 'UPDATE' : 'INSERT'
      let maxid = this.$store.state.metaStore.maxIDs['virtual_path']
      let rows = getRows(initData, edit_def[this.name].def, maxid)
      let msg = getMessage(this.cmd, rows, edit_def[this.name].def, maxid)
      this.rows = msg.rows.map(item =>{
        if(item.field_type === 'DATETIME'){
          item.field_value = this.getDateTime(item.field_value)
        }
        return item
      })
      this.tableKeyName = msg.key
      this.getFuzzySearch()
      if (this.cmd === 'UPDATE') {
        this.$nextTick(() => {
          this.doQueryList()
        })
      }
    },
    //格式化时间
    getDateTime (value) {
      value = value ? new Date(value).format('yyyy-MM-ddThh:mm:ss') : null
      return value
    },
    // 判断是否可编辑
    isReadonly (field_name,field_enableEdit) {
      let readonly = true
      if(this.cmd === 'UPDATE'){
        readonly = field_name === this.tableKeyName ? true : false
      }else{
        readonly = false
      }
      return readonly
    },
    // 模糊查询选中的回调函数
    choose(data){
      
    }
  },
  components: {
    fuzzySearch,
    trackList,
    selectInput
  }
}
</script>
<style lang="sass">
@import '../../style/defs.sass'
.add-hispath
    position: absolute
    left: 0
    top: 52px
    background: rgba(5,29,71,0.5)
    display: flex
    flex-direction: column
    height: 45rem
    width: 22rem
    .content-top
      display: flex
      flex-direction: column
      flex: 0 0 12rem
      align-items: center
      justify-content: space-around
      .list
        display: flex
        align-items: center
        @include wh(90%, 3rem)
        padding: 0 1rem
        background: #082863
        span
          width: 8rem
          .enableNull
            color: red
            font-size: 12px
          .span-title
            color: #999999
        input,select
          height: 1.5rem
          background: #082863
          color: white
        .fuzzy-search
          border: 0
          border-bottom: 1px solid #cccccc
          height: 100%
          line-height: 0rem
          input
            height: 1.5rem
            background: #082863
            color: white
      .hidInput
        display: none
    .btns
      display: flex
      flex: 0 0 3rem
      align-items: center
      justify-content: space-around
    .content-bottom
      display: flex
      flex-direction: column
      overflow-x: hidden
      overflow-y: auto
      flex: 0 0 27rem
</style>

