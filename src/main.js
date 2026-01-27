import { createApp } from 'vue'
import './style.css'
import Admin from './Admin.vue'
import User from './User.vue'
import TreeNode from './components/TreeNodeComponent.vue'

// Use User for production (GitHub Pages), Admin for development
const component = import.meta.env.PROD ? User : Admin;

const app = createApp(component)
app.component('tree-node', TreeNode)
app.mount('#app')
