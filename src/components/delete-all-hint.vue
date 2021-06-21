<template>
  <div class="dlg-window" v-if="isShow">
    <div class="dlg-bg">
      <img src="../assets/alarm.png" alt="">
      <p class="tips">
        <span>您确认删除所选信息吗？</span>
        <span>提示：数据删除后将无法恢复！</span>
      </p>
      <div class="btns">
        <button class="sure" @click="makesure">确定</button>
        <button class="cancel" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>
<script>
import {mapState} from 'vuex'
import {metaUpdateRes,composeUpdateDBReq} from '@/js/utils/utils'
import { getNameByID } from '@/js/utils/metaStoreDep.js'
export default {
  data () {
    return {
      rows: null,
      topicName: null,
      cmd: null,
      querySql: null
    }
  },
  computed: {
    ...mapState({
      isShow: state => state.stateStore.deleteAllHintMsg.showDeleteAllHint,
    })
  },
  watch: {
    '$store.state.metaStore.metaUpdateDBres': {
      handler: function (result) {
        if(result.data.name === 'alarm_mange' || result.data.name === 'his_leader_arrange_2'){
          let updateRes = metaUpdateRes(result, result.data.name, this.cmd)
          if (updateRes) this.close()
        }
      },
      deep: true
    },
    '$store.state.stateStore.deleteAllHintMsg': {
      handler: function (result) {
        if (result.showDeleteAllHint) {
          let msg = result.msg
          this.rows = msg.data
          this.topicName = 'alarm_mange'
          this.cmd = 'DELETE'
          this.selectDatas = msg.selectDatas
        } else {
          this.topicName = null
          this.cmd = null
        }
      },
      deep: true
    }
  },
  methods: {
    deleteAllSql () {
      this.$store.commit('stateStore/changeShowXhint', {
        showXhint: true,
        data: null
      })
      /**
       *  querySql: sql筛选条件
       *  isSelectAll： 判断是否是全选
       *  notChecked： 没有选中的数据
       *  selectInputs： 选中的数据
       *  逻辑 先判断是否没有选中的数据  有的话就加上
       *  是否是全选 是的话 就加上没有全选条件 不是的话 就直接使用选中的*/ 
      let sql = null,noticeServer = [],detail = ''
      let selectDatas = this.selectDatas
      let selectInputs = selectDatas.selectInputs
      if (selectInputs.size <= 0) return
      let notSelect = selectDatas.notChecked
      let selectAll = selectDatas.isSelectAll
      let querySql = this.getQuerySql(selectDatas.querySql, selectDatas.tableName)
      let selectObj = this.getSelectSql(selectAll, notSelect, selectInputs, selectDatas.tableName)
      let selectSql = selectObj.sql
      noticeServer = selectObj.eventIds
      let keyEventId = noticeServer[0] ? noticeServer[0] : ''
      sql = `DELETE FROM ${selectDatas.tableName === 'alarm_mange' ? 'his_event_data' : 'his_leader_arrange'} where ${querySql}${selectSql};`
      // console.log(sql)
      let datas = Array.from(selectInputs.values())
      if (datas && datas.length > 0) {
        for (let i = 0; i < datas.length; i++) {
          const data = datas[i].row
          if (selectDatas.tableName === 'alarm_mange') {
            const eventTypeName = getNameByID('event_type_id', data.event_type_id, window.xdata)
            detail += `告警主体:${data.obj_id};告警类型:${eventTypeName};`
          }
          detail = detail.slice(0, 256) // 避免字节长度超出导致添加录入数据库失败
        }
      }
      let req = composeUpdateDBReq('DELETE', selectDatas.tableName, detail, sql)
      req.data['notice'] = noticeServer
      console.log('打印req',req)
      this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
          cmd: 'META-UPDATE-DB',
          data: req
      })
    },
    // 获取批量删除详细id+名称
    getDeleteAllDetail () {

    },
    close () {
      this.$store.commit('stateStore/changeShowDeleteAllHint',{showDeleteAllHint: false, msg: null})
    },
    makesure(){
      this.deleteAllSql()
    },
    getQuerySql (querySql, tableName) {
      if (querySql) {
        querySql = querySql.split('where 1=1  and ')[1]
        querySql = querySql.split('order by')[0]
        querySql = querySql.replace(/hed./g, '')
      } else {
        if (tableName === 'alarm_mange') {
          querySql = `date(cur_time) >= '${new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).format('yyyy-MM-dd')}' and date(cur_time) <= '${new Date().format('yyyy-MM-dd')}'`
        } else {
          let roleSql = window.xdata.roleID !== 1 ? ` and user_id = '${xdata.username}'` : ''
          querySql = `concat(duty_date,' ',begin_time) < now()${roleSql}`
        }
      }
      return querySql
    },
    getSelectSql (selectAll, notSelect, selectInputs, tableName) {
      let notSelectDatas = Array.from(notSelect.values())
      let notSelectIds = [], notSelectTimes = [], notSelectShiftIds = []
      let notSelectCondition = ''
      if (notSelectDatas && notSelectDatas.length > 0) {
        notSelectDatas.forEach(item => {
          let row = item.row
          let Ids = tableName === 'alarm_mange' ? row.id.split('+')[1] : row.staff_id
          let times = tableName === 'alarm_mange' ? `'${row.start_time}'` : `'${row.duty_date}'`
          notSelectIds.push(Ids)
          notSelectTimes.push(times)
          if (row.end_time && tableName === 'alarm_mange') {
            notSelectTimes.push(`'${row.end_time}'`)
          }
          tableName === 'his_leader_arrange_2' ? notSelectShiftIds.push(row.shift_id) : ''
        });
        if (tableName === 'alarm_mange') {
          notSelectCondition = ` and (id not in (${notSelectIds.join(',')}) or (id in (${notSelectIds.join(',')}) and date_format(cur_time,"%Y-%m-%d %H:%i:%s") not in (${notSelectTimes.join(',')})))`
        } else {
          notSelectCondition = ` and (staff_id not in (${notSelectIds.join(',')}) or (staff_id in (${notSelectIds.join(',')}) and shift_id not in (${notSelectShiftIds.join(',')})) or (staff_id in (${notSelectIds.join(',')}) and shift_id in (${notSelectShiftIds.join(',')}) and date_format(duty_date, "%Y-%m-%d") not in (${notSelectTimes.join(',')})))`
        }
      }
      

      let selectDatas = Array.from(selectInputs.values())
      let ids = [], stats = [], eventTypeIds = [], objTypeIds = [], times = [], eventIds = []
      selectDatas.forEach(item => {
        let row = item.row
        ids.push(tableName === 'alarm_mange' ? row.id.split('+')[1] : row.staff_id)
        eventIds.push(tableName === 'alarm_mange' ? row.event_id : row.shift_id)
        stats.push(row.stat)
        eventTypeIds.push(row.event_type_id)
        objTypeIds.push(row.obj_type_id)
        times.push(tableName === 'alarm_mange' ? `'${row.start_time}'` : `'${row.duty_date}'`)
        row.end_time ? times.push(`'${row.end_time}'`) : ''
      });
      let selectSql = null
      if (tableName === 'alarm_mange') {
        selectSql = ` and id in (${ids.join(',')})  and event_type_id in (${eventTypeIds.join(',')}) and date_format(cur_time,"%Y-%m-%d %H:%i:%s") in (${times.join(',')})`
      } else {
        selectSql = ` and staff_id in (${ids.join(',')})  and shift_id in (${eventIds.join(',')}) and date_format(duty_date, "%Y-%m-%d") in (${times.join(',')})`
      }
      let condition = selectAll ? notSelectCondition : selectSql
      return {
        sql: condition,
        eventIds: eventIds
      }
    }
  },
  components: {
    
  }
}
</script>
<style lang="sass" scoped>
@import '../style/defs.sass'
.dlg-bg
  max-height: 40rem
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
  @include wh(100%, 4rem)
  padding: 0 1rem
span
  width: auto
select, input
  height: 1.5rem
.btns
  display: flex
  justify-content: space-around
  margin: 1rem
.tips
  color: red
  flex-direction: column
img
  height: 10rem
</style>
