<script>
import TreeView from './components/TreeViewComponent.vue';
import TreeNode from './components/TreeNodeComponent.vue';
import Members from './components/MembersComponent.vue';
import Member from './components/MemberComponent.vue';

export default {
  components: { TreeView, TreeNode, Members, Member },
  data() {
    return {
      members: [],
      root: null,
      showForm: false,
      editingMember: null,
      activeTab: 'tree'
    };
  },
  methods: {
    openForm(member = null) {
      this.editingMember = member;
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
      this.editingMember = null;
    },
    saveMember(member) {
      if (this.editingMember) {
        // update existing
        const idx = this.members.findIndex(m => m.id === member.id);
        if (idx !== -1) this.members.splice(idx, 1, member);
      } else {
        // add new
        this.members.push(member);
      }
      this.closeForm();
    },
    setRoot(id) { 
      // Reset all members' parent from "root" to null
      this.members.forEach(m => {
        if (m.parent === "root") m.parent = null;
      });
      // Set the selected member's parent to "root"
      const member = this.members.find(m => m.id === id);
      if (member) member.parent = "root";
      this.root = id;
    },
    deleteMember(id) { this.members = this.members.filter(m => m.id !== id); }
  },
  created() {
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        this.members = data.members;
        // Find member with parent "root" and set as root
        const rootMember = data.members.find(m => m.parent === "root");
        this.root = rootMember ? rootMember.id : null;
      })
      .catch(err => console.error("Failed to load data.json", err));
  }
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Admin Page</h1>
    
    <!-- Tab Navigation -->
    <div class="mb-6 border-b">
      <nav class="flex space-x-8">
        <button @click="activeTab = 'tree'" 
                :class="activeTab === 'tree' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                class="py-2 px-1 border-b-2 font-medium text-sm">
          Family Tree
        </button>
        <button @click="activeTab = 'members'" 
                :class="activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                class="py-2 px-1 border-b-2 font-medium text-sm">
          Members
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <TreeView v-if="activeTab === 'tree'" :members="members" :root="root" />
    <Members v-if="activeTab === 'members'" :members="members" :root="root"
                 @set-root="setRoot"
                 @edit="openForm"
                 @add="openForm"
                 @delete="deleteMember" />
    
    <Member v-if="showForm"
            :member="editingMember"
            :members="members"
            @save="saveMember"
            @cancel="closeForm" />

  </div>
</template>