
import {TOPIC, TopicDef} from '../def/topic_def.js'
export default {
  namespaced: true,
  state: {
    dialogEditMsg: {
      showDialogEdit: false,
      dialogName: null,
      controlName: null,
      row: null
    },
    alarmDialogMsg: {
      showAlarmDialog: false,
      dialogName: null,
      controlName: null,
      row: null
    },
    dialogPathMsg: {
      showDialogPath: false,
      dialogName: null,
      controlName: null,
      row: null
    },
    showPathManage: false,
    showMonitorMsg: {
      showMonitor: false,
      handName: null
    },
    showIconTips: false,
    iconTipsMsg: {
      name: null
    },
    showPwd: false, // password page
    showMenu: true,
    showHint: false,
    showPathHint: false,
    deleteAllHintMsg:{
      showDeleteAllHint: false,
      msg: {
        data: null,
        selectDatas: null
      }
    },
    showXhint: false,
    UpdatePathMsg:{
      showUpdatePath: false,
      tableName: null,
      data: null
    },
    UpdateOldPathMsg:{
      showUpdateOldPath: false,
      tableName: null,
      data: null
    },
    XHintData: null,
    checkAll: false,
    checkStatus: false,
    pwdHint: '', // password tips
    metaTableMsg:{
      initMetaTable: false,
      tableName: 'virtual_path',
    },
    pageMsg: {
      isPage: false,
      pageIndex: null,
      tableName: null
    },
    xhintState: false,
    showAbouts: false,
    topicName: null, // 顶部跳转name
    fileUploadMore: null, // 上传文件夹
    sqlMsg:{
      isSearchSql: false,
      sqlString: null,
      countSql: null,
      tableName: null
    },
    storeMsg: {
      tableName: null,
      filterValue: null
    },
    isPreview: false,
    initRecompose: false,
    saveDB: false,
    importFileMsg: {
      showImportFile: false,
      data: null
    },
    historyPath: {
      data: null
    },
    isDataNumber: false,
    alarmCheckAllStatus: false,
    hintChangeTime: {
      isShow: false,
      toChange: false
    },
    hintChangeReader: {
      isShow: false,
      toChange: false
    },

  },
  mutations: {
    changeShowIconTips (state, msg) {
      state.iconTipsMsg.name = msg
      state.showIconTips = !state.showIconTips
    },
    changeShowHint (state, msg) {
      state.showHint = !state.showHint
      state.checkStatus = msg && msg.checkStatus
    },
    changeShowPathHint (state,msg) {
      state.showPathHint = msg
    },
    changeShowDeleteAllHint (state, msg) {
      state.deleteAllHintMsg.showDeleteAllHint = msg.showDeleteAllHint
      state.deleteAllHintMsg.msg.data = msg.msg && msg.msg.data
      state.deleteAllHintMsg.msg.selectDatas = msg.msg && msg.msg.selectDatas
    },
    changeShowXhint (state,msg){
      state.showXhint = msg.showXhint
      state.XHintData = msg && msg.data
    },
    changePwd (state, msg) {
      state.showPwd = !state.showPwd
    },
    changeTableName (state, msg) {
      state.metaTableMsg.initMetaTable = !state.metaTableMsg.initMetaTable
      state.metaTableMsg.tableName = msg && msg.tableName
    },
    changeDialogEdit (state, msg) {
      state.dialogEditMsg.showDialogEdit = msg && msg.type
      state.dialogEditMsg.dialogName = msg && msg.name
      state.dialogEditMsg.controlName = msg && msg.controlName
      state.dialogEditMsg.row = msg && msg.row
    },
    changeAlarmDialog(state, msg){
      state.alarmDialogMsg.showAlarmDialog = msg && msg.type
      state.alarmDialogMsg.dialogName = msg && msg.name
      state.alarmDialogMsg.controlName = msg && msg.controlName
      state.alarmDialogMsg.row = msg && msg.row
    },
    changeBindPath (state, msg) {
      state.dialogPathMsg.showDialogPath = msg && msg.type
      state.dialogPathMsg.dialogName = msg && msg.name
      state.dialogPathMsg.controlName = msg && msg.controlName
      state.dialogPathMsg.row = msg && msg.row
    },
    changeShowPathManage (state) {
      state.showPathManage = !state.showPathManage
    },
    changeShowMonitor (state, msg) {
      state.showMonitorMsg.showMonitor = msg && msg.showMonitor
      state.showMonitorMsg.handName = msg && msg.handName
    },
    changeUpdatePath (state, msg) {
      state.UpdatePathMsg.showUpdatePath = msg && msg.showUpdatePath
      state.UpdatePathMsg.tableName = msg && msg.tableName
      state.UpdatePathMsg.data = msg && msg.data
    },
    changeUpdateOldPath (state, msg) {
      state.UpdateOldPathMsg.showUpdateOldPath = msg && msg.showUpdateOldPath
      state.UpdateOldPathMsg.tableName = msg && msg.tableName
      state.UpdateOldPathMsg.data = msg && msg.data
    },
    changePageMsg (state, msg) {
      state.pageMsg.isPage = !state.pageMsg.isPage
      state.pageMsg.pageIndex = msg.pageIndex,
      state.pageMsg.tableName = msg.tableName
    },
    changeXhintState (state, msg) {
      state.xhintState = msg
    },
    changeShowAbouts (state) {
      state.showAbouts = !state.showAbouts
    },
    changeTopicName (state, name) {
      state.topicName = name
    },
    changeFileUploadMore (state, data) {
      state.fileUploadMore = data
    },
    changeSearchSql (state, msg) {
      state.sqlMsg.isSearchSql = !state.sqlMsg.isSearchSql
      state.sqlMsg.sqlString = msg.sqlString
      state.sqlMsg.countSql = msg.countSql
      state.sqlMsg.tableName = msg.tableName
    },
    changeStoreMsg (state,msg) {
      state.storeMsg.tableName = msg.tableName
      state.storeMsg.filterValue = msg.filterValue
    },
    changeIsPreview (state,msg) {
      state.isPreview = msg
    },
    chaneInitRecompose (state) {
      state.initRecompose = !state.initRecompose
    },
    changeSaveDB (state) {
      state.saveDB = !state.saveDB
    },
    changeImportFileMsg (state, msg) {
      state.importFileMsg.showImportFile = msg.showImportFile
      state.importFileMsg.data = msg.data
    },
    changeHistoryPath (state, msg) {
      state.historyPath.data = msg && msg.data
    },
    changeIsDataNumber (state) {
      state.isDataNumber = !state.isDataNumber
    },
    changeAlarmCheckAllStatus (state, msg) {
      state.alarmCheckAllStatus = msg
    },
    changeHintChangeTime (state, msg) {
      state.hintChangeTime.isShow = !state.hintChangeTime.isShow,
      state.hintChangeTime.toChange = msg.toChange
    },
    changeHintChangeReader (state, msg) {
      state.hintChangeReader.isShow = !state.hintChangeReader.isShow,
      state.hintChangeReader.toChange = msg.toChange
    }
  }
}
