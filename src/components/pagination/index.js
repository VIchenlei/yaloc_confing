import paginationComponent from './pagination'

const pagination = {
  install: function (Vue) {
    Vue.component('pagination', paginationComponent)
  }
}

export default pagination