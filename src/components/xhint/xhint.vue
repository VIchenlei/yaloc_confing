<template>
<div class="dlg-window hide">
  <div class="xhint-dialog loading-page">
    <div id="hold"></div>
    <svg class="tips-icon {l.rotate ? 'loading-icon' : ''} {l.class ? l.class : ''}" v-if="!l.progress && !l.rotate">
      <use xlink:href="/icons/icons.svg#{l.icon}"></use>
    </svg>
    <loading v-if="!l.progress && l.rotate"></loading>
    <p class="xhint-tips loading-text">
        <span>{{ l.tips }}</span>
    </p>
    <p class="xhint-hint" v-if="l.hint"> {{ l.hint }} </p>
    <div class="progressbox" v-if="l.progress">
      <div class="progressbar" id="progressBar" ref="progressBar"></div>
    </div>
    <button class="xhint-button" @click="terminate">{{ l.btn }}</button>
  </div>
</div>
</template>
<script>
import loading from './loading'
const DEFAULT_MSG = {
  icon: 'icon-spinner',  // 图片，默认是加载图片
  class: '',  // 图标填充 class，默认为空
  rotate: true,  // 是否旋转图标，比如：loading 时，需要旋转
  tips: '系统正在加载，请稍候...',  // 提示信息
  hint: null,  // 提示说明
  btn: '取消',
  cb: null     // 中断提示（用户主动关闭）时的回调函数
}
const NUM = 7,ANG = 360/NUM,RAD = NUM*5
export default {
  name: 'xhint',
  components: {
    loading
  },
  data () {
    return {
      l: DEFAULT_MSG
    }
  },
  methods: {
    showLoading (msg) {
      this.l = {
        icon: msg && msg.name ? '' : 'icon-spinner',  // 图片，默认是加载图片
        rotate: msg && msg.name ? false : true,
        tips: msg && msg.information ? msg.information : '系统正在加载中，请稍候...',
        btn: '取消',
        progress: msg && msg.name ? true : false
      }
      this.show()
      // if (this.l.progress) {
      //   this.$el.querySelector('#progressBar').style.width = '0%'
      //   this.progressBar()
      // }
    },
    showHint (msg, hint) {
      this.l = {
        icon: 'icon-warning',
        class: 'xhint-icon-warn',
        rotate: false,
        tips: msg,
        hint: hint,
        btn: '关闭'
      }
      this.show()
    },
    show () {
      this.$el.classList.remove('hide')
      // this.update()
    },
    close () {
      this.$el.classList.add('hide')
    },
    terminate () {
      this.close()
      this.cb && this.cb()
    }
  },
  watch: {
    '$store.state.stateStore.xhintState': {
      handler: function (result) {
        result ? this.showLoading() : this.close()
      }
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../../style/defs.sass'

.xhint-dialog
    @include align-middle
    background: #f5f5f5
    padding: 2rem
    flex-flow: column
    border-radius: 2px
    font-size: $fontsize-m
    box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.4)

    @media screen and (max-width: $width-medium)
        width: 100% 
        max-width: 40rem
        left: 0 rem
        top: 30%

    .tips-icon
        @include wh(3rem,3rem)
        margin: 1rem
    .xhint-icon-warn
        fill: $color-warn
        transform: rotate(180deg)
    .xhint-tips
        font-size: $fontsize-m
        padding-top: 1rem
    .loading-text
        @include align-middle-between
        .tips-icon
            @include wh(2rem,2rem)
            margin: 0
    .xhint-hint
        font-size: $fontsize-s
        color: $body-ft-light
        padding-top: 1rem

    .xhint-button
        width: 6rem
        margin-top: 2rem
    #hold
        @include absolute-left(50%,50%)
        animation: spin 10s linear infinite
    .dot
        @include wh(20px,20px)
        border-radius: 100%
        position: absolute
        opacity: 0
        transform-origin: 0% 0%
    @keyframes spin 
        from 
            transform: rotate(360deg)
        to 
            transform: rotate(0deg)
    @keyframes osc 
        0%
            transform: scale(0.5)
            opacity: 0
        50% 
            transform: scale(1.5)
            opacity: 1
        100% 
            transform: scale(0.5)
            opacity: 0
    @keyframes rainbow 
        0% 
            background: #df2020
        25% 
            background: #80df20
        50% 
            background: #20dfdf
        75% 
            background: #7f20df
        100% 
            background: #df2020


.loading-icon
    animation: load 2s linear infinite
@keyframes load
    from
        transform: rotate(0deg)
    to
        transform: rotate(360deg)

.loading-page 
    width: 30rem
    padding: 1.5rem   

</style>
