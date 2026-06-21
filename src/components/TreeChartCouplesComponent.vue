<script>
const CARD_WIDTH = 64
const SIBLING_GAP = 32
const LEVEL_GAP = 152
const TOP_PADDING = 24
const SIDE_PADDING = 24
const NODE_ANCHOR_Y = 86
// COUPLE_CONN_OFFSET removed — horizontal connector is disabled
const VERTICAL_START_OFFSET = 12
const PARENT_VERTICAL_LENGTH = 24
const CHILD_VERTICAL_LENGTH = 24
const BOTTOM_PADDING = 24

export default {
  name: 'TreeChartCouplesComponent',
  props: {
    members: { type: Array, required: true },
    root: { type: Object, required: true },
    maxGenerations: { type: Number, default: 3 },
    unions: { type: Array, default: () => [] },
  },
  computed: {
    treeLayout() {
      const tree = this.buildTree(this.root, 0)
      this.measureTree(tree)

      const nodes = []
      const lines = []
      this.positionTree(tree, SIDE_PADDING, 0, nodes, lines)

      const maxDepth = nodes.reduce((deepest, node) => Math.max(deepest, node.depth), 0)

      const maxRight = nodes.reduce((m, n) => Math.max(m, (n.left || 0) + (n.width || 0)), 0)
      const width = Math.max(tree.subtreeWidth, maxRight) + SIDE_PADDING * 2

      return {
        nodes,
        lines,
        width,
        height: TOP_PADDING + maxDepth * LEVEL_GAP + NODE_ANCHOR_Y + BOTTOM_PADDING,
      }
    },
  },
  methods: {
    setHover(id, on) {
      if (!this._hovered) this._hovered = new Set()
      if (on) this._hovered.add(id)
      else this._hovered.delete(id)
      this.$forceUpdate()
    },
    isHovered(id) {
      return !!(this._hovered && this._hovered.has(id))
    },
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
    unionsForMember(memberId) {
      const explicit = this.unions.filter((u) => u.partnerAId === memberId)
      if (explicit.length) return explicit
      const member = this.members.find((m) => m.id === memberId)
      if (!member) return []
      const hasChildren = this.members.some((m) => m.parent === memberId)
      const hasSpouse = member.spousefirstname || member.spouselastname
      if (hasChildren || hasSpouse) {
        return [{
          id: `_implicit_${memberId}`,
          partnerAId: memberId,
          partnerB: hasSpouse ? {
            firstname: member.spousefirstname || '',
            middlename: member.spousemiddlename || '',
            lastname: member.spouselastname || '',
            nickname: member.spousenickname || '',
            photo: member.spousephoto || '',
            gender: member.gender === 'Male' ? 'Female' : 'Male',
          } : null,
        }]
      }
      return []
    },
    childrenOfUnion(unionId, memberId) {
      const allChildren = this.childrenOf(memberId)
      const anyExplicit = allChildren.some((c) => c.unionId)
      if (anyExplicit) return allChildren.filter((c) => c.unionId === unionId)
      return allChildren
    },
    spouseDisplayNameFor(partnerB) {
      if (!partnerB) return '[Spouse]'
      return partnerB.nickname || partnerB.firstname || partnerB.lastname || '[Spouse]'
    },
    spouseIsMale(union) {
      if (union.partnerB?.gender) return union.partnerB.gender === 'Male'
      const a = this.members.find((m) => m.id === union.partnerAId)
      return a?.gender === 'Female'
    },
    nodeWidth(member) {
      // widen nodes slightly to accommodate couple visuals
      return CARD_WIDTH * 2
    },
    displayName(m) {
      return m.nickname || m.firstname || m.lastname || '[Member]'
    },
    isMale(m) {
      return m.gender !== 'Female'
    },
    isRootMember(m) {
      return m?.id === this.root?.id
    },
    getVisibleUnion(node) {
      if (!node || !node.union) return null
      const u = node.union
      if (u._alternates && u._alternates.length) {
        for (const alt of u._alternates) {
          if (alt._childIds && alt._childIds.some((id) => this.isHovered(id))) return alt
        }
        return null
      }
      // single union case
      return u
    },
    unionIsVisible(node) {
      if (!node || !node.union) return false
      // If this union is a placeholder with alternates (multi-spouse), only
      // show it when one of the alternates' children is hovered.
      if (node.union._alternates) {
        return !!this.getVisibleUnion(node)
      }
      // Single-spouse case: show the spouse normally (no hover required).
      return true
    },
    buildTree(member, depth) {
      const canDescend = depth + 1 < this.maxGenerations
      const memberUnions = this.unionsForMember(member.id)
      if (!canDescend || memberUnions.length === 0) {
        return { type: 'member', member, depth, union: null, children: [], subtreeWidth: 0 }
      }
      if (memberUnions.length === 1) {
        const union = memberUnions[0]
        const children = this.childrenOfUnion(union.id, member.id).map((c) => this.buildTree(c, depth + 1))
        // annotate union with its child ids for hover behavior
        union._childIds = this.childrenOfUnion(union.id, member.id).map((c) => c.id)
        return { type: 'member', member, depth, union, children, subtreeWidth: 0 }
      }
      // For members with multiple unions, only display a spouse if exactly
      // one spouse has children. If more than one spouse has children,
      // display no spouses (they're ambiguous as parents here).
      if (memberUnions.length > 1) {
        // build union nodes and annotate with child ids for hover
        const unionNodes = memberUnions.map((union) => {
          union._childIds = this.childrenOfUnion(union.id, member.id).map((c) => c.id)
          const childDepth = depth + 2
          const children = this.childrenOfUnion(union.id, member.id)
            .map((c) => (childDepth < this.maxGenerations ? this.buildTree(c, childDepth) : { type: 'member', member: c, depth: childDepth, union: null, children: [], subtreeWidth: 0 }))
          return { type: 'union', union, depth: depth + 1, children, subtreeWidth: 0 }
        })

        const unionsWithChildren = unionNodes.filter((u) => (u.children || []).length > 0)
        if (unionsWithChildren.length === 1) {
          // show the single spouse inline, but keep other spouses available as extras
          const shownUnion = unionsWithChildren[0]
          const extras = unionNodes.filter((u) => u.union.id !== shownUnion.union.id)
          return { type: 'member', member, depth, union: null, children: [shownUnion], extraSpouses: extras, subtreeWidth: 0 }
        }

        if (unionsWithChildren.length > 1) {
          // aggregate children from all unions and also provide spouse extras
          const aggregatedChildren = unionsWithChildren.flatMap((u) => this.childrenOfUnion(u.union.id, member.id))
          const childDepth = depth + 1
          const children = aggregatedChildren.map((c) => (childDepth < this.maxGenerations ? this.buildTree(c, childDepth) : { type: 'member', member: c, depth: childDepth, union: null, children: [], subtreeWidth: 0 }))
          return { type: 'member', member, depth, union: null, children, extraSpouses: unionNodes, subtreeWidth: 0 }
        }

        // no union children: still expose spouses as extras (hidden)
        return { type: 'member', member, depth, union: null, children: [], extraSpouses: unionNodes, subtreeWidth: 0 }
      }
      const unionNodes = memberUnions.map((union) => {
        union._childIds = this.childrenOfUnion(union.id, member.id).map((c) => c.id)
        const childDepth = depth + 2
        const children = this.childrenOfUnion(union.id, member.id)
          .map((c) => (childDepth < this.maxGenerations ? this.buildTree(c, childDepth) : { type: 'member', member: c, depth: childDepth, union: null, children: [], subtreeWidth: 0 }))
        return { type: 'union', union, depth: depth + 1, children, subtreeWidth: 0 }
      })
      return { type: 'member', member, depth, union: null, children: unionNodes, subtreeWidth: 0 }
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

      const leftPos = centerX - ownWidth / 2

      // If this member has a visible partner, anchorX should point to the
      // member's avatar center (left half of the node) rather than the node
      // center between the two avatars. The root member is an exception:
      // use the center anchor for the root so its children visually branch
      // from the tree center.
      const hasPartner = node.union && node.union.partnerB
      const isRoot = node.member && this.isRootMember(node.member)
      const anchorX = hasPartner && !isRoot ? leftPos + CARD_WIDTH / 2 : centerX

      const positionedNode = {
        type: node.type || 'member',
        member: node.member || null,
        union: node.union || null,
        depth,
        left: leftPos,
        top,
        width: ownWidth,
        anchorX,
        anchorTopY: top,
        anchorBottomY: top + NODE_ANCHOR_Y,
      }

      nodes.push(positionedNode)

      // If this member had "extraSpouses" in the build tree, attach a
      // single union placeholder to the positioned node and store the
      // alternates on it. This keeps the spouse visually in the partner
      // slot while allowing the image/name to swap on child hover.
      if (node.extraSpouses && node.extraSpouses.length && !positionedNode.union) {
        const alternates = node.extraSpouses.map((s) => s.union)
        positionedNode.union = {
          partnerB: alternates[0].partnerB,
          _alternates: alternates,
        }
      }

      if (!node.children.length) {
        return positionedNode
      }

      const childrenWidth =
        node.children.reduce((total, child) => total + child.subtreeWidth, 0) +
        SIBLING_GAP * (node.children.length - 1)

      let childLeft = left + (node.subtreeWidth - childrenWidth) / 2
      const childNodes = node.children.map((child) => {
        const childDepth = child.type === 'union' ? depth : depth + 1
        const positionedChild = this.positionTree(child, childLeft, childDepth, nodes, lines)
        childLeft += child.subtreeWidth + SIBLING_GAP
        return positionedChild
      })

      // Simpler connectors: for every child node draw a vertical line
      // centered above the child. Spouse visuals aren't separate nodes
      // so they will not get vertical lines.
      // Start parent verticals slightly below the visual couple horizontal
      // connector so they appear after the horizontal line. Use a named
      // offset for clarity and easy tuning.
      const startY = positionedNode.anchorBottomY + VERTICAL_START_OFFSET

      // Draw parent verticals using a fixed parent stub length.
      const parentEndY = startY + PARENT_VERTICAL_LENGTH

      // Draw parent vertical(s): for couples draw under each avatar, for single
      // members draw under the center.
      const leftAvatarX = positionedNode.left + (CARD_WIDTH - 12) / 2
      const rightAvatarX = positionedNode.left + positionedNode.width - (CARD_WIDTH - 12) / 2
      if (node.union && node.union.partnerB) {
        lines.push({ x1: leftAvatarX, y1: startY, x2: leftAvatarX, y2: parentEndY })
        lines.push({ x1: rightAvatarX, y1: startY, x2: rightAvatarX, y2: parentEndY })
      } else {
        lines.push({ x1: positionedNode.anchorX, y1: startY, x2: positionedNode.anchorX, y2: parentEndY })
      }

      // Exclude union nodes (spouses) from child connectors — spouses are
      // shown on the same row as the member and should not receive vertical
      // child lines.
      const memberChildNodes = childNodes.filter((c) => c.type !== 'union')
      if (!memberChildNodes.length) return positionedNode

      // Compute child center Xs and child stub starts
      const childCenters = memberChildNodes.map((childNode) => {
        const childHasPartner = childNode.union && childNode.union.partnerB
        const cx = childHasPartner ? childNode.left + (CARD_WIDTH - 12) / 2 : childNode.left + childNode.width / 2
        const childStartY = childNode.anchorTopY - CHILD_VERTICAL_LENGTH
        return { childNode, cx, childStartY }
      })

      if (memberChildNodes.length === 1) {
        // Single child: draw horizontal between parents (if couple), else
        // draw short horizontal at parent anchor.
        if (node.union && node.union.partnerB) {
          lines.push({ x1: leftAvatarX, y1: parentEndY, x2: rightAvatarX, y2: parentEndY })
        } else {
          lines.push({ x1: positionedNode.anchorX - 8, y1: parentEndY, x2: positionedNode.anchorX + 8, y2: parentEndY })
        }
        // Connect horizontal to the child stub if needed
        const { cx, childStartY } = childCenters[0]
        if (childStartY > parentEndY) {
          lines.push({ x1: cx, y1: parentEndY, x2: cx, y2: childStartY })
        }
      } else {
        // Multiple children: horizontal from left-most to right-most child
        const xs = childCenters.map((c) => c.cx)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        lines.push({ x1: minX, y1: parentEndY, x2: maxX, y2: parentEndY })
        // vertical connectors from the horizontal down to each child's stub
        childCenters.forEach(({ cx, childStartY }) => {
          if (childStartY > parentEndY) lines.push({ x1: cx, y1: parentEndY, x2: cx, y2: childStartY })
        })
      }

      // Finally draw child stub down to child anchor
      childCenters.forEach(({ childNode, cx, childStartY }) => {
        lines.push({ x1: cx, y1: childStartY, x2: cx, y2: childNode.anchorTopY })
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
    <div class="flex justify-center" :style="{ minWidth: `${treeLayout.width}px` }">
      <div
        class="relative"
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
        :key="node.member ? node.member.id : node.union.id"
        class="absolute"
        :style="{ left: `${node.left}px`, top: `${node.top}px`, width: `${node.width}px` }"
        @mouseenter="node.member && setHover(node.member.id, true)"
        @mouseleave="node.member && setHover(node.member.id, false)"
      >
          <div v-if="node.type === 'union'" class="flex flex-col items-center w-16"
               :style="{ opacity: unionIsVisible(node) ? 1 : 0, pointerEvents: unionIsVisible(node) ? 'auto' : 'none', transition: 'opacity .12s' }">
            <img
              :src="(getVisibleUnion(node)?.partnerB?.photo) || './photos/default.jpg'"
              class="w-16 h-16 rounded-full border-2 object-cover"
              :class="(getVisibleUnion(node) && spouseIsMale({ partnerB: getVisibleUnion(node).partnerB })) ? 'border-blue-300 dark:border-blue-700' : 'border-pink-300 dark:border-pink-700'"
            />
            <span
              class="mt-1 text-xs font-medium text-center leading-tight"
              :class="(getVisibleUnion(node) && spouseIsMale({ partnerB: getVisibleUnion(node).partnerB })) ? 'text-blue-700 dark:text-blue-300' : 'text-pink-700 dark:text-pink-300'">
              {{ spouseDisplayNameFor(getVisibleUnion(node)?.partnerB) }}
            </span>
          </div>

        <!-- Member node with couple visualization -->
        <div v-else class="flex items-center justify-center">
          <div class="flex items-center gap-3">
            <!-- Member avatar -->
            <div class="flex flex-col items-center w-16">
              <img
                :src="node.member.photo || './photos/default.jpg'"
                class="w-16 h-16 rounded-full border-2 object-cover"
                :class="isMale(node.member) ? 'border-blue-300 dark:border-blue-700' : 'border-pink-300 dark:border-pink-700'"
              />
              <span class="mt-1 text-xs font-medium text-center leading-tight"
                    :class="isMale(node.member) ? 'text-blue-700 dark:text-blue-300' : 'text-pink-700 dark:text-pink-300'">
                {{ displayName(node.member) }}
              </span>
            </div>

            <!-- Partner avatar (if any) - always rendered so it keeps space; visibility toggled -->
            <div v-if="node.union && node.union.partnerB"
                 class="flex flex-col items-center w-16"
                 :style="{ opacity: unionIsVisible(node) ? 1 : 0, pointerEvents: unionIsVisible(node) ? 'auto' : 'none', transition: 'opacity .12s' }">
              <img
                :src="getVisibleUnion(node)?.partnerB?.photo || './photos/default.jpg'"
                class="w-16 h-16 rounded-full border-2 object-cover"
                :class="(getVisibleUnion(node) && spouseIsMale(getVisibleUnion(node))) ? 'border-blue-300 dark:border-blue-700' : 'border-pink-300 dark:border-pink-700'"
              />
              <span class="mt-1 text-xs font-medium text-center leading-tight"
                    :class="(getVisibleUnion(node) && spouseIsMale(getVisibleUnion(node))) ? 'text-blue-700 dark:text-blue-300' : 'text-pink-700 dark:text-pink-300'">
                {{ spouseDisplayNameFor(getVisibleUnion(node)?.partnerB) }}
              </span>
            </div>
          </div>

          <!-- horizontal couple connector removed -->
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
