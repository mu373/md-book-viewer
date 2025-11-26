import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Text, Break } from 'mdast'

/**
 * A remark plugin that converts single line breaks into hard breaks
 * This allows single newlines to create new paragraphs instead of requiring double newlines
 */
export const remarkSingleLineBreaks: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return

      const text = node.value
      const lines = text.split('\n')
      
      if (lines.length === 1) return // No line breaks in this text node

      // Replace the text node with alternating text and break nodes
      const newNodes: (Text | Break)[] = []
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] || i === 0 || i === lines.length - 1) {
          // Add text node if there's content or it's the first/last line
          newNodes.push({
            type: 'text',
            value: lines[i]
          })
        }
        
        // Add break node between lines (except after the last line)
        if (i < lines.length - 1) {
          newNodes.push({
            type: 'break'
          })
        }
      }

      // Replace the current node with the new nodes
      parent.children.splice(index, 1, ...newNodes)
    })
  }
}