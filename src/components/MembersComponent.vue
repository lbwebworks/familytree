<template>
  <div>
    <!-- Root Selector -->
    <div class="mb-4 flex justify-between items-center gap-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center">
          <label class="font-semibold mr-2">Root:</label>
          <select v-model="selectedRoot" @change="$emit('set-root', selectedRoot)" class="border rounded px-2 py-1">
            <option disabled value="">-- Select Root --</option>
            <option v-for="m in rootCandidates" :key="m.id" :value="m.id">
              {{ m.lastname }}, {{ m.firstname }}
            </option>
          </select>
        </div>
        
        <div class="flex items-center">
          <label class="font-semibold mr-2">Search:</label>
          <input v-model="searchQuery" type="text" placeholder="Search members..." 
                 class="border rounded px-2 py-1 w-48" />
        </div>
      </div>
      
      <div class="flex space-x-3">
        <button @click="$emit('add')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
          + Add Member
        </button>
        <button @click="exportData" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition">
          Export JSON
        </button>
      </div>
    </div>

    <!-- Members Table -->
    <table class="table-auto w-full border-collapse border border-gray-300">
      <thead>
        <tr class="bg-gray-200">
          <th class="border px-2 py-1">Photo</th>
          <th class="border px-2 py-1">Full Name</th>
          <th class="border px-2 py-1">Birthdate</th>
          <th class="border px-2 py-1">Controls</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in paginatedMembers" :key="m.id">
          <td class="border px-2 py-1 text-center">
            <img :src="m.photo || './photos/default.jpg'" @error="$event.target.src = './photos/default.jpg'" alt="photo" class="w-10 h-10 rounded-full mx-auto" />
          </td>
          <td class="border px-2 py-1">
            {{ m.lastname }}, {{ m.firstname }} {{ m.middlename }}
          </td>
          <td class="border px-2 py-1">
            {{ m.birthdate }}
          </td>
          <td class="border px-2 py-1 text-center space-x-2">
            <button @click="$emit('edit', m)" class="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
            <button @click="$emit('delete', m.id)" class="bg-red-600 text-white px-2 py-1 rounded">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="mt-4 flex justify-between items-center">
      <div class="text-sm text-gray-600">
        Showing {{ startIndex + 1 }}-{{ Math.min(endIndex, filteredMembers.length) }} of {{ filteredMembers.length }} members
      </div>
      <div class="flex space-x-2">
        <button @click="currentPage--" :disabled="currentPage === 1" 
                class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
          Previous
        </button>
        <span class="px-3 py-1">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" 
                class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
          Next
        </button>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "MembersComponent",
  props: {
    members: { type: Array, required: true },
    root: { type: String, default: null }
  },
  data() {
    return {
      selectedRoot: this.root || "",
      searchQuery: "",
      currentPage: 1,
      itemsPerPage: 20
    };
  },
  watch: {
    root(newVal) {
      this.selectedRoot = newVal;
    },
    searchQuery() {
      this.currentPage = 1; // Reset to first page when searching
    }
  },
  computed: {
    rootCandidates() {
      return this.members.filter(m => !m.parent || m.parent === "root");
    },
    filteredMembers() {
      if (!this.searchQuery) return this.sortedMembers;
      const query = this.searchQuery.toLowerCase();
      return this.sortedMembers.filter(m => 
        m.firstname.toLowerCase().includes(query) ||
        m.lastname.toLowerCase().includes(query) ||
        m.middlename.toLowerCase().includes(query)
      );
    },
    sortedMembers() {
      return [...this.members].sort((a, b) => {
        return new Date(a.birthdate) - new Date(b.birthdate);
      });
    },
    totalPages() {
      return Math.ceil(this.filteredMembers.length / this.itemsPerPage);
    },
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage;
    },
    endIndex() {
      return this.startIndex + this.itemsPerPage;
    },
    paginatedMembers() {
      return this.filteredMembers.slice(this.startIndex, this.endIndex);
    }
  },
  methods: {
    exportData() {
      const data = {
        members: this.members
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "../public/data.json";
      link.click();
      URL.revokeObjectURL(url);
    }
  }
};
</script>