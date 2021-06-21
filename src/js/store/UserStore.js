import Socket from '../Socket.js'
import {EVT, CMD} from '../Protocol.js'
export default {
  namespaced: true,
  state: {
    username: null,
    userpwd: null,
    roleID: null,
    deptID: null,
    sock: null,
    data: null,
    logined: false,
    userIP: null,
    changePwd: {
      code: 3,
      msg: null
    }
  },
  mutations: {
    getuserData (state, msg) {
      state.logined = msg && msg.logined
      state.username = msg && msg.name
      state.roleID = msg && msg.roleid
      state.deptID = msg && msg.deptid
      state.userIP = msg && msg.userip
    },
    doModifyPwdRes (state, data) {
      state.changePwd.msg = data.msg
      state.changePwd.code = data.code
    }
  },
  actions: {
    users (state, msg) {
      switch (msg.cmd) {
        case 'LOGIN':
          state.dispatch('login', msg.data)
          break
        case 'LOGOUT':
          state.dispatch('doLogout')
          break
        case 'MODIFY_PWD':
          state.dispatch('modifyPwd', msg.data)
          break
      }
    },
    login (state, msg) {
      if (!this.sock) {
        this.sock = new Socket()
      }
      this.dispatch('socketStore/storeSocket', this.sock) // 存储在socketStore中
      this.username = msg.user_name
      this.userpwd = msg.user_pwd
      this.sock.getConnection(3000).then((socket) => {
        state.dispatch('doLogin')
      }).catch((msg) => {
        console.warn('Get connection error, please try later: ', msg)
        // window.xhint.showHint('无法连接到服务器！', '请确认网络可用后，再试一下。')
      })
    },
    doLogin (state) {
      let reqMsg = {
        cmd: 'login',
        data: {
          user_name: this.username,
          user_pass: this.userpwd
        }
      }
      this.sock.socket.emit('USER', reqMsg, (data) => {
        state.dispatch('doLoginRes', data)
      })
    },
    doLoginRes (state, res) {
      if (this.logined) return
      if (res) {
        if (res.code === 0) {
          this.data = res
          let socket = this.sock.socket
          socket.username = res.data.name
          socket.sid = res.data.sid

          let userinfo = {
            name: this.name
          }
          this.userIP = res.data.ip
          this.roleID = res.data.roleID
          state.commit('getuserData', {
            logined: true,
            name: this.username,
            roleid: res.data.roleID,
            userip: res.data.ip
          })
        } else {
          console.warn('用户名 或 密码 错误！')
          window.xdata.commit('metaStore/saveHintip', {
            value: 'failure',
            tip: '用户名 或 密码 错误！'
          })
        }
      } else {
        console.warn('LOGIN ： 系统错误！')
      }
    },
    modifyPwd ({state, commit}, msg) {
      // console.log(msg)
      this.sock.socket.emit(EVT.USER, {
        cmd: CMD.USER.MODIFY,
        data: {
          username: msg.username,
          oldpwd: msg.oldpwd,
          newpwd: msg.newpwd
        }
      }, (data) => {
        commit('doModifyPwdRes', data)
      })
    },
    doLogout ({state, commit}, msg) {
      let socket = this.sock && this.sock.socket
      if (socket) {
        let reqMsg = {
          cmd: CMD.USER.LOGOUT,
          data: {
            user_name: socket.username
          }
        }
        socket.emit(EVT.USER, reqMsg)
        commit('getuserData')
        window.router.replace('/')
        console.log(window.router)
        socket.close()
      }
    }
  }
}
