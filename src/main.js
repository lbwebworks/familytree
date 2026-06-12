import { createApp } from 'vue'
import './style.css'
import Admin from './Admin.vue'
import TreeNode from './components/TreeNodeComponent.vue'

const app = createApp(Admin)
app.component('tree-node', TreeNode)
app.mount('#app')
