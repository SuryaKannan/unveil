import { Tldraw, Editor } from 'tldraw'
import { exportToToon } from './toon/exporter'
import 'tldraw/tldraw.css'

export default function App() {

  const handleMount = (editor: Editor) => {

    editor.store.listen(()=> {
      const toon = exportToToon(editor)

      console.log("Toon export: ", toon)
    })

  }
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw onMount={handleMount}/>
    </div>
  )
}
