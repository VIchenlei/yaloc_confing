<template>
  <div>
    <div class="dlg-window" v-if="isShow">
      <div class="dlg-bg file-dialog">
        <dialog-head class="tips-title" :headContent="headMsg"></dialog-head>
        <div class="dlg-body">
          <input type="file" class="fileinput" name="inputChooseFile" ref="inputChooseFile" @change="fileChosen" style="display:none">
          <div name="preview_box" class="file-dropbox csv-dropbox" v-if="isPreviewFile">
            <table>
              <thead>
                <tr>
                  <th v-for="(label, index) in labels" :key="index">
                    {{label.field_label}}
                  </th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody id="importTableBody">
                <tr v-for="(row, index) in fileData" :key="index">
                  <td v-for="(value, name) in row" :key="name">{{getName(value,name)}}</td>
                  <td :data-id="delBlank(row[keyName], row)">{{fileState}}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div name="drop_box" ref="drop_box" class="file-dropbox" v-if="!isPreviewFile">
            <div>请点击下方选择文件...</div>
            <!-- <span>或</span> -->
            <div>
              <span class="choose-file" op-name="choose-file" @click="chooseFile">选择文件...</span>
            </div>
          </div>
        </div>
        <div class="dlg-foot">
          <button id="btnImport" class="btn-sure" ref="btnImport" op-name="save-update" v-if="isModified" @click="importData">导入</button>
          <button id="btnDelete" class="btn-cancel" ref="btnDelete" op-name="delete-from-remote" v-if="isPreviewFile" @click="deleteFile">删除</button>
          <button id="btnClose" class="button-cancel" ref="btnClose" op-name="close" @click="close">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Papa from 'papaparse'
import XLSX from 'xlsx'
import dialogHead from '@/components/dialog-head'
import {objKeySort, trim, composeUpdateDBReq, turnId, editDetail} from '@/js/utils/utils'
import { getCardBindObjectInfo, formatField } from '@/js/utils/metaStoreDep.js'
import textTurnNumber from '@/js/def/text_turn_number.js'
export default {
  data () {
    return {
      isShow: false,
      headMsg: {
        title: null,
        closer: true
      },
      isPreviewFile: false,
      def: null,
      // title: null,
      tableName: null,
      topicName: null,
      labels: null,
      keyName: null,
      selectedFile: null,
      isModified: false,
      fileData: null,
      cardsData: null,
      total: 0,
      countDone: 0,
      countOK: 0,
      countFail: 0,
      blockIndex: [],
      fileState: '未导入',
      isAll: false,
      needDisplay: 0
    }
  },
  watch: {
    '$store.state.stateStore.importFileMsg': {
      handler: function (result) {
        if (result.showImportFile) {
          this.init(result.data)
        }
        this.isShow = result.showImportFile
      },
      deep: true
    },
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (res) {
        if(this.isShow){
          let keyID = res.data.id
          if (typeof keyID === 'string' && this.topicName !== 'alarm_mange') keyID = keyID.slice(1, keyID.length - 1)
          let cell = this.$el.querySelectorAll(`[data-id="${keyID}"]`)
          let state = ''
          this.countDone++
          if (res.code === 0) {
            this.countOK++
            // if (cell) cell.style = 'color: green'
            if (cell) {
              for (let i = 0, len = cell.length; i < len; i++) {
                cell[i].style = 'color: green'
              }
            }
            state = '成功'
            this.fileState = '已导入'
          } else {
            this.countFail++
            // if (cell) cell.style = 'color: red'
            if (cell) {
              for (let i = 0, len = cell.length; i < len; i++) {
                cell[i].style = 'color: red'
              }
            }
            state = '失败'
            console.log('导入失败：' + res.msg)
          }
          // if (cell) cell.innerHTML = state
          if (cell) {
            for (let i = 0, len = cell.length; i < len; i++) {
              cell[i].innerHTML = state
            }
          }
          if (this.countDone >= this.total) {
            this.$refs['btnImport'].style = 'display: none'
            this.$refs['btnDelete'].style = 'display: none'
            this.$refs['btnClose'].innerText = '关闭'
            this.setButtonsDisabled(false, 'import')
          }
        }
      },
      deep: true
    }
  },
  methods: {
    // 可拖拽弹出框函数
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
    // 关闭函数
    close () {
      this.$store.commit('stateStore/changeImportFileMsg', {
          showImportFile: false,
          data: null
      })
    },
    // 初始化需要的数据函数
    init (data) {
      this.def = data.def
      this.headMsg.title = '批量导入 - ' + this.def.label
      this.tableName = this.def.table
      this.topicName = this.def.name
      this.labels = data.rows
      this.keyName = this.def.fields.labels[this.def.keyIndex]
      this.fileData = null
      this.isModified = false
      this.isPreviewFile = false
      this.fileState = '未导入'
      this.isAll = data.isAll
      this.needDisplay = data.needDisplay
    },

    // 选择文件
    fileChosen (evt) {
      let target = evt.currentTarget
      let file = target.files[0]
      let name = file.name
      name = name.split('.')
      let fileType = name[name.length-1]
      if (fileType === 'csv') {
        this.fileChosenCsv(evt)
      } else {
        this.fileChosenExcel(file)
      }
    },

    // 获取选中文件的数据函数
    fileChosenExcel (file) {
      let reader = new FileReader()
      let self = this
      reader.onload = function (e) {
        let data = e.target.result
        let wb = XLSX.read(data, {
            type: 'binary',
            cellDates: true,  //把时间格式数据格式化成能看懂的
            dateNF: 'yyyy-MM-dd hh:mm:ss'  //感觉这个参数没起作用
        })
        let values = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        self.previewData(values)
      }
      reader.readAsBinaryString(file)
    },

    fileChosenCsv (event) {
      let files = event.target.files || event.dataTransfer.files
      this.selectedFile = files[0]
      if (this.selectedFile) {
        let self = this
        Papa.parse(this.selectedFile, {
          header: true,
          complete: function (results) {
            let tooFewFieldIndex = []
            let errors = results.errors
            for (let item of errors) {
              if (item.code === 'TooFewFields') {
                tooFewFieldIndex.push(item.row)
              }
            }
            let data = []
            for (let i = 0; i < results.data.length; i++) {
              if (!tooFewFieldIndex.includes(i)) {
                data.push(results.data[i])
              }
            }
            self.previewData(data)
          },
          encoding: 'GB2312'
        })
      }
    },


    //触发选中input的点击事件
    chooseFile (evt) {
      this.$refs.inputChooseFile.click()
    },

    //格式化显示的数据
    previewData (msg) {
      let newlabels = this.labels.map(item =>{
        return item.field_label
      })
      // this.fileData = msg.map(item =>{
      //   return objKeySort(item, newlabels)
      // })

      this.fileData = this.getFileData(msg, newlabels)
      this.isPreviewFile = true
      this.isModified = true
    },

    //获取显示name值
    getName (value,name) {
      let def = this.def
      let fields = def.fields
      let fnames = fields.names
      let flabels = fields.labels
      let ftypes = fields.types
      let fieldName = fnames[flabels.indexOf(name)]
      let fieldtype = ftypes[flabels.indexOf(name)]
      if(fieldName !== 'staff_id' && fieldName !== 'vehicle_id'){
        value = formatField(fieldName,value,fieldtype)
      }
      // value = formatField(fieldName,value,fieldtype)
      return value
    },

    // 去空格
    delBlank (key, row) {
      let value = null
      if (this.topicName === 'alarm_mange') {
        value = this.getAlarmID(row)
      } else {
        value = key && trim(key.toString())
      }
      return value
    },

    // 删除选中的文件
    deleteFile (evt) {
      this.selectedFile = null
      this.$refs.inputChooseFile.value = null
      this.isPreviewFile = false
      this.isModified = false
    },

    // 发送数据sql
    importData (evt) {
      this.setButtonsDisabled(false)
      let detail = ''
      let rows = this.fileData
      this.total = rows.length
      this.countDone = 0
      this.countOK = 0
      this.countFail = 0
      if (this.topicName === 'alarm_mange') {
        let def = this.def
        let fields = def.fields
        let fnames = fields.names
        let flabels = fields.labels
        let ftypes = fields.types
        let fieldCount = fnames.length
        let alarmObj = {}
        this.keyName = 'id'
        let eventID = new Date().getTime()
        for (let i = 0; i < this.total; i++) {
          let fields = ''
          let values = ''
          let keyValue = null
          let row = rows[i]
          let tableKeyName = null
          let checkNames = ['event_type_id', 'start_time']
          let alarmSql = null
          let id = null
          for (let j = 0; j < fieldCount; j++) {  // 不包括最后一列：lastUpdate
            let fieldName = fnames[j]
            let fieldLabel = flabels[fnames.indexOf(fieldName)]
            let fieldValue = row[fieldLabel]
            if (!fieldValue && fieldValue !== 0) fieldValue = row[fieldName]
            fieldValue = this.formatFieldValue(ftypes[j], fieldValue, fieldName)
            if (checkNames.includes(fieldName) && !fieldValue && fieldValue !==0 ) return this.checkSpell(fieldLabel)
            if (fieldValue || fieldValue === 0) {
              alarmObj[fieldName] = fieldValue
              if (['event_type_id', 'obj_id'].includes(fieldName)) {
                detail += `${fieldLabel}:${fieldValue};` 
                detail = detail.slice(0, 256) // 避免字节长度超出导致添加录入数据库失败
              }
            }   
          }
          if (alarmObj.event_type_id === 40) {
            let startTime = alarmObj.start_time
            let expireTime = new Date(startTime).format('yyyy-MM-dd')
            let bindObj = getCardBindObjectInfo('','00'+ alarmObj.obj_id)
            let staffId = bindObj && bindObj.staff_id
            let credentialsId = this.formatFieldValue('SELECT', row['所属区域/资格证类型'], 'credentials_id')
            alarmSql = `INSERT into dat_credentials_staff (staff_id,credentials_id,expire_time,warn_id) VALUES(${staffId},${credentialsId},"${expireTime}",0)`
            id = turnId(3,alarmObj.event_type_id,9,alarmObj.obj_id)
          } else {
            let objTypeId = null
            if (alarmObj.event_type_id === 3) {
              objTypeId = 2
            } else if (alarmObj.event_type_id === 6 || alarmObj.event_type_id === 33) {
              objTypeId = 4
            } else {
              objTypeId = 9
            }
            let objId = alarmObj.event_type_id === 3 ? alarmObj.area_id : alarmObj.obj_id
            id = turnId(3,alarmObj.event_type_id,objTypeId,objId)
            let baseFields = 'id,source,event_id,event_type_id,obj_type_id,obj_id,dis_type,map_id,area_id, cur_time, stat'
            let baseValues = `${id.toString()},1,${eventID},${alarmObj.event_type_id},${objTypeId},${objId},3,5,${alarmObj.area_id}`
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
          let req = composeUpdateDBReq('INSERT', this.topicName, detail, alarmSql)
          this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
            cmd: 'META-UPDATE-DB',
            data: req
          })
        }
      } else {
        let def = this.def
        let fields = def.fields
        let fnames = fields.names
        let flabels = fields.labels
        let ftypes = fields.types
        let fieldCount = fnames.length
        let svIDs = []
        let isAllKeyName = null
        for (let i = 0; i < this.total; i++) {
          let fields = ''
          let values = ''
          let keyValue = null
          let row = rows[i]
          let sql = ''
          let tableKeyName = null
          for (let j = 0; j < fieldCount; j++) {  // 不包括最后一列：lastUpdate
            let fieldName = fnames[j]
            let fieldLabel = flabels[fnames.indexOf(fieldName)]
            let fieldValue = row[fieldLabel]
            if (!fieldValue && fieldValue !== 0) fieldValue = row[fieldName]
            fieldValue = this.formatFieldValue(ftypes[j], fieldValue, fieldName)
            if (fieldName === 'name') continue
            if (fieldName === 'staff_id' || fieldName === 'vehicle_id'){
              svIDs.push(fieldValue)
            } else if (fieldName === 'need_display'){
              fieldValue = this.needDisplay
            }
            if (['staff_id', 'vehicle_id', 'dept_id']) {
              detail += `${fieldLabel}:${fieldValue};` 
              detail = detail.slice(0, 256) // 避免字节长度超出导致添加录入数据库失败
            }
            if (j === 0) {
              keyValue = fieldValue
              tableKeyName = fieldName
              isAllKeyName = fieldName
            } else {
              sql += `,${fieldName}=${fieldValue}`
            }
          }
          sql += `,lastUpdate="${new Date().format('yyyy-MM-dd hh:mm:ss')}"`
          if (this.tableName === 'dat_staff_extend'){
            sql += `,user_id='${xdata.username}'`
          }
          sql = sql.replace(',', '')
          sql = `UPDATE ${this.tableName} SET ${sql} WHERE ${tableKeyName} = ${keyValue}`
          if (detail) keyValue= detail
          let req = composeUpdateDBReq('UPDATE', `update_${this.topicName}`, keyValue, sql)
          this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
            cmd: 'META-UPDATE-DB',
            data: req
          })
        }
        if (this.isAll) {
          let keyValueArr = svIDs.join(',')
          let changeNeeddisplaySql = null
          if (this.tableName === 'dat_staff_extend'){
            changeNeeddisplaySql = `UPDATE ${this.tableName} SET need_display = 1, user_id = '${xdata.username}' WHERE ${isAllKeyName} NOT IN (${keyValueArr})`
          } else {
            changeNeeddisplaySql = `UPDATE ${this.tableName} SET need_display = 1 WHERE ${isAllKeyName} NOT IN (${keyValueArr})`
          }
          let changeNeeddisplayReq = composeUpdateDBReq('UPDATE', this.topicName, detail, changeNeeddisplaySql)
          this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
            cmd: 'META-UPDATE-DB',
            data: changeNeeddisplayReq
          })
        }
      }
      evt.preventUpdate = true
    },

    // 设置button按钮不可用函数
    setButtonsDisabled (flag, type) {
      let foot = this.$el.querySelector('.dlg-foot')
      let buttons = foot.querySelectorAll('button')
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = flag
      }
      if (type) {
        this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
          cmd: 'PULL-IMPORT-FILE',
          data: {
            cmd: 'pull_msg',
            tablename: this.topicName
          }
        })
      }
    },

    // 格式化value值
    formatFieldValue (type, value, name) {
      let ret = null
      switch (type) {
        case 'SELECT':
          let isnum = !isNaN(value)
          if (/_id$/.test(name) && !isnum) {
            let tablename = name.replace('_id', '')
            let table = xdata.state.metaStore.data[tablename]
            let row = table && Array.from(table.values()).filter(item => item.name == value)[0]
            ret = row && +row[name]
          } else if(textTurnNumber.hasOwnProperty(this.topicName)){
            let hasTurnName = textTurnNumber[this.topicName][name]
            if (hasTurnName) return hasTurnName[value]
          }else {
            ret = +value
          }
          break
        case 'NUMBER':
          ret = +value
          break
        case 'DATETIME':
          ret = value ? `${new Date(value).format('yyyy-MM-dd hh:mm:ss')}` : ret
          break
        default:
          ret = value ? `"${value}"` : value
          break
      }
      return ret
    },
    checkSpell (text) {
      let msg = {
        value: 'notsave',
        tip: `检查${text}、请检查后导入！`
      }
      window.xdata.commit('metaStore/saveHintip', msg)
    },

    getAlarmID (row) {
      let def = this.def
      let fields = def.fields
      let fnames = fields.names
      let flabels = fields.labels
      let ftypes = fields.types
      let alarmObj = {}
      let checkNames = ['event_type_id', 'start_time']
      let id = null
      for (let j = 0; j < fnames.length; j++) {
          let fieldName = fnames[j]
          let fieldLabel = flabels[fnames.indexOf(fieldName)]
          let fieldValue = row[fieldLabel]
          if (!fieldValue && fieldValue !== 0) fieldValue = row[fieldName]
          fieldValue = this.formatFieldValue(ftypes[j], fieldValue, fieldName)
          if (checkNames.includes(fieldName) && !fieldValue && fieldValue !==0 ) return this.checkSpell(fieldLabel)
          alarmObj[fieldName] = fieldValue
      }
      let objTypeId = null
      let objId = alarmObj.event_type_id === 3 ? alarmObj.area_id : alarmObj.obj_id
      if (alarmObj.event_type_id === 3) {
        objTypeId = 2
      } else if (alarmObj.event_type_id === 6 || alarmObj.event_type_id === 33) {
        objTypeId = 4
      } else {
        objTypeId = 9
      }
      id = turnId(3,alarmObj.event_type_id,objTypeId,objId)
      return id.toString()
    },

    getFileData (msg, newlabels) {
      let fileData = []
      for (let i = 0; i < msg.length; i++) {
        let objValue = objKeySort(msg[i], newlabels)
        if(objValue) fileData.push(objValue)
      }
      return fileData
    }
  },
  updated () { 
    if(this.$store.state.stateStore.importFileMsg.showImportFile){
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
.dlg-body
    flex: auto
    font-size: $fontsize-s
    display: flex
    justify-content: center
    flex-flow: column
    height: 100%
    .ctrl-panel
        display: flex
        justify-content: space-between
        padding: 0 .5rem
        flex: 0 0 3rem
        background: #eee
        .condition-builder
            display: flex
            .condition
                display: flex
                justify-content: center
                margin-right: 1rem
                input
                    text-align: center
                    padding-left: .2rem
                    border-radius: 2px
                    height: 2rem
                    width: 10.5rem
                input[type="text"]
                    width: 7rem
                input[type="radio"]
                    width: 1.5rem
                input[type="datetime-local"]
                    width: 12rem
    .content-panel
        overflow-y: scroll
        overflow: hidden
        padding: 0px
        color: #666
        display: flex
        flex-flow: column
        .tdvehicle tr
            cursor: auto
            td:nth-child(2)
                cursor: pointer
.dlg-foot
    padding: .3rem 3.6rem
    flex: 0 0 2.6rem
    height: 2rem
    margin-top: .5rem
    border-top: 1px solid #e9e9e9
    display: flex
    justify-content: space-around
.file-dialog .dlg-foot
    justify-content: center
    button:nth-child(2), button:nth-child(3)
        margin-left: 1rem
.file-dialog
    min-width: 800px
    height: 600px
.file-dropbox
    display: flex
    justify-content: center
    align-items: center 
    flex: auto
    flex-flow: column nowrap
    border: 2px dashed #eeeeee
    overflow: scroll
    height: 100%
    margin: 1rem
    background: #fff
    div
     button
          border: 0px solid rgba(0, 0, 0, 0.1)
          &:hover
            background: #27ca41
    div, span
        display: block
        color: #AAA
        font-size: 2rem
    img
        max-width: 100%
        max-height: 100%
.csv-dropbox
    justify-content: flex-start
.fileinfo
    display: flex
    justify-content: center
    color: #999
    margin-bottom: 1rem
    span:nth-child(1)
        margin-right: 0.5rem
.choose-file
    margin-top: 1rem
    cursor: pointer
    color: #999
    font-size: 1rem !important
    text-decoration: underline
table
    margin: 0
    width: 100%
    text-align: center
    border-collapse: collapse
    font-size: 0.8rem
    tbody 
        background: #fff
    thead tr 
        height: 3.4rem
        color: #3f3f3f
        border-bottom: 1px solid #ccc
        th 
            padding: 0 2px
            &:nth-child(1) 
                padding-left: 14px; 
            &:nth-last-child(1) 
                padding-right: 14px; 
            span.handShape 
                cursor: pointer
    tfoot
        tr
            height: 3.4rem
            background: lighten(#09F, 30%)
            color: darken(#333, 80%)
    tbody tr
        height: 3.4rem
        color: #3f3f3f
        border-bottom: 1px solid #dedede
        opacity: 0.8
        cursor: pointer
        td
            padding: 0 2px
            max-width: 114px
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
            &:nth-child(1)
                padding-left: 14px
            &:nth-last-child(1)
                padding-right: 14px
                overflow: inherit
            &.abnormal
                color: #ff6057
            &.vehicle-check
                cursor: pointer
        .fontlf
          text-align: left
    tbody .vehicleType
        td:nth-child(7),td:nth-child(8),td:nth-child(9),td:nth-child(10),td:nth-child(11)
            display: none
        td:nth-child(12)
            width: 350px
            .pro
                width: 300px
                span
                    display: inline-block
                    float: left
                .use
                    background: #009fff
                .leisure
                    background: #efefef
                .malfunction
                    background: #ff5454
                .maintain
                    background: yellow
                .upkeep
                    background: green

    tbody tr, tfoot tr
        &:hover, &.active
            background: #e7e7e7
            color: #000
</style>
