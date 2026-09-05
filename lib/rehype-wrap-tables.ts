import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Element, Root } from 'hast'

const hasClass = (node: Element, className: string): boolean => {
  const value = node.properties?.className

  if (Array.isArray(value)) {
    return value.includes(className)
  }

  return false
}

export const rehypeWrapTables: Plugin<[], Root> = function rehypeWrapTables() {
  return function wrapTables(tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || index === undefined || !parent) {
        return
      }

      if (parent.type === 'element' && hasClass(parent, 'table-scroll')) {
        return
      }

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      }

      parent.children[index] = wrapper
    })
  }
}
