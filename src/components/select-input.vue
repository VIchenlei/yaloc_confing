<template>
  <select :name="selectname" @change="sendChooseItem">
    <option v-for="list in lists" :key="list.index" :value="list.value" :selected="list.value === oldvalue">{{ getSelectValue(list) }}</option>
  </select>
</template>
<script>
import {clone} from '../js/utils/utils.js'
import numberTurnText from '@/js/def/number_turn_text.js'
export default {
  
  props: ['name', 'oldvalue', 'topicname', 'rowIndex',],
  data () {
    return {
      selectname: this.name,
      tableName: this.topicname,
      lists: null,
      selectSpecialList: ['valid']
    }
  },
  mounted () {
    this.init()
  },
  watch: {
    'name':{
      handler: function (val, oldVal) {
        this.selectname = val
        this.init()
      }
    }
  },
  methods: {
    // 初始化数据函数
    init(){
      let name =this.selectname.indexOf('.') === -1 ? this.selectname : this.selectname.split('.')[1]
      let dealname = name.indexOf('_id') === -1 ? name : name.split('_id')[0]
      let items = []
      if (['dept_id', 'obj_id'].includes(this.selectname)) {
        items = [{
          name: '所有',
          value: this.selectname === 'dept_id' ? 0 : ''
        }]
      }

      if(numberTurnText.hasOwnProperty(this.tableName) && numberTurnText[this.tableName][name]){
        let hasTurnName = numberTurnText[this.tableName][name]
        items = []
        if (hasTurnName) {
          for (let rec in hasTurnName) {
            items.push({
              name: hasTurnName[rec],
              value: Number(rec)
            })
          }
        }
        this.lists = items
      }else{
        let datas = xdata.state.metaStore.dataInArray && xdata.state.metaStore.dataInArray.get(dealname) && Array.from(xdata.state.metaStore.dataInArray.get(dealname))
        if (dealname === 'obj') {
          name = 'staff_id'
          datas = Array.from(xdata.state.metaStore.dataInArray.get('staff'))
        } else if (dealname === 'event_type') {
          datas = datas.filter(item => [3,6,12,13,15,24,33,40].includes(item.event_type_id))
        }
        if (datas) {
          for (let data of datas) {
            let item = null
            if (name === 'card_id') {
              item = {
                name: data.card_id,
                value: data[name] ? data[name] : ''
              }
            } else if (this.selectname === 'role_id') {
              let roles = [1, 2, 5]
              if (roles.includes(data[name])) {
                item = {
                  name: data.name,
                  value: (data[name] || data[name] == 0) ? data[name] : ''
                }
              }
            } else{
              item = {
                name: data.name,
                value: (data[name] || data[name] == 0) ? data[name] : ''
              }
            }
            item && items.push(item)
          }
          this.lists = items
        }
      }
    },
    // 选中函数
    sendChooseItem (evt) {
      let value = evt.target.value
      this.$emit('chooseItem', [value, this.name, this.rowIndex])
    },
    getSelectValue (list) {
      let selectValue = list.name 
      if (this.tableName ==='rpt_att_staff' && this.selectname !== 'control') {
        selectValue = list.value + '-' + list.name
      }
      if (['his_leader_arrange_2', 'his_leader_arrange_1'].includes(this.tableName) && this.selectname === 'virtual_path_id') {
        selectValue = list.value + '  ' + list.name
      }
      return selectValue
    }
  }
}
</script>
