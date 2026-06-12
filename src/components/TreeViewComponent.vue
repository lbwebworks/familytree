<script>
import TreeList from './TreeListComponent.vue'
import TreeChart from './TreeChartComponent.vue'

export default {
  name: 'TreeViewComponent',
  components: { TreeList, TreeChart },
  props: {
    members: { type: Array, required: true },
    root: { type: String, default: null },
  },
  computed: {
    rootMember() {
      return (
        this.members.find((m) => m.parent === 'root') ||
        this.members.find((m) => m.id === this.root) ||
        null
      )
    },
    connectedMembers() {
      return this.members.filter(
        (m) => m.parent === 'root' || this.members.some((parent) => parent.id === m.parent),
      )
    },
  },
  data() {
    return {
      expandedNodes: new Set(),
      viewMode: 'list',
      maxGenerations: 3,
    }
  },
  methods: {
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
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div v-if="!rootMember" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400 italic text-lg">
        No root selected. Go to Members tab to set a root member.
      </p>
    </div>

    <div v-else :class="viewMode === 'list' ? 'inline-block' : 'w-full'">
      <!-- Controls -->
      <div class="flex justify-between items-center mb-4 gap-8">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-1 cursor-pointer">
            <input type="radio" v-model="viewMode" value="tree" class="accent-blue-500" />
            <span class="text-sm font-medium">Tree</span>
          </label>
          <label class="flex items-center gap-1 cursor-pointer">
            <input type="radio" v-model="viewMode" value="list" class="accent-blue-500" />
            <span class="text-sm font-medium">List</span>
          </label>
        </div>
        <div v-if="viewMode === 'list'" class="space-x-2">
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
        <div v-if="viewMode === 'tree'" class="flex items-center gap-2">
          <label class="text-sm font-medium">Generations:</label>
          <select
            v-model.number="maxGenerations"
            class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          >
            <option v-for="n in [3, 4, 5, 6, 7, 8, 9, 10]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>

      <!-- List view -->
      <TreeList
        v-if="viewMode === 'list'"
        :members="connectedMembers"
        :root="rootMember"
        :expanded-nodes="expandedNodes"
        @toggle="toggleNode"
      />

      <!-- Tree view -->
      <TreeChart
        v-else
        :members="connectedMembers"
        :root="rootMember"
        :max-generations="maxGenerations"
      />
    </div>
  </div>
</template>
