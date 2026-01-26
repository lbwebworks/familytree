<script>
import TreeView from './components/TreeViewComponent.vue';

export default {
  components: { TreeView },
  data() {
    return {
      members: [],
      root: null
    };
  },
  created() {
    fetch('./data.json')
      .then(res => res.json())
      .then(data => {
        this.members = data.members;
        const rootMember = data.members.find(m => m.parent === "root");
        this.root = rootMember ? rootMember.id : null;
      })
      .catch(err => console.error("Failed to load data.json", err));
  }
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-3xl font-bold mb-6 text-center">Family Tree</h1>
    <TreeView :members="members" :root="root" />
  </div>
</template>