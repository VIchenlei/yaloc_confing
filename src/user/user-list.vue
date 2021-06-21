<template>
  <ul>
    <li v-for="(list, index) in lists" :key="index" @click="showStep(index, $event)">
      <svg class="icon"><use :xlink:href="list.iconname"></use></svg>
      <span>{{list.label}}</span>
    </li>
  </ul>
</template>
<script>
export default {
  name: 'userList',
  data () {
    return {
      lists: [
        {iconname: '#icon-about', label: '版本信息', name: 'abouts'},
        {iconname: '#icon-metadata', label: '更新配置', name: 'pullMetadata'},
        {iconname: '#icon-lock', label: '修改密码', name: 'showPwdDialog'},
        {iconname: '#icon-poweroff', label: '退出系统', name: 'logout'}
      ]
    }
  },
  methods: {
    // 点击事件，根据name触发不同的执行函数
    showStep (index, evt) {
      let target = evt.target
      let name = this.lists[index].name
      switch (name) {
        case 'pullMetadata':
          this.pullMetadata()
          break
        case 'showPwdDialog':
          this.showPwdDialog()
          break
        case 'logout':
          this.logout()
          break
        case 'abouts':
          this.showAbouts()
          break
      }
    },
    // 显示拉取配置页面
    pullMetadata () {
      this.$store.commit('stateStore/changeShowIconTips', 'metadata')
    },
    // 显示修改密码页面
    showPwdDialog () {
      this.$store.commit('stateStore/changePwd')
    },
    // 退出登陆
    logout () {
      this.$store.dispatch('user/users', {
        cmd: 'LOGOUT'
      })
    },
    // 显示版本信息
    showAbouts () {
      this.$store.commit('stateStore/changeShowAbouts')
    }
  }
}
</script>
<style lang="sass" scoped>
  @import '../style/defs.sass'
  ul
    position: absolute
    @include flex-cloumn
    top: 2.6rem
    right: 0
    @include wh(6rem, 10rem)
    background: $gray-l
    z-index: 99
    li
      @include wh(100%, 2.5rem)
      @include flex-align-item
      color: $font-333
      font-size: $fontsize-m
      cursor: pointer
      &:hover
        background: $main-color
        .icon
          fill: $white
      .icon
        fill: $main-color
      span
        padding: 0 .5rem
</style>
