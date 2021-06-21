<template>
  <div class="page-body">
    <section id="sp_config" class="sub-page">
      <sideBar class="sidebar"></sideBar>
      <metaTable id="config-table" class="meta-canvas" :tableData="tableData"></metaTable>
    </section>
  </div>
</template>
<script>
import sideBar from '../../components/sideBar/side-bar'
import metaTable from './meta-table'
import reptQuery from '@/js/def/rept_query.js'
import {copySubRows, objfilter} from '@/js/utils/utils.js'
import {mapState} from 'vuex'
const MEATENAME = ['user', 'staff_extend', 'vehicle_extend', 'number_bars', 'user_tool', 'area']
import {edit_def} from '@/js/def/dialog_edit_def.js'
// const PAGE_SIZE = 10
export default {
  data () {
    return {
      tableData: null,
      tableName: 'virtual_path',
      searchQuery: reptQuery,
      total: -1,
      pageIndex: 0,
      sqlString: null,
      countSql: null,
      filterValue: null
    }
  },
  methods: {
    // 请求数据函数
    requestData(tableName){
      if(MEATENAME.includes(tableName)){
        this.filterValue = null
        this.dealMetaData(tableName)
      }else{
        this.dealSql(tableName)
      }
    },
    // 查询sql函数
    inquireDB (tableName) {
      this.$store.commit('stateStore/changeShowXhint',{
        showXhint: true,
        data: null
      })
      let message = {
        cmd: 'query',
        data: {
          name: tableName,
          sql: this.sqlString,
          pageSize: window.PAGE_SIZE ? window.PAGE_SIZE : 10,
          pageIndex: this.pageIndex,
          total: this.total,
          countSql: this.countSql
        }
      }
      console.log('reqMessage',message)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
        cmd: 'REPT-FETCH-DATA',  
        data:{
          data: message,
          cmd: 'REPT',
          def: this.searchQuery[tableName]
        }
      })
    },
    //处理查询sql函数
    dealSql (tableName) {
      let defs = this.searchQuery[tableName]
      let resultFields = this.searchQuery[tableName].fields.names
      let time = ''
      if (tableName === 'alarm_mange') {
        time = `and hed.cur_time between '${new Date(new Date().getTime() - 24 * 60 * 60 * 1000).format('yyyy-MM-dd')} 00:00:00' and '${new Date().format('yyyy-MM-dd hh:mm:ss')}'`
      } else if (tableName === 'rpt_att_staff') {
        time = `and ras.start_time >= '${new Date(new Date().getTime() - 24 * 60 * 60 * 1000).format('yyyy-MM-dd')} 00:00:00' and  ras.end_time <= '${new Date().format('yyyy-MM-dd hh:mm:ss')}'`
      } else if (['his_leader_arrange_2', 'his_leader_arrange_1'].includes(tableName)){
        if (window.xdata.roleID !== 1) {
          time = `and user_id = '${xdata.username}'`
        }
      }

      this.sqlString = defs.sqlTmpl.replace('{resultFields}', resultFields.join(',')).replace('{exprString}', time)
      this.countSql = defs.sqlTmpl.replace('{resultFields}', 'count(1) as total').replace('{exprString}', time)
      this.inquireDB(tableName)
    },
    //处理缓存数据函数
    dealMetaData (tableName) {
      if(tableName === this.tableName){
        let table = null
        if (tableName === 'number_bars') {
          table = {
            def: edit_def[tableName].def,
            rows: JSON.parse(window.localStorage.getItem('dataNumber'))
          }
        } else {
          let store = this.$store.state.metaStore
          let rows = store.data[this.tableName]
          let result = rows
          let value = this.filterValue
          if (value && Object.keys(value).length > 0) {
              result = objfilter(Array.from(rows.values()),value)
          } else {
              result = Array.from(result.values())
          }
          if (this.tableName === 'user_tool') {
            result = result.filter(item => !['dufeng'].includes(item.user_tool_id))
          }
          this.total = result ? result.length : 0
          result = copySubRows(result, this.pageIndex)
          table = {
            def: store.defs[tableName],
            rows: result,
            total: this.total,
            pageIndex: this.pageIndex
          }
        }
        this.tableData = table
      }
    }
  },
  mounted(){
    this.requestData(this.tableName)
  },
  beforeDestroy(){
    this.$store.commit('stateStore/changeShowXhint',{
      showXhint: false,
      data: null
    })
  },
  watch: {
    //监视tableName发生改变
    '$store.state.stateStore.metaTableMsg': {
      handler: function (result) {
        let tableName = result.tableName
        this.$store.commit('stateStore/changePageMsg', {
          tableName: null,
          pageIndex: null
        })
        this.total = -1
        this.pageIndex = 0
        // this.tableName = MEATENAME.includes(result) ? result :this.searchQuery[result].name
        // this.tableName = MEATENAME.includes(result) ? result : result
        this.tableName = tableName
        this.requestData(tableName)
      },
      deep: true
    },
    //监视sql查询结果
    '$store.state.socketStore.reptShowResult': {
      handler: function (result) {
        if (result.def.name === this.tableName) {
          this.total = result && result.total
          this.tableData = result
          this.$store.commit('stateStore/changeShowXhint',{
            showXhint: false,
            data: null
          })
        }
      },
      deep: true
    },
    //监视sql查询完毕
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        if (result.data.name === this.tableName) {
          if(!MEATENAME.includes(result.data.name)){
            this.inquireDB(result.data.name)
          }
        }
      },
      deep: true
    },
    //监视meta数据更新完毕
    '$store.state.metaStore.metaUpdateEnd': {
      handler: function (result) {
        if (result.name === this.tableName) {
          if(MEATENAME.includes(result.name)){
            this.dealMetaData(this.tableName)
          } 
        }
      },
      deep: true
    },
    //监视数据条目更改
    '$store.state.stateStore.isDataNumber': {
      handler: function (result) {
        this.dealMetaData('number_bars')
      },
      deep: true
    },
    //监视翻页信息
    '$store.state.stateStore.pageMsg': {
      handler: function (result) {
        if (result.tableName === this.tableName) {
          this.pageIndex = result.pageIndex
          if(MEATENAME.includes(result.tableName)){
            this.dealMetaData(result.tableName)
          }else{
            this.inquireDB(result.tableName)
          }
        }
      },
      deep: true
    },
    //监视sql查询信息
    '$store.state.stateStore.sqlMsg': {
      handler: function (result) {
        // 判断meta还是sql
        if (result.tableName === this.tableName) {
          this.total = -1
          this.pageIndex = 0
          this.sqlString = result.sqlString
          this.countSql = result.countSql
          this.inquireDB(result.tableName)
        }
      },
      deep: true
    },
    // 监视store查询信息
    '$store.state.stateStore.storeMsg': {
      handler: function (result) {
        if (result.tableName === this.tableName) {
          this.pageIndex = 0
          this.filterValue = result.filterValue
          this.dealMetaData(result.tableName)
        }
      },
      deep: true
    }
  },
  components: {
    sideBar,
    metaTable
  }
}
</script>
<style lang="sass" scoped>
  @import '../../style/defs.sass'
  .page-body
    @include wh(100%, 100%)
    position: relative
    flex: auto
    .sub-page
      position: absolute
      width: 100%
      height: 100%
      display: -webkit-box
      display: -ms-flexbox
      display: flex
      flex-flow: row nowrap
      align-items: stretch
      color: #141414
      .sidebar
        background: #f5f5f5
        flex: 0 0 170px
        order: -1
        background: linear-gradient(140deg, #7cf, #09f);
        overflow-y: auto
        overflow-x: hidden
        display: flex
        flex-flow: column nowrap
        padding-left: 18px
      .back-homepage 
        width: 3rem
        height: 1.5rem
        display: flex
        justify-content: center
        position: absolute
        left: 12.5rem
        top: 0.5rem
        border-radius: 3px
        background: linear-gradient(#def, #09f)
        cursor: pointer
        align-items: center
        img
          width: auto
          height: 1rem
      .homepage
        display: flex
        overflow-y: scroll
        width: 103%
        height: 100%
      .meta-canvas
        flex: auto
        overflow-y: scroll
        background: #fff
        display: flex
        flex-flow: column nowrap
</style>
