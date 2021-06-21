<template>
<div class="user-bar">
  <span class="usertitle">
    <svg class="icon user-icon">
      <use id="MenuButton" xlink:href="#icon-user-person"></use>
    </svg>
    <span>{{ username }}</span>
  </span>
  <user-list class="user-list"></user-list>
</div>
</template>
<script>
import {mapState} from 'vuex'
import userList from './user-list'
export default {
  name: 'userBar',
  data () {
    return {
    }
  },
  computed: {
    ...mapState({
      username: state => state.user.username
    })
  },
  methods: {
  },
  components: {
    'user-list': userList
  }
}
</script>
<style lang="sass" scoped>
  @import '../style/defs.sass'
  .user-bar
    flex: 0 0 4rem
    padding: 0 1rem
    position: relative
    @include flex-space-between
    align-items: center
    height: 100%
    &:hover
      .user-list
        display: flex
    .usertitle
      width: 100%
      cursor: pointer
      .icon
        vertical-align: text-bottom
    .user-list
        display: none
</style>
