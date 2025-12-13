import type { Editor } from 'tldraw'
import type { ToonDocument } from './types'


export function exportToToon(editor: Editor): ToonDocument {

  const shapes = editor.getCurrentPageShapes()
  console.log('Shapes to export:', shapes)

  return {
    version: '0.1',
    canvas: {
      id: 'root',
      name: 'Untitled Canvas',
      nodes: [],
      connections: [],
    },
  }
}


export function toonToText(doc: ToonDocument): string {
  return `@canvas: ${doc.canvas.name} (depth: 0)\n\n// TODO: Format nodes and connections`
}
