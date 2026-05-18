import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Node, Parent } from 'unist'

interface HastElement extends Parent {
  type: 'element'
  tagName: string
  properties?: Record<string, unknown>
  children: Node[]
}

const isElement = (node: Node | undefined): node is HastElement =>
  node?.type === 'element' && 'tagName' in node

const hasClass = (node: HastElement, className: string): boolean => {
  const value = node.properties?.className

  if (Array.isArray(value)) {
    return value.includes(className)
  }

  return typeof value === 'string' && value.split(/\s+/).includes(className)
}

export const rehypeWrapTables: Plugin<[], Node> = function rehypeWrapTables() {
  return function transformer(tree: Node) {
    visit(tree, 'element', (node: Node, index: number | undefined, parent: Parent | undefined) => {
      if (!isElement(node) || node.tagName !== 'table' || index === undefined || !parent) {
        return
      }

      if (isElement(parent) && hasClass(parent, 'table-scroll')) {
        return
      }

      const wrapper: HastElement = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      }

      parent.children[index] = wrapper
    })
  }
}
