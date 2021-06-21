import xhintCompotent from './xhint'

const xhint = {
  install: function (Vue) {
    Vue.component('xhint', xhintCompotent)
  }
}

export default xhint