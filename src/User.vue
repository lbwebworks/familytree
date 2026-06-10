<script>
import TreeView from './components/TreeViewComponent.vue';
import { useTheme } from './composables/useTheme.js';

const FAM_KEYS = ['budaden', 'dawey', 'lacza'];

export default {
  components: { TreeView },
  setup() {
    const { isDark, toggleTheme } = useTheme();
    return { isDark, toggleTheme };
  },
  data() {
    return {
      members: [],
      root: null,
      selectedRoot: ""
    };
  },
  computed: {
    rootCandidates() {
      return this.members.filter(m => !m.parent || m.parent === "root");
    }
  },
  methods: {
    setRoot() {
      this.root = this.selectedRoot;
    }
  },
  created() {
    const fam = new URLSearchParams(window.location.search).get('fam');
    const file = FAM_KEYS.includes(fam?.toLowerCase()) ? './data.json' : './dummy.json';
    fetch(file)
      .then(res => res.json())
      .then(data => {
        this.members = data.members;
        const rootMember = data.members.find(m => m.parent === "root");
        this.root = rootMember ? rootMember.id : null;
        this.selectedRoot = this.root || "";
      })
      .catch(err => console.error("Failed to load data", err));
  }
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Family Tree</h1>
      <button @click="toggleTheme" class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xl">
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </div>

    <!-- Root Selector -->
    <div class="mb-6 flex justify-center">
      <div class="flex items-center">
        <label class="font-semibold mr-2">Root:</label>
        <select v-model="selectedRoot" @change="setRoot" class="border rounded px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
          <option disabled value="">-- Select Root --</option>
          <option v-for="m in rootCandidates" :key="m.id" :value="m.id">
            {{ m.lastname }}, {{ m.firstname }}
          </option>
        </select>
      </div>
    </div>

    <TreeView :members="members" :root="root" />
  </div>
</template>