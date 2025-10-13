import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Paragraph, Text } from 'mdast'

type ClassNameValue = string | string[] | undefined

const ensureClassNameArray = (value: ClassNameValue): string[] => {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean)
  }

  return []
}

/**
 * Remark plugin to detect Japanese full-width space (　U+3000) indentation
 * at the start of paragraphs and add a CSS class for styling.
 *
 * This plugin checks if a paragraph starts with a full-width space and:
 * 1. Removes the leading full-width space from the text
 * 2. Adds 'indent-ja' class to the paragraph for CSS styling
 */
export const remarkJapaneseIndent: Plugin<[], Root> = function remarkJapaneseIndent() {
  return function transformer(tree: Root) {
    visit(tree, 'paragraph', (node: Paragraph) => {
      const firstChild = node.children?.[0]
      if (!firstChild || firstChild.type !== 'text') {
        return
      }

      const textNode = firstChild as Text

      if (!textNode.value.startsWith('\u3000')) {
        return
      }

      textNode.value = textNode.value.substring(1)

      if (!node.data) {
        node.data = {}
      }
      if (!node.data.hProperties) {
        node.data.hProperties = {}
      }

      const hProps = node.data.hProperties as Record<string, unknown>
      const classNames = ensureClassNameArray(hProps.className as ClassNameValue)

      if (!classNames.includes('indent-ja')) {
        classNames.push('indent-ja')
      }

      hProps.className = classNames
    })
  }
}
