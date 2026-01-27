<script>
import TreeView from './components/TreeViewComponent.vue';

export default {
  components: { TreeView },
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
    fetch('./data.json')
      .then(res => res.json())
      .then(data => {
        this.members = data.members;
        const rootMember = data.members.find(m => m.parent === "root");
        this.root = rootMember ? rootMember.id : null;
        this.selectedRoot = this.root || "";
      })
      .catch(err => console.error("Failed to load data.json", err));
  }
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-3xl font-bold mb-6 text-center">Family Tree</h1>
    
    <!-- Root Selector -->
    <div class="mb-6 flex justify-center">
      <div class="flex items-center">
        <label class="font-semibold mr-2">Root:</label>
        <select v-model="selectedRoot" @change="setRoot" class="border rounded px-3 py-2">
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