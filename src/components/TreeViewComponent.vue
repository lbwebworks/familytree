<script>
import TreeNode from './TreeNodeComponent.vue';

export default {
  name: "TreeViewComponent",
  components: { TreeNode },
  props: {
    members: { type: Array, required: true },
    root: { type: String, default: null }
  },
  computed: {
    rootMember() {
      return this.members.find(m => m.parent === "root") || this.members.find(m => m.id === this.root) || null;
    },
    connectedMembers() {
      // Only include members that are connected to the tree (not orphans)
      return this.members.filter(m => m.parent === "root" || this.members.some(parent => parent.id === m.parent));
    }
  },
  data() {
    return {
      expandedNodes: new Set()
    };
  },
  methods: {
    expandAll() {
      this.expandedNodes = new Set(this.connectedMembers.map(m => m.id));
    },
    collapseAll() {
      this.expandedNodes = new Set();
    }
  }
};
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- Empty state -->
    <div v-if="!rootMember" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400 italic text-lg">
        No family tree root selected. Go to Members tab to select a root member.
      </p>
    </div>

    <!-- Tree rendering -->
    <div v-else class="inline-block">
      <div class="flex justify-between items-center mb-4 gap-8">
        <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Family Tree</h2>
        <div class="space-x-2">
          <button @click="expandAll" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
            Expand All
          </button>
          <button @click="collapseAll" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
            Collapse All
          </button>
        </div>
      </div>
      <ul class="list-none">
        <tree-node :member="rootMember" :members="connectedMembers" :expanded-nodes="expandedNodes"></tree-node>
      </ul>
    </div>
  </div>
</template>