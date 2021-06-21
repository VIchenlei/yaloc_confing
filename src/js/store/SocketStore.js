import {EVT} from '../Protocol.js'
import {getAbsoluteUrl} from '@/js/utils/utils'
export default {
  namespaced: true,
  state: {
    socket: null,
    reptShowResult: null,
    count: 0
  },
  mutations: {
    storeThis (state, msg) {
      state.socket = msg.socket
    },
    dbStore (state, msg) {
      state.reptShowResult = msg
    }
  },
  actions: {
    storeSocket ({state, commit}, msg) {
      commit('storeThis', msg)
    },
    sendMsg ({state}, rows) {
      let socket = state.socket
      let eventName = rows.cmd
      let msg = rows.data
      msg['key'] = ++state.count
      msg['username'] = window.xdata ? window.xdata.state.user.username : ''
      let cb = rows.cb
      let ret = false
      if (socket && socket.connected) {
        cb && cb instanceof Function ? socket.emit(eventName, msg, cb) : socket.emit(eventName, msg)
        ret = true
      } else {
        console.warn('Socket.js : The socket is disconnected.')
        // xbus.trigger('FAILED-FOR-NOCONN', { eventName: eventName })
      }

      return ret
    },
    registerGlobalEventHandlers ({state, dispatch}, msg) {
      let cmd = msg.cmd
      let data = msg.data
      switch (cmd) {
        case 'REPT-FETCH-DATA':
          dispatch('getRept', data)
          break
        case 'PULL-DOWN-METADATA':
          dispatch('sendMsg', {
            cmd: EVT.META,
            data: data
          })
          break
        case 'CALL-REMOTE':
          dispatch('sendMsg', {
            cmd: EVT.CALL,
            data: data
          })
          break
        case 'CALL-CARD-START':
          dispatch('sendMsg', {
            cmd: EVT.CALL,
            data: data
          })
          break
        case 'META-UPDATE-DB':
          dispatch('sendMsg', {
            cmd: EVT.META,
            data: data
          })
          break
        case 'AFRESH-METADATA':
          dispatch('sendMsg', {
            cmd: EVT.META,
            data: data
          })
          break
        case 'REPT-FETCH-FILE':
          dispatch('getReptToFile', data)
          break
        case 'PULL-IMPORT-FILE':
          dispatch('sendMsg', {
            cmd: 'PULLMSG',
            data: data
          })
      }
    },
    getRept ({state, dispatch, commit}, data) {
      dispatch('sendMsg', {
        cmd: data.cmd,
        data: data.data,
        cb: (res) => {
          let key = res.key
          if (key === state.count) {
            let ds = {
              def: data.def,
              rows: res.data,
              total: res.total,
              pageIndex: res.pageIndex
            }
            commit('dbStore', ds)
          }
        }
      })
    },
    getReptToFile ({state, dispatch, commit}, msg) {
      dispatch('sendMsg', {
        cmd: msg.cmd,
        data: msg.data,
        cb: (res) => {
          if (res.code !== 0) {
            console.warn('导出文件失败：', res.msg)
            this.commit('stateStore/changeShowXhint',{showXhint: false, data: null})
            return
          }
          this.commit('stateStore/changeShowXhint',{showXhint: false, data: null})
          switch (res.data.fileType) {
            case 'csv':
            case 'pdf':
            case 'xlsx':
              let link = document.createElement('a')
              let absoluteUrl = getAbsoluteUrl(res.data.url)
              link.setAttribute('href', absoluteUrl)
              link.setAttribute('target', '_blank')
              console.log('absoluteUrl',absoluteUrl)
              link.setAttribute('download', res.data.name)
               window.setTimeout(function () { 
                 link.click()
               }, 2000)
              break
            case 'printPDF':
              let printURL = getAbsoluteUrl(res.data.url)
              let printLink = document.createElement('a')
              printLink.setAttribute('onclick', 'window.open("' + printURL + '")')
              window.setTimeout(function () {
                printLink.click()
              }, 2000)
              break
          }
          this.commit('stateStore/changeShowXhint',{showXhint: false, data: null})
        }
      })
    }
  }
}
