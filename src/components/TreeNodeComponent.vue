<script>
export default {
  name: "TreeNodeComponent",
  props: {
    member: { type: Object, required: true },
    members: { type: Array, required: true },
    expandedNodes: { type: Set, default: () => new Set() }
  },
  computed: {
    children() {
      return this.members
        .filter(m => m.parent === this.member.id)
        .sort((a, b) => new Date(a.birthdate) - new Date(b.birthdate));
    },
    spouseName() {
      if (this.member.spousefirstname || this.member.spousemiddlename || this.member.spouselastname) {
        return `${this.member.spousefirstname || ''} ${this.member.spousemiddlename || ''} ${this.member.spouselastname || ''}`.trim();
      }
      return this.member.spousename || '';
    },
    displayName() {
      return this.member.nickname || this.member.firstname || this.member.lastname || '[Member]';
    },
    spouseDisplayName() {
      return this.member.spousenickname || this.member.spousefirstname || this.member.spouselastname || (this.spouseName ? this.spouseName.split(' ')[0] : '') || '[Spouse]';
    }
  },
  methods: {
    toggleExpand() {
      if (this.expandedNodes.has(this.member.id)) {
        this.expandedNodes.delete(this.member.id);
      } else {
        this.expandedNodes.add(this.member.id);
      }
    }
  }
};
</script>

<template>
  <li class="relative">
    <!-- Tree connector lines -->
    <div v-if="children.length" class="absolute left-4 top-6 w-px h-full bg-gray-300"></div>
    
    <!-- Member + Spouse -->
    <div class="flex items-center space-x-3 py-2">
      <!-- Tree branch -->
      <div class="w-4 h-4 border-l-2 border-b-2 border-gray-300"></div>
      
      <!-- Expand/Collapse button -->
      <button v-if="children.length" @click="toggleExpand" 
              class="w-6 h-6 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full flex items-center justify-center text-xs font-bold">
        {{ expandedNodes.has(member.id) ? '-' : '+' }}
      </button>
      <div v-else class="w-6"></div>
      
      <!-- Member photo -->
      <img :src="member.photo || './photos/default.jpg'" alt="photo" :class="member.gender === 'Female' ? 'border-pink-200' : 'border-blue-200'" class="w-10 h-10 rounded-full border-2" />

      <!-- Member name with tooltip -->
      <div :class="member.gender === 'Female' ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'" class="px-3 py-2 rounded-lg border">
        <span :class="member.gender === 'Female' ? 'text-pink-900 dark:text-pink-300' : 'text-blue-900 dark:text-blue-300'" class="relative group font-medium">
          {{ displayName }}
          <!-- Tooltip -->
          <span v-if="member.remarks"
                class="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
            {{ member.remarks }}
          </span>
        </span>
      </div>

      <!-- Spouse (if present) -->
      <template v-if="spouseName">
        <span class="text-gray-400 font-bold">♥</span>
        <img :src="member.spousephoto || './photos/default.jpg'" alt="spouse photo" :class="member.gender === 'Female' ? 'border-blue-200 dark:border-blue-800' : 'border-pink-200 dark:border-pink-800'" class="w-10 h-10 rounded-full border-2" />
        <div :class="member.gender === 'Female' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800'" class="px-3 py-2 rounded-lg border">
          <span :class="member.gender === 'Female' ? 'text-blue-900 dark:text-blue-300' : 'text-pink-900 dark:text-pink-300'" class="font-medium">{{ spouseDisplayName }}</span>
        </div>
      </template>
    </div>

    <!-- Render children recursively -->
    <ul v-if="children.length && expandedNodes.has(member.id)" class="ml-8 mt-2 space-y-1">
      <tree-node v-for="child in children" :key="child.id" :member="child" :members="members" :expanded-nodes="expandedNodes"></tree-node>
    </ul>
  </li>
</template>