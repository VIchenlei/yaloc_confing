<template>
  <select v-model="selectedOption">
    <option v-for="(item,index) in items" :key="index" :value="item.value">{{item.name}}</option>
  </select>
</template>
<script>
export default {
  props: ['metaMsg', 'name'],
  data () {
    return {
      msg: this.metaMsg,
      tableName: this.name,
      selectedOption:'所有',
      items: null
    }
  },
  methods: {
    // 获取数据函数
    getItems () {
      let dealname = this.msg.name.indexOf('_id') === -1 ? this.msg.name : this.msg.name.split('_id')[0]
      if(dealname === 'obj'){
        dealname = 'staff'
      }
      let datas = this.$store.state.metaStore.dataInArray.get(dealname)
      let key = this.msg.name ==='obj_id' ? 'staff_id' : `${this.msg.name}`
      let items = null
      if(this.tableName === 'his_location_staff_'){
        items = []
      }else{
        items = [{
          name: '所有',
          value: 'all'
        }]
      }
      for (let rec of datas) {
        let name = rec.name
        items.push({
          name: name,
          value: rec[key]
        })
      }
      return items
    }
  },
  mounted () {
    this.items = this.getItems()
    this.selectedOption = this.items[0].value
  },
  watch: {
    metaMsg (newValue, oldValue) {
      this.msg = newValue
      this.items = this.getItems()
      this.selectedOption = this.items[0].value
    },

    '$store.state.metaStore.metaUpdateEnd': {
      handler: function (result) {
        this.items = this.getItems()
      },
      deep: true
    }
  }
}
</script>
