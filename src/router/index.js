import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/view/login'
import configIndex from '@/middle/config/sp-config'
import main from '@/view/main'

Vue.use(Router)

var router = new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      path: '/main',
      name: 'main',
      component: main,
      children: [
        {path: '/middle/config/sp-config', component: configIndex}
      ]
    }
  ]
})

router.beforeEach(function (to, from, next) {
  window.addEventListener('load', function () {
    if (to.path !== '/') {
      next('/')
    } else {
      next()
    }
  })
  next()
})

export default router