// 定义全局自定义组件
import hintipCompotent from './hintip'

const hintip = {
  install: function (Vue) {
    Vue.component('hintip', hintipCompotent)
  }
}

export default hintip