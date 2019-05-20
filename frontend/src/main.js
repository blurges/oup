import Vue from 'vue'
import App from './App.vue'
import variables from './css/variables.css'
import reset from './css/reset.css'

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
