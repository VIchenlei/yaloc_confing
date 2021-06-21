<template>
  <div class="head">
    <img src="../assets/luanlogo.png" alt="">
    <main-nav :nav="nav"></main-nav>
    <user-bar></user-bar>
  </div>
</template>
<script>
import mainNav from './main-nav'
import mainMenu from './js/main-menu.js'
import userBar from '../user/user-bar'
export default {
  components: {
    mainNav,
    userBar
  },
  data () {
    return {
      nav: mainMenu
    }
  }
}
</script>
<style lang="sass">
  @import '../style/defs.sass'
  .head
    @include flex-column-center
    flex: 0 0 2.6rem
    color: $white
    background-image: linear-gradient(30deg, #7cf, #09f)
    img
      @include wh(auto, 1.8rem)
      margin-left: 1rem
</style>
