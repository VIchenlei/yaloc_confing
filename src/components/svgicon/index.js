import svgiconCompotent from './svgicon'

const svgicon = {
  install: function (Vue) {
    Vue.component('svgicon', svgiconCompotent)
  }
}

export default svgicon