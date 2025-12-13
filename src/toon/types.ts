export interface ToonDocument {
  version: '0.1'
  canvas: ToonCanvas
}

export interface ToonCanvas {
  id: string
  name: string
  nodes: ToonNode[]
  connections: ToonConnection[]
}

export interface ToonNode {
  id: string
  type: string 
  label: string
  properties: Record<string, unknown> 
  children?: ToonCanvas
}

export interface ToonConnection {
  id: string
  from: string 
  to: string 
  relationship: string 
  properties: Record<string, unknown>
  label?: string
}