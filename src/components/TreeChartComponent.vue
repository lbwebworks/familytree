<script>
export default {
  name: 'TreeChartComponent',
  props: {
    members: { type: Array, required: true },
    root: { type: Object, required: true },
    maxGenerations: { type: Number, default: 3 },
  },
  data() {
    return {
      lines: [],
      containerRect: null,
    }
  },
  computed: {
    generations() {
      const gens = []
      let current = [this.root]
      for (let i = 0; i < this.maxGenerations; i++) {
        gens.push(current)
        const next = []
        current.forEach((m) => {
          const children = this.childrenOf(m.id)
          next.push(...children)
        })
        if (!next.length) break
        current = next
      }
      return gens
    },
  },
  methods: {
    childrenOf(id) {
      return this.members
        .filter((c) => c.parent === id)
        .sort((a, b) => new Date(a.birthdate) - new Date(b.birthdate))
    },
    spouseName(m) {
      return [m.spousefirstname, m.spouselastname].filter(Boolean).join(' ')
    },
    displayName(m) {
      return m.nickname || m.firstname || m.lastname || '[Member]'
    },
    spouseDisplayName(m) {
      return m.spousenickname || m.spousefirstname || m.spouselastname || '[Spouse]'
    },
    isMale(m) {
      return m.gender !== 'Female'
    },
    drawLines() {
      this.$nextTick(() => {
        const container = this.$refs.container
        if (!container) return
        const cRect = container.getBoundingClientRect()
        this.containerRect = cRect

        const newLines = []

        // For each generation except the last, connect parents to children
        for (let gi = 0; gi < this.generations.length - 1; gi++) {
          const parents = this.generations[gi]
          parents.forEach((parent) => {
            const children = this.childrenOf(parent.id)
            if (!children.length) return

            const parentEl = this.$refs['node-' + parent.id]?.[0]
            if (!parentEl) return
            const pRect = parentEl.getBoundingClientRect()

            // parent center-bottom relative to container
            const px = pRect.left + pRect.width / 2 - cRect.left
            const py = pRect.bottom - cRect.top

            // gather child top-centers
            const childPoints = children
              .map((child) => {
                const childEl = this.$refs['node-' + child.id]?.[0]
                if (!childEl) return null
                const cR = childEl.getBoundingClientRect()
                return {
                  x: cR.left + cR.width / 2 - cRect.left,
                  y: cR.top - cRect.top,
                }
              })
              .filter(Boolean)

            if (!childPoints.length) return

            const midY = py + (childPoints[0].y - py) / 2

            // vertical from parent down to mid
            newLines.push({ x1: px, y1: py, x2: px, y2: midY })

            // horizontal bar from leftmost to rightmost child
            const minX = Math.min(...childPoints.map((p) => p.x))
            const maxX = Math.max(...childPoints.map((p) => p.x))
            newLines.push({ x1: minX, y1: midY, x2: maxX, y2: midY })

            // vertical from mid down to each child
            childPoints.forEach((cp) => {
              newLines.push({ x1: cp.x, y1: midY, x2: cp.x, y2: cp.y })
            })
          })
        }

        this.lines = newLines
      })
    },
  },
  mounted() {
    this.drawLines()
    window.addEventListener('resize', this.drawLines)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.drawLines)
  },
  watch: {
    members() {
      this.drawLines()
    },
    root() {
      this.drawLines()
    },
    maxGenerations() {
      this.drawLines()
    },
  },
}
</script>

<template>
  <div class="overflow-x-auto">
    <div ref="container" class="relative inline-block min-w-full">
      <!-- SVG overlay for connector lines -->
      <svg
        v-if="containerRect"
        class="absolute inset-0 pointer-events-none"
        :width="containerRect.width"
        :height="containerRect.height"
      >
        <line
          v-for="(line, i) in lines"
          :key="i"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="#9ca3af"
          stroke-width="2"
        />
      </svg>

      <!-- Generations -->
      <div class="flex flex-col items-center gap-12 py-4">
        <div
          v-for="(gen, genIndex) in generations"
          :key="genIndex"
          class="flex justify-center gap-6 flex-wrap"
        >
          <div
            v-for="member in gen"
            :key="member.id"
            :ref="'node-' + member.id"
            class="flex items-start gap-1"
          >
            <!-- Member card -->
            <div class="flex flex-col items-center w-20">
              <img
                :src="member.photo || './photos/default.jpg'"
                class="w-16 h-16 rounded-full border-2 object-cover"
                :class="
                  isMale(member)
                    ? 'border-blue-300 dark:border-blue-700'
                    : 'border-pink-300 dark:border-pink-700'
                "
              />
              <span
                class="mt-1 text-xs font-medium text-center leading-tight"
                :class="
                  isMale(member)
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-pink-700 dark:text-pink-300'
                "
              >
                {{ displayName(member) }}
              </span>
            </div>

            <!-- Spouse card -->
            <template v-if="spouseName(member)">
              <span class="text-gray-400 text-xs mt-5">♥</span>
              <div class="flex flex-col items-center w-20">
                <img
                  :src="member.spousephoto || './photos/default.jpg'"
                  class="w-16 h-16 rounded-full border-2 object-cover"
                  :class="
                    isMale(member)
                      ? 'border-pink-300 dark:border-pink-700'
                      : 'border-blue-300 dark:border-blue-700'
                  "
                />
                <span
                  class="mt-1 text-xs font-medium text-center leading-tight"
                  :class="
                    isMale(member)
                      ? 'text-pink-700 dark:text-pink-300'
                      : 'text-blue-700 dark:text-blue-300'
                  "
                >
                  {{ spouseDisplayName(member) }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
