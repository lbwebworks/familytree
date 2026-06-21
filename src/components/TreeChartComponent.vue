<script>
const CARD_WIDTH = 64
const SIBLING_GAP = 32
const LEVEL_GAP = 152
const TOP_PADDING = 24
const SIDE_PADDING = 24
const NODE_ANCHOR_Y = 86
const BOTTOM_PADDING = 24

export default {
  name: 'TreeChartComponent',
  props: {
    members: { type: Array, required: true },
    root: { type: Object, required: true },
    maxGenerations: { type: Number, default: 3 },
  },
  computed: {
    treeLayout() {
      const tree = this.buildTree(this.root, 0)
      this.measureTree(tree)

      const nodes = []
      const lines = []
      this.positionTree(tree, SIDE_PADDING, 0, nodes, lines)

      const maxDepth = nodes.reduce((deepest, node) => Math.max(deepest, node.depth), 0)

      return {
        nodes,
        lines,
        width: tree.subtreeWidth + SIDE_PADDING * 2,
        height: TOP_PADDING + maxDepth * LEVEL_GAP + NODE_ANCHOR_Y + BOTTOM_PADDING,
      }
    },
  },
  methods: {
    centerTree() {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller) return

        const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
        scroller.scrollLeft = maxScrollLeft / 2
      })
    },
    childrenOf(id) {
      return this.members
        .filter((c) => c.parent === id)
        .sort((a, b) => new Date(a.birthdate) - new Date(b.birthdate))
    },
    nodeWidth() {
      return CARD_WIDTH
    },
    spouseName(m) {
      const fullName = [m.spousefirstname, m.spousemiddlename, m.spouselastname].filter(Boolean).join(' ')
      return fullName || m.spousename || ''
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
    isRootMember(m) {
      return m?.id === this.root?.id
    },
    buildTree(member, depth) {
      const canDescend = depth + 1 < this.maxGenerations
      return {
        member,
        depth,
        children: canDescend
          ? this.childrenOf(member.id).map((child) => this.buildTree(child, depth + 1))
          : [],
        subtreeWidth: 0,
      }
    },
    measureTree(node) {
      const ownWidth = this.nodeWidth(node.member)
      if (!node.children.length) {
        node.subtreeWidth = ownWidth
        return ownWidth
      }

      const childrenWidth =
        node.children.reduce((total, child) => total + this.measureTree(child), 0) +
        SIBLING_GAP * (node.children.length - 1)

      node.subtreeWidth = Math.max(ownWidth, childrenWidth)
      return node.subtreeWidth
    },
    positionTree(node, left, depth, nodes, lines) {
      const ownWidth = this.nodeWidth(node.member)
      const top = TOP_PADDING + depth * LEVEL_GAP
      const centerX = left + node.subtreeWidth / 2

      const positionedNode = {
        member: node.member,
        depth,
        left: centerX - ownWidth / 2,
        top,
        width: ownWidth,
        anchorX: centerX,
        anchorTopY: top,
        anchorBottomY: top + NODE_ANCHOR_Y,
      }

      nodes.push(positionedNode)

      if (!node.children.length) {
        return positionedNode
      }

      const childrenWidth =
        node.children.reduce((total, child) => total + child.subtreeWidth, 0) +
        SIBLING_GAP * (node.children.length - 1)

      let childLeft = left + (node.subtreeWidth - childrenWidth) / 2
      const childNodes = node.children.map((child) => {
        const positionedChild = this.positionTree(child, childLeft, depth + 1, nodes, lines)
        childLeft += child.subtreeWidth + SIBLING_GAP
        return positionedChild
      })

      const midY = positionedNode.anchorBottomY + (childNodes[0].anchorTopY - positionedNode.anchorBottomY) / 2

      lines.push({
        x1: positionedNode.anchorX,
        y1: positionedNode.anchorBottomY,
        x2: positionedNode.anchorX,
        y2: midY,
      })

      lines.push({
        x1: childNodes[0].anchorX,
        y1: midY,
        x2: childNodes[childNodes.length - 1].anchorX,
        y2: midY,
      })

      childNodes.forEach((childNode) => {
        lines.push({
          x1: childNode.anchorX,
          y1: midY,
          x2: childNode.anchorX,
          y2: childNode.anchorTopY,
        })
      })

      return positionedNode
    },
  },
  mounted() {
    this.centerTree()
    window.addEventListener('resize', this.centerTree)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.centerTree)
  },
  watch: {
    members: {
      deep: true,
      handler() {
        this.centerTree()
      },
    },
    root() {
      this.centerTree()
    },
    maxGenerations() {
      this.centerTree()
    },
  },
}
</script>

<template>
  <div ref="scroller" class="overflow-x-auto">
    <div class="flex min-w-full justify-center">
      <div
        class="relative flex-none"
        :style="{ width: `${treeLayout.width}px`, height: `${treeLayout.height}px` }"
      >
      <!-- SVG overlay for connector lines -->
      <svg class="absolute inset-0 pointer-events-none" :width="treeLayout.width" :height="treeLayout.height">
        <line
          v-for="(line, i) in treeLayout.lines"
          :key="i"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="#9ca3af"
          stroke-width="2"
        />
      </svg>

      <div
        v-for="node in treeLayout.nodes"
        :key="node.member.id"
        class="absolute"
        :style="{ left: `${node.left}px`, top: `${node.top}px` }"
      >
        <div
          class="relative group flex flex-col items-center w-16"
        >
          <img
            :src="node.member.photo || './photos/default.jpg'"
            class="w-16 h-16 rounded-full border-2 object-cover"
            :class="
              isMale(node.member)
                ? 'border-blue-300 dark:border-blue-700'
                : 'border-pink-300 dark:border-pink-700'
            "
          />
          <span
            class="mt-1 text-xs font-medium text-center leading-tight"
            :class="
              isMale(node.member)
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-pink-700 dark:text-pink-300'
            "
          >
            {{ displayName(node.member) }}
          </span>

          <div
            v-if="spouseName(node.member)"
            :class="
              isRootMember(node.member)
                ? 'absolute left-full top-1/2 z-20 flex -translate-y-1/2 items-center'
                : 'absolute left-full top-1/2 z-20 flex -translate-y-1/2 items-center opacity-0 -translate-x-2 pointer-events-none transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:pointer-events-auto'
            "
          >
            <div class="ml-2 flex items-start gap-2">
              <span class="mt-5 text-gray-400 text-xs">♥</span>
              <div class="flex w-16 flex-col items-center">
                <img
                  :src="node.member.spousephoto || './photos/default.jpg'"
                  class="h-16 w-16 rounded-full border-2 object-cover"
                  :class="
                    isMale(node.member)
                      ? 'border-pink-300 dark:border-pink-700'
                      : 'border-blue-300 dark:border-blue-700'
                  "
                />
                <span
                  class="mt-1 text-center text-xs font-medium leading-tight"
                  :class="
                    isMale(node.member)
                      ? 'text-pink-700 dark:text-pink-300'
                      : 'text-blue-700 dark:text-blue-300'
                  "
                >
                  {{ spouseDisplayName(node.member) }}
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
