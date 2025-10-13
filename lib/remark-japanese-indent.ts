import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Paragraph, Text } from 'mdast'

/**
 * Remark plugin to detect Japanese full-width space (　U+3000) indentation
 * at the start of paragraphs and add a CSS class for styling.
 *
 * This plugin checks if a paragraph starts with a full-width space and:
 * 1. Removes the leading full-width space from the text
 * 2. Adds 'indent-ja' class to the paragraph for CSS styling
 */
export const remarkJapaneseIndent: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      // Check if the first child is a text node
      if (node.children && node.children.length > 0) {
        const firstChild = node.children[0]

        if (firstChild.type === 'text') {
          const textNode = firstChild as Text

          // Check if text starts with full-width space (　U+3000)
          if (textNode.value.startsWith('\u3000')) {
            // Remove the leading full-width space
            textNode.value = textNode.value.substring(1)

            // Add class for CSS styling
            if (!node.data) {
              node.data = {}
            }
            if (!node.data.hProperties) {
              node.data.hProperties = {}
            }

            const hProps = node.data.hProperties as Record<string, unknown>
            if (!hProps.className) {
              hProps.className = []
            }

            const classNames = hProps.className as string[]
            if (!classNames.includes('indent-ja')) {
              classNames.push('indent-ja')
            }
          }
        }
      }
    })
  }
}
