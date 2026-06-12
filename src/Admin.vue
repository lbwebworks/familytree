<script>
import TreeChart from './components/TreeChartComponent.vue'
import TreeList from './components/TreeListComponent.vue'
import Members from './components/MembersComponent.vue'
import Member from './components/MemberComponent.vue'
import { useTheme } from './composables/useTheme.js'

const FAM_KEYS = ['budaden', 'dawey', 'lacza']

export default {
  components: { TreeChart, TreeList, Members, Member },
  setup() {
    const { isDark, toggleTheme } = useTheme()
    return { isDark, toggleTheme }
  },
  data() {
    return {
      members: [],
      root: null,
      showForm: false,
      editingMember: null,
      activeTab: 'tree',
      expandedNodes: new Set(),
    }
  },
  computed: {
    rootMember() {
      return this.members.find((m) => m.parent === 'root') || null
    },
    connectedMembers() {
      return this.members.filter(
        (m) => m.parent === 'root' || this.members.some((p) => p.id === m.parent),
      )
    },
  },
  methods: {
    openForm(member = null) {
      this.editingMember = member
      this.showForm = true
    },
    closeForm() {
      this.showForm = false
      this.editingMember = null
    },
    saveMember(member) {
      if (this.editingMember) {
        const idx = this.members.findIndex((m) => m.id === member.id)
        if (idx !== -1) this.members.splice(idx, 1, member)
      } else {
        this.members.push(member)
      }
      this.closeForm()
    },
    setRoot(id) {
      this.members.forEach((m) => {
        if (m.parent === 'root') m.parent = null
      })
      const member = this.members.find((m) => m.id === id)
      if (member) member.parent = 'root'
      this.root = id
    },
    deleteMember(id) {
      this.members = this.members.filter((m) => m.id !== id)
    },
    expandAll() {
      this.expandedNodes = new Set(this.connectedMembers.map((m) => m.id))
    },
    collapseAll() {
      this.expandedNodes = new Set()
    },
    toggleNode(id) {
      const next = new Set(this.expandedNodes)
      next.has(id) ? next.delete(id) : next.add(id)
      this.expandedNodes = next
    },
  },
  created() {
    const fam = new URLSearchParams(window.location.search).get('fam')
    const file = FAM_KEYS.includes(fam?.toLowerCase()) ? './data.json' : './dummy.json'
    fetch(file)
      .then((res) => res.json())
      .then((data) => {
        this.members = data.members
        const rootMember = data.members.find((m) => m.parent === 'root')
        this.root = rootMember ? rootMember.id : null
      })
      .catch((err) => console.error('Failed to load data', err))
  },
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Strata</h1>
      <button
        @click="toggleTheme"
        class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xl"
      >
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </div>

    <!-- Tab Navigation -->
    <div class="mb-6 border-b dark:border-gray-700">
      <nav class="flex space-x-8">
        <button
          @click="activeTab = 'tree'"
          :class="
            activeTab === 'tree'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400'
          "
          class="py-2 px-1 border-b-2 font-medium text-sm"
        >
          Tree
        </button>
        <button
          @click="activeTab = 'list'"
          :class="
            activeTab === 'list'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400'
          "
          class="py-2 px-1 border-b-2 font-medium text-sm"
        >
          List
        </button>
        <button
          @click="activeTab = 'manage'"
          :class="
            activeTab === 'manage'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400'
          "
          class="py-2 px-1 border-b-2 font-medium text-sm"
        >
          Manage
        </button>
      </nav>
    </div>

    <!-- No root state -->
    <div v-if="!rootMember && activeTab !== 'manage'" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400 italic">
        No root selected. Go to Manage tab to set a root member.
      </p>
    </div>

    <!-- Tree tab -->
    <TreeChart v-else-if="activeTab === 'tree'" :members="connectedMembers" :root="rootMember" />

    <!-- List tab -->
    <div v-else-if="activeTab === 'list'">
      <div class="flex justify-end gap-2 mb-4">
        <button
          @click="expandAll"
          class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Expand All
        </button>
        <button
          @click="collapseAll"
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Collapse All
        </button>
      </div>
      <TreeList
        :members="connectedMembers"
        :root="rootMember"
        :expanded-nodes="expandedNodes"
        @toggle="toggleNode"
      />
    </div>

    <!-- Manage tab -->
    <Members
      v-else-if="activeTab === 'manage'"
      :members="members"
      :root="root"
      @set-root="setRoot"
      @edit="openForm"
      @add="openForm"
      @delete="deleteMember"
    />

    <Member
      v-if="showForm"
      :member="editingMember"
      :members="members"
      @save="saveMember"
      @cancel="closeForm"
    />
  </div>
</template>
