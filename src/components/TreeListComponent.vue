<script>
export default {
  name: 'TreeListComponent',
  props: {
    members: { type: Array, required: true },
    root: { type: Object, required: true },
    expandedNodes: { type: Set, required: true }
  },
  emits: ['toggle'],
  data() {
    return {
      lines: [],
      containerRect: null
    };
  },
  computed: {
    // Flat ordered list of visible nodes via DFS
    visibleNodes() {
      const result = [];
      const walk = (member, depth) => {
        result.push({ member, depth });
        if (this.expandedNodes.has(member.id)) {
          this.childrenOf(member.id).forEach(child => walk(child, depth + 1));
        }
      };
      walk(this.root, 0);
      return result;
    }
  },
  methods: {
    getRefEl(refName) {
      const ref = this.$refs[refName]
      return Array.isArray(ref) ? ref[0] : ref || null
    },
    childrenOf(id) {
      return this.members
        .filter(c => c.parent === id)
        .sort((a, b) => new Date(a.birthdate) - new Date(b.birthdate));
    },
    spouseName(m) {
      if (m.spousefirstname || m.spousemiddlename || m.spouselastname) {
        return `${m.spousefirstname || ''} ${m.spousemiddlename || ''} ${m.spouselastname || ''}`.trim();
      }
      return m.spousename || '';
    },
    displayName(m) {
      return m.nickname || m.firstname || m.lastname || '[Member]';
    },
    spouseDisplayName(m) {
      return m.spousenickname || m.spousefirstname || m.spouselastname || '[Spouse]';
    },
    isMale(m) {
      return m.gender !== 'Female';
    },
    isRootMember(m) {
      return m?.id === this.root?.id;
    },
    drawLines() {
      this.$nextTick(() => {
        const container = this.$refs.container;
        if (!container) return;
        const cRect = container.getBoundingClientRect();
        this.containerRect = { width: container.scrollWidth, height: container.scrollHeight };

        const newLines = [];

        this.visibleNodes.forEach(({ member }) => {
          const children = this.expandedNodes.has(member.id) ? this.childrenOf(member.id) : [];
          if (!children.length) return;

          const parentBtn = this.getRefEl('btn-' + member.id);
          const parentEl = this.getRefEl('node-' + member.id);
          if (!parentBtn || !parentEl) return;
          const pBtnRect = parentBtn.getBoundingClientRect();

          const lineX = pBtnRect.left + pBtnRect.width / 2 - cRect.left;
          const py = pBtnRect.top + pBtnRect.height / 2 - cRect.top;

          const childPoints = children.map(child => {
            const childBtn = this.getRefEl('btn-' + child.id);
            const childEl = this.getRefEl('node-' + child.id);
            if (!childBtn || !childEl) return null;
            const cBtnRect = childBtn.getBoundingClientRect();
            return {
              x: cBtnRect.left + cBtnRect.width / 2 - cRect.left,
              y: cBtnRect.top + cBtnRect.height / 2 - cRect.top
            };
          }).filter(Boolean);

          if (!childPoints.length) return;

          // vertical from parent bottom down to last child mid
          newLines.push({ x1: lineX, y1: py, x2: lineX, y2: childPoints[childPoints.length - 1].y });
          // horizontal from lineX to each child's left edge
          childPoints.forEach(cp => {
            newLines.push({ x1: lineX, y1: cp.y, x2: cp.x, y2: cp.y });
          });
        });

        this.lines = newLines;
      });
    }
  },
  mounted() {
    this.drawLines();
    window.addEventListener('resize', this.drawLines);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.drawLines);
  },
  watch: {
    expandedNodes: {
      deep: true,
      handler() { this.drawLines(); }
    },
    members() { this.drawLines(); },
    root() { this.drawLines(); }
  }
};
</script>

<template>
  <div class="overflow-x-auto">
    <div ref="container" class="relative inline-block min-w-full">

      <!-- SVG overlay -->
      <svg
        v-if="containerRect"
        class="absolute inset-0 pointer-events-none"
        :width="containerRect.width"
        :height="containerRect.height"
      >
        <line
          v-for="(line, i) in lines"
          :key="i"
          :x1="line.x1" :y1="line.y1"
          :x2="line.x2" :y2="line.y2"
          stroke="#9ca3af"
          stroke-width="2"
        />
      </svg>

      <!-- Nodes -->
      <div class="flex flex-col py-2 gap-2">
        <div
          v-for="{ member, depth } in visibleNodes"
          :key="member.id"
          :style="{ paddingLeft: depth * 48 + 'px' }"
          class="flex items-center gap-2"
        >
          <!-- Expand/collapse button -->
          <button
            v-if="childrenOf(member.id).length"
            :ref="'btn-' + member.id"
            @click="$emit('toggle', member.id)"
            class="w-6 h-6 flex-shrink-0 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full flex items-center justify-center text-xs font-bold z-10"
          >
            {{ expandedNodes.has(member.id) ? '−' : '+' }}
          </button>
          <div v-else :ref="'btn-' + member.id" class="w-6 flex-shrink-0"></div>

          <!-- Member node -->
          <div
            :ref="'node-' + member.id"
            class="relative group flex items-center gap-2 px-3 py-2 rounded-lg border"
            :class="isMale(member)
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
              : 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800'"
          >
            <!-- Photo -->
            <img
              :src="member.photo || './photos/default.jpg'"
              class="w-10 h-10 rounded-full border-2 object-cover flex-shrink-0"
              :class="isMale(member) ? 'border-blue-200 dark:border-blue-700' : 'border-pink-200 dark:border-pink-700'"
            />
            <!-- Name -->
            <span
              class="font-medium relative group"
              :class="isMale(member) ? 'text-blue-900 dark:text-blue-300' : 'text-pink-900 dark:text-pink-300'"
            >
              {{ displayName(member) }}
              <span
                v-if="member.remarks"
                class="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10"
              >
                {{ member.remarks }}
              </span>
            </span>

            <div
              v-if="spouseName(member)"
              :class="
                isRootMember(member)
                  ? 'ml-2 max-w-[220px] overflow-hidden opacity-100 transition-all duration-300 ease-out'
                  : 'ml-0 max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100'
              "
            >
              <div class="flex items-center gap-2 whitespace-nowrap">
                <span class="text-gray-400 text-xs">♥</span>
                <div class="flex items-center gap-2">
                  <img
                    :src="member.spousephoto || './photos/default.jpg'"
                    class="w-10 h-10 rounded-full border-2 object-cover flex-shrink-0"
                    :class="isMale(member) ? 'border-pink-200 dark:border-pink-700' : 'border-blue-200 dark:border-blue-700'"
                  />
                  <span
                    class="text-sm leading-tight whitespace-nowrap"
                    :class="isMale(member) ? 'text-pink-900 dark:text-pink-300' : 'text-blue-900 dark:text-blue-300'"
                  >
                    {{ spouseDisplayName(member) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
