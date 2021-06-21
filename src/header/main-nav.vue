<template>
  <ul>
    <li v-for="(item,index) in list" v-if="isShow(item)"  :key="index" :id="item.id" :ref="item.name" :name="item.name" :class = "{ active: active === index }" @click="changeTitle(index,item.name,item.routerPath)"> 
      <router-link v-if="item.routerPath" :to="item.routerPath">
        {{item.label}}
      </router-link>
      <span v-else>{{item.label}}</span>
    </li>
  </ul>
</template>
<script>
export default {
  name: 'mainNav',
  props: ['nav'],
  data () {
    return {
      list: this.nav,
      active: 0
    }
  },
  methods: {
    changeTitle: function (index, opName, routerPath) {
      if(routerPath){
        this.active = index
        this.$store.commit('stateStore/changeTopicName', opName)
      }else{
        this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: opName})
      }
    },
    isShow (item) {
      let roleID = window.xdata && window.xdata.roleID
      let show = roleID === 1 || roleID === 2 ? true : item.show
      return show
    }
  }
}
</script>
<style lang="sass">
  ul
    display: flex
    margin-left: 5rem
    flex: 1
    height: 100%
    li
      // width: 3rem
      margin-left: 1rem
      cursor: pointer
      text-align: center
      line-height: 2.6rem
      height: 100%
      margin: 0 .5rem
      &.active
        border-top: 2px solid #fff
      a
        text-decoration: none
        color: white
        display: inline-block
        width: 100%
        height: 100%
</style>

