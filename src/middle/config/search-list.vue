<template>
  <div class="alarm-search">
    <!-- <fuzzy-search v-if="!defs.exprFields" ref="fuzzy-search" :opts="getFuzzySearch()" class="search"></fuzzy-search> -->
    <div v-for="def in defs.exprFields" :key="def.index" class="search-input">
      <span>{{def.label}}：</span>
      <fuzzy-search v-if="def.type === 'SELECT'" :ref="def.name" :isInit="isInit" :opts="getFuzzySearch(def.name)"></fuzzy-search>
      <input :ref="def.fieldname" v-else :type="getInputType(def.type)" :value="getDefaultValue(def)">
    </div>
    <button @click="search">查询</button>
  </div>
</template>
<script>
import metaSelect from '@/components/meta-select'
import fuzzySearch from '@/components/fuzzy-search'
import FUZZYSEARCHDEF from '@/js/def/fuzzy_search_def.js'
const MEATENAME = ['user', 'staff_extend', 'vehicle_extend', 'area', 'user_tool']
export default {
  props: ['def'],
  components: {
    metaSelect,
    fuzzySearch
  },
  data () {
    return {
      defs: this.def,
      tableName: this.def.name,
      sqlString: null,
      countSql: null,
      name: null,
      isInit: false,
      searchDatas: null
    }
  },
  beforeMount () {
    // this.getFuzzySearch()
  },
  mounted () {
    this.setDefalutTime()
  },
  methods: {
    // 根据字段type 返回input type
    getInputType (type) {
      if (type === 'DATETIME') return 'datetime-local'
      if (type === 'DATE') return 'date'
    },
    // 根据def显示默认值
    getDefaultValue (def) {
      let type = def.type
      let fieldname = def.fieldname
      if (type === 'DATE') {
        if (fieldname === 'start_time') return new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).format('yyyy-MM-dd')
        if (fieldname === 'end_time') return new Date().format('yyyy-MM-dd')
      } else if (type === 'DATETIME') {
        if (fieldname === 'start_time') return new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).format('yyyy-MM-ddThh:mm:ss')
        if (fieldname === 'end_time') return new Date().format('yyyy-MM-ddThh:mm:ss')
      }
    },
    // 前端缓存数据查询函数
    searchStore () {
      let filterValue = {}
      for (let i = 0; i < this.defs.exprFields.length; i++) {
        let def = this.defs.exprFields[i]
        let name = def.name
        let fuzzysearch = this.$refs[name][0].$el
        let value = fuzzysearch.querySelector('#searchinput').value
        let ident = name.indexOf('.') === -1 ? name : name.split('.')[1]
        if (ident === 'dept_id_ck') ident = 'dept_id'
        if (value && fuzzysearch.querySelector('#searchinput').getAttribute('data-type')) {
          let searchDatas = this.$refs[name][0].dealResult
          let resultArr=[]
          for(let j=0,leng=searchDatas.length;j<leng;j++){
            let value = searchDatas[j][ident]
            resultArr.push(value)
          }
          filterValue[name] = resultArr
        }
      }
      this.$store.commit('stateStore/changeStoreMsg',{
        tableName: this.tableName,
        filterValue: filterValue
      })
    },
    // 查询函数
    search () {
      let str = ''
      if (MEATENAME.includes(this.tableName)) {
        this.searchStore()
        return
      }
      for (let i = 0; i < this.defs.exprFields.length; i++) {
        let def = this.defs.exprFields[i]
        let name = def.name
        let type = def.type
        let ident = name.indexOf('.') === -1 ? name : name.split('.')[1]
        let fieldValue = null
        if (type === 'SELECT') {
          let value = this.$refs[name][0].$el.querySelector('#searchinput').value
          if (value && this.searchDatas && this.searchDatas.length>0) {
            for(let j=0,leng=this.searchDatas.length;j<leng;j++){
              let concatstr = this.searchDatas.length > 1 ? ' and (' : ' and '
              let keyValue = name === 'user_id' ? `"${this.searchDatas[j][ident]}"` : this.searchDatas[j][ident]
              j === 0 ? str += concatstr + name + '=' + keyValue :  str += ' or '+ name + '=' + keyValue 
            }
            str += this.searchDatas.length > 1 ? ')' : ''
          }
        } else if (type === 'DATETIME' || type === 'DATE') {
          if (def.fieldname === 'start_time') {
            fieldValue = this.$refs[def.fieldname][0].value
            str += ` and ${def.name} >= '${fieldValue}'`
          } else if (def.fieldname === 'end_time') {
            fieldValue = this.$refs[def.fieldname][0].value
            str += ` and ${def.name} <= '${fieldValue}'`
          }
        }
      }

      if (this.tableName === 'his_leader_arrange_1' && window.xdata.roleID !== 1) {
        str = str + ` and user_id = '${xdata.username}'`
      }
      this.sqlString = this.defs.sqlTmpl.replace('{resultFields}', this.defs.fields.names.join(',')).replace('{exprString}', str)
      this.countSql = this.defs.sqlTmpl.replace('{resultFields}', 'count(1) as total').replace('{exprString}', str)
      this.$store.commit('stateStore/changeSearchSql',{
        tableName: this.tableName,
        sqlString: this.sqlString,
        countSql: this.countSql
        
      })
    },
    // 设置默认时间函数
    setDefalutTime () {
      if(this.$refs['end_time'] || this.$refs['start_time']){
        this.$refs['end_time'][0].value = new Date().format('yyyy-MM-ddThh:mm:ss')
        this.$refs['start_time'][0].value = this.tableName === 'his_location_staff_' ? new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).format('yyyy-MM-ddThh:mm:ss') : new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).format('yyyy-MM-ddThh:mm:ss')
      }
    },
    // 模糊查询函数
    getFuzzySearch (name) {
      // let name = this.defs.name
      if (name === 'dept_id_ck') {
        name = 'dept_ck'
      } else {
        name = name.split('_id')[0]
      }
      if (!xdata) return
      let datas = xdata.state.metaStore.data[name] && Array.from(xdata.state.metaStore.data[name].values())
      if (name === 'staff_extend' || name === 'vehicle_extend') datas = Array.from(xdata.state.metaStore[`${name.split('_')[0]}s`].values())
      if (name === 'ras.staff') datas = Array.from(xdata.state.metaStore.staffs.values())
      if (name == 'event_type') datas = datas.filter(item => [3,6,12,13,15,24,33,40].includes(item.event_type_id))
      if (name == 'user_tool') datas = datas.filter(item => !['dufeng'].includes(item.user_tool_id))
      let typeDef = {
        name: FUZZYSEARCHDEF[name].name,
        label: FUZZYSEARCHDEF[name].label,
        placeholder: FUZZYSEARCHDEF[name].placeholder,
        cb: this.getResult 
      }
      let dataSet = {
        desc: FUZZYSEARCHDEF[name].desc,  
        keys: FUZZYSEARCHDEF[name].keys,  
        data: datas,
        isSpecial: name === 'ras.staff' ? true : false
      }
      let fuzzysearch = {flag:'searchList', typeDef: typeDef, dataSet: dataSet}
      return fuzzysearch
    },
    // 模糊查询结果接收函数
    getResult (result,dataSet) {
      this.searchDatas = result
    }
  },
  watch: {
    'def': {
      immediate:true,
      handler: function (result) {
          this.defs = result
          this.tableName = result && result.name
          this.sqlString = null
      },
      deep: true
    },
    '$store.state.stateStore.metaTableMsg': {
      handler: function (result) {
        if(result.tableName === this.tableName){
          this.$store.commit('stateStore/changeSearchSql',{
            tableName: null,
            sqlString: null,
            countSql: null,
            searchDatas: null
          })
          this.isInit = !this.isInit
        }
      },
      deep: true
    }
  }
}
</script>
<style lang="sass" scoped>
.alarm-search
  display: flex
  margin-top: 1rem
  .search
    max-width: 14rem
  div
    margin: 0 1rem
    width: 18rem
  .search-input
    align-items: center
    display: flex
</style>
