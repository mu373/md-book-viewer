export type MathMacros = Record<string, string>

interface ExtractedMathMacros {
  content: string
  macros: MathMacros
}

interface BracedArgument {
  value: string
  end: number
}

const DISPLAY_MATH_BLOCK = /(^|\n)([ \t]*)\$\$\s*\n([\s\S]*?)\n[ \t]*\$\$(?=\n|$)/g
const MACRO_DEFINITION_COMMAND = /^\\(?:DeclareMathOperator\*?|(?:re)?newcommand\*?|def)(?=\s|{|\\)/

function isMacroDefinitionLine(line: string): boolean {
  const trimmed = line.trim()

  return (
    trimmed.length === 0 ||
    trimmed.startsWith('%') ||
    MACRO_DEFINITION_COMMAND.test(trimmed)
  )
}

function isMacroDefinitionBlock(body: string): boolean {
  const lines = body.split('\n')
  const hasMacro = lines.some((line) => MACRO_DEFINITION_COMMAND.test(line.trim()))

  return hasMacro && lines.every(isMacroDefinitionLine)
}

function skipWhitespace(input: string, start: number): number {
  let index = start

  while (index < input.length && /\s/.test(input[index])) {
    index += 1
  }

  return index
}

function skipOptionalArguments(input: string, start: number): number {
  let index = skipWhitespace(input, start)

  while (input[index] === '[') {
    index += 1
    while (index < input.length && input[index] !== ']') {
      index += input[index] === '\\' ? 2 : 1
    }
    if (input[index] === ']') {
      index += 1
    }
    index = skipWhitespace(input, index)
  }

  return index
}

function readBracedArgument(input: string, start: number): BracedArgument | null {
  let index = skipWhitespace(input, start)

  if (input[index] !== '{') {
    return null
  }

  let depth = 0
  const valueStart = index + 1

  while (index < input.length) {
    const char = input[index]

    if (char === '\\') {
      index += 2
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return {
          value: input.slice(valueStart, index),
          end: index + 1,
        }
      }
    }

    index += 1
  }

  return null
}

function readCommandName(input: string, start: number): BracedArgument | null {
  const index = skipWhitespace(input, start)
  const braced = readBracedArgument(input, index)

  if (braced) {
    return braced
  }

  const match = input.slice(index).match(/^\\[A-Za-z@]+/)

  if (!match) {
    return null
  }

  return {
    value: match[0],
    end: index + match[0].length,
  }
}

function parseDeclareMathOperator(line: string): MathMacros {
  const match = line.match(/^\\DeclareMathOperator(\*)?/)

  if (!match) {
    return {}
  }

  const command = readBracedArgument(line, match[0].length)
  if (!command) {
    return {}
  }

  const body = readBracedArgument(line, command.end)
  if (!body) {
    return {}
  }

  return {
    [command.value.trim()]: match[1]
      ? `\\operatorname*{${body.value}}`
      : `\\operatorname{${body.value}}`,
  }
}

function parseNewCommand(line: string): MathMacros {
  const match = line.match(/^\\(?:re)?newcommand\*?/)

  if (!match) {
    return {}
  }

  const command = readCommandName(line, match[0].length)
  if (!command) {
    return {}
  }

  const bodyStart = skipOptionalArguments(line, command.end)
  const body = readBracedArgument(line, bodyStart)
  if (!body) {
    return {}
  }

  return {
    [command.value.trim()]: body.value,
  }
}

function parseDef(line: string): MathMacros {
  const match = line.match(/^\\def\s*(\\[A-Za-z@]+)/)

  if (!match) {
    return {}
  }

  const body = readBracedArgument(line, match[0].length)
  if (!body) {
    return {}
  }

  return {
    [match[1]]: body.value,
  }
}

function extractMacrosFromBlock(body: string): MathMacros {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('%'))
    .reduce<MathMacros>((macros, line) => {
      return {
        ...macros,
        ...parseDeclareMathOperator(line),
        ...parseNewCommand(line),
        ...parseDef(line),
      }
    }, {})
}

export function extractMathMacros(content: string): ExtractedMathMacros {
  const macros: MathMacros = {}

  const strippedContent = content.replace(DISPLAY_MATH_BLOCK, (match, leadingNewline, indent, body) => {
    if (!isMacroDefinitionBlock(body)) {
      return match
    }

    Object.assign(macros, extractMacrosFromBlock(body))
    return leadingNewline
  })

  return {
    content: strippedContent,
    macros,
  }
}
