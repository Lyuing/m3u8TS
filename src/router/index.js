import Vue from 'vue'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
import File from '@/components/file'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'File',
      component: File
    }
  ]
})
