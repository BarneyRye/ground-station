import { createFileRoute } from '@tanstack/react-router'
import { downloadDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { useState } from 'react'
import { Button } from '@/ui/button'

export const Route = createFileRoute('/blackbox')({
  component: RouteComponent,
})

function RouteComponent() {
  const [log_path, setLogPath] = useState('')

  async function selectFile() {
    const file = await open({
      multiple: false,
      directory: false,
      filters: [{ name: '', extensions: ['bin'] }],
      defaultPath: await downloadDir(),
    })
    file && setLogPath(file)
  }

  return (
    <div>
      <Button onClick={selectFile}>File</Button>
      {log_path && <p className="text-muted-foreground text-sm">{log_path}</p>}
    </div>
  )
}
