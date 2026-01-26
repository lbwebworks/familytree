import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PublicViewer from './PublicViewer.vue'
import TreeNode from './components/TreeNodeComponent.vue'

// Use PublicViewer for production (GitHub Pages), Admin App for development
const component = import.meta.env.PROD ? PublicViewer : App;

const app = createApp(component)
app.component('tree-node', TreeNode)
app.mount('#app')
