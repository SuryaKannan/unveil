**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads)
for issue tracking. Use `bd` commands instead of markdown TODOs.
See AGENTS.md for workflow details.

# Unveil: Semantic Diagramming for AI-Assisted Development

## Project Vision

Unveil is a VSCode extension that combines two complementary ideas:

1. **Infinite Nested Canvases**: A diagramming tool where any object can contain its own canvas, allowing users to think and draw at multiple levels of abstraction. Zoom into any shape to reveal its internal structure, infinitely.

2. **Semantic Diagram Export (TOON format)**: A structured text representation of diagrams that captures semantic relationships, not just visual layout. This allows LLMs to understand diagrams without expensive image tokens or lossy visual inference.

The goal: draw visually, export semantically. The user thinks in pictures; the AI reads structured relationships.

## Core Concepts

### Nested Canvases (Zooming UI)

- Any node/shape can be "entered" to reveal an inner canvas
- Breadcrumb navigation shows current depth path
- Virtualized rendering (only render visible zoom level)
- Parent-child containment is semantic, not just visual grouping

### TOON Format

TOON (Text Object-Oriented Notation) is a human-readable, LLM-friendly format for representing diagrams semantically.

Example output for an architecture diagram:

```
@canvas: AuthSystem (depth: 0)

[Service: AuthService]
  type: service
  contains:
    - [Component: TokenValidator]
    - [Component: SessionManager]
  connects_to:
    - [Database: UserDB] (relationship: "reads credentials", protocol: "postgres")
  exposes:
    - [API: /api/auth] (protocol: "REST", methods: ["POST"])

[Component: TokenValidator]
  type: component
  parent: AuthService
  connects_to:
    - [Component: SessionManager] (relationship: "validates for")

[Database: UserDB]
  type: database
  engine: postgres
  connects_to:
    - [External: IdentityProvider] (relationship: "syncs from", frequency: "daily")
```

### TOON Format Specification (Draft v0.1)

```typescript
interface ToonDocument {
  version: "0.1";
  canvas: ToonCanvas;
}

interface ToonCanvas {
  id: string;
  name: string;
  nodes: ToonNode[];
  connections: ToonConnection[];
}

interface ToonNode {
  id: string;
  type: string;           // user-defined: service, component, database, api, actor, etc.
  label: string;
  properties: Record<string, any>;  // arbitrary metadata
  children?: ToonCanvas;  // nested canvas (recursive)
  position: { x: number; y: number };  // visual position (optional in export)
  size: { width: number; height: number };
}

interface ToonConnection {
  id: string;
  from: string;           // node id
  to: string;             // node id
  relationship: string;   // user-defined: "calls", "reads from", "authenticates", etc.
  properties: Record<string, any>;  // protocol, async, etc.
  label?: string;         // visual label
}
```

### Export Depth Control

When exporting TOON, users can specify depth:
- `depth: 0` — Just the selected node(s) and their direct connections
- `depth: 1` — Include one level of children
- `depth: 2` — Two levels deep
- `depth: -1` — Full recursive export

## VSCode Extension Architecture

```
toon-vscode/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── canvas/
│   │   ├── ToonEditorProvider.ts # Custom editor for .toon files
│   │   ├── webview/              # React/tldraw canvas app
│   │   │   ├── App.tsx
│   │   │   ├── canvas/
│   │   │   │   ├── ToonCanvas.tsx
│   │   │   │   ├── NestedNavigation.tsx
│   │   │   │   └── NodePalette.tsx
│   │   │   └── index.html
│   │   └── messages.ts           # Webview <-> Extension messaging
│   ├── toon/
│   │   ├── ToonDocument.ts       # Document model
│   │   ├── ToonExporter.ts       # Export to TOON text format
│   │   ├── ToonParser.ts         # Parse TOON text (for AI responses)
│   │   └── types.ts              # TypeScript interfaces
│   ├── ai/
│   │   ├── ChatParticipant.ts    # @toon Copilot chat participant
│   │   └── McpServer.ts          # MCP server for Claude Code
│   └── commands/
│       ├── exportSelection.ts
│       ├── copyToonToClipboard.ts
│       └── insertFromAI.ts       # Parse AI TOON response into canvas
├── webview-ui/                   # Separate build for canvas UI
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── package.json
├── tsconfig.json
└── README.md
```

## AI Integration Points

### 1. Copilot Chat Participant (@toon)

Register a chat participant that injects TOON context:

```typescript
// src/ai/ChatParticipant.ts
import * as vscode from 'vscode';

export function registerToonParticipant(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant('toon', async (request, context, response, token) => {
    // Get current selection from active TOON editor
    const toonContext = await getSelectedToonContext();
    
    const prompt = `
You have access to the following system design context in TOON format:

\`\`\`toon
${toonContext}
\`\`\`

User question: ${request.prompt}

When suggesting changes to the design, output them in TOON format so they can be imported back into the diagram.
`;
    
    const modelResponse = await request.model.sendRequest([
      vscode.LanguageModelChatMessage.User(prompt)
    ], {}, token);
    
    for await (const chunk of modelResponse.text) {
      response.markdown(chunk);
    }
  });
  
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
  context.subscriptions.push(participant);
}
```

### 2. MCP Server for Claude Code

Expose TOON context via MCP so Claude Code can request diagram context:

```typescript
// Tools to expose:
{
  name: "get_toon_context",
  description: "Get semantic diagram context from a .toon file or current selection",
  input_schema: {
    type: "object",
    properties: {
      file: { type: "string", description: "Path to .toon file (optional, uses active editor if not specified)" },
      selection: { type: "array", items: { type: "string" }, description: "Node IDs to export (optional, exports all if not specified)" },
      depth: { type: "number", description: "How many levels of nesting to include (default: 2, use -1 for infinite)" }
    }
  }
},
{
  name: "list_toon_files",
  description: "List all .toon diagram files in the workspace",
  input_schema: { type: "object", properties: {} }
},
{
  name: "get_node_details",
  description: "Get detailed information about a specific node and its connections",
  input_schema: {
    type: "object",
    properties: {
      file: { type: "string" },
      nodeId: { type: "string" }
    },
    required: ["nodeId"]
  }
}
```

### 3. Commands

- `toon.exportSelection` — Export selected nodes to TOON format
- `toon.copyToClipboard` — Copy TOON to clipboard for pasting into chat
- `toon.importFromClipboard` — Parse TOON from clipboard and add to canvas
- `toon.openPreview` — Side-by-side TOON text preview

## Rendering Technology

Recommended stack for the canvas webview:

- **tldraw** — Full-featured canvas with selection, zoom, pan, shape tools
  - Fork or extend for nested canvas support
  - Already has good VSCode webview examples
- **Alternative: Konva.js + React-Konva** — More control, less out-of-the-box features

For nested canvas navigation:
- Double-click node → transition into child canvas
- Breadcrumb bar at top for navigation
- Minimap showing position in hierarchy (future)

## File Format

Store diagrams as `.toon` files (JSON):

```json
{
  "version": "0.1",
  "canvas": {
    "id": "root",
    "name": "System Architecture",
    "nodes": [
      {
        "id": "auth-service",
        "type": "service",
        "label": "AuthService",
        "position": { "x": 100, "y": 100 },
        "size": { "width": 200, "height": 100 },
        "properties": { "language": "typescript" },
        "children": {
          "id": "auth-service-inner",
          "name": "AuthService Internals",
          "nodes": [...],
          "connections": [...]
        }
      }
    ],
    "connections": [
      {
        "id": "conn-1",
        "from": "auth-service",
        "to": "user-db",
        "relationship": "reads from",
        "properties": { "protocol": "postgres" }
      }
    ]
  }
}
```

## Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] VSCode extension scaffold with custom editor for `.toon` files
- [ ] Basic canvas with tldraw in webview
- [ ] Node types: box, database, actor, api (simple palette)
- [ ] Connections with labels
- [ ] Save/load `.toon` JSON files
- [ ] TOON text export (flat, no nesting)
- [ ] Copy TOON to clipboard command

### Phase 2: AI Integration
- [ ] `@toon` Copilot chat participant
- [ ] Context injection from current selection
- [ ] Parse TOON from AI response and highlight/suggest additions
- [ ] MCP server for Claude Code integration

### Phase 3: Nested Canvases
- [ ] Double-click to enter node's child canvas
- [ ] Breadcrumb navigation
- [ ] Depth-aware TOON export
- [ ] Visual indicator for nodes that contain children

### Phase 4: Polish
- [ ] More node types and icons
- [ ] Custom node type definitions per project
- [ ] Minimap / hierarchy overview panel
- [ ] Collaboration via file sync (git-friendly format)
- [ ] Import from other formats (Mermaid, PlantUML)

## Development Notes

### Setting up the extension

```bash
# Scaffold
npm install -g yo generator-code
yo code  # Select "New Extension (TypeScript)"

# Key dependencies
npm install @anthropic-ai/sdk  # For MCP server
npm install @tldraw/tldraw     # Canvas (or build custom)
```

### Webview communication pattern

```typescript
// Extension -> Webview
panel.webview.postMessage({ type: 'loadDocument', data: toonDoc });

// Webview -> Extension
vscode.postMessage({ type: 'documentChanged', data: updatedDoc });

// In extension
panel.webview.onDidReceiveMessage(message => {
  switch (message.type) {
    case 'documentChanged':
      updateDocument(message.data);
      break;
    case 'requestExport':
      const toon = exportToToon(message.selection);
      panel.webview.postMessage({ type: 'exportResult', data: toon });
      break;
  }
});
```

## Open Questions

1. **TOON format stability** — Should we version the format from day 1? Probably yes.
2. **Bidirectional sync** — Can AI suggest TOON changes that auto-update the diagram? Complex but powerful.
3. **Type definitions** — Should node types be project-specific (defined in a `.toon-types.json`)?
4. **Mermaid interop** — Worth supporting Mermaid import/export for adoption?

## Resources

- [VSCode Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [VSCode Chat Participant API](https://code.visualstudio.com/api/extension-guides/chat)
- [tldraw](https://github.com/tldraw/tldraw)
- [MCP Specification](https://modelcontextprotocol.io/)
