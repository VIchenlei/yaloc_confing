import Vue from 'vue'
import App from './App'
import router from './router'
import Vuex from 'vuex'
import store from './js/store/DataStore.js'
import Transer from './js/Transer.js'
import Draggable from './js/utils/Draggable.js'
import toggleLocating from './js/service/locateService.js'
import toggleTracking from './js/service/TrackService.js'
import hinTip from '@/components/hintip'
import xhint from '@/components/xhint'
import pagination from '@/components/pagination'
import svgIcon from '@/components/svgicon'
import { dataNumberChange } from './js/utils/utils.js'

Vue.config.productionTip = false
Vue.use(Vuex)
window.hintip = Vue.use(hinTip)
Vue.use(xhint)
Vue.use(pagination)
Vue.use(svgIcon)
window.xbus = new Vue()
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

// 初始化基本服务
function initBaseServices () {
  window.transer = new Transer('login')
  window.xdata = store
  window.router = router
  window.xdata.dispatch('dexieDBStore/openLocalDB')
}

// 初始化工具函数
function initTools () {
  window.setDraggable = (msg) => {
    Draggable(msg.target, msg.handle)
  }
  // set dialog draggable
  window.setDialogDraggable = (root) => {
    let dragHandle = root.querySelector('.dlg-head')
    let dragTarget = root.querySelector('.dlg-window')
    Draggable(dragTarget, dragHandle)
  }

  window.toggleLocating = (msg) => {
    toggleLocating(msg)
  }

  window.toggleTracking = (msg) => {
    toggleTracking(msg)
  }
}

window.initApp = () => {
  dataNumberChange()
  initBaseServices()
  initTools()
}

window.initApp()
