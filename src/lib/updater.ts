import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { useCallback, useEffect, useState } from 'react'

export type UpdateStage =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error'

export interface UpdaterState {
  stage: UpdateStage
  version: string | null
  notes: string | null
  progress: number
  error: string | null
  install: () => void
  dismiss: () => void
}

export function useUpdater(): UpdaterState {
  const [stage, setStage] = useState<UpdateStage>('idle')
  const [update, setUpdate] = useState<Update | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setStage('checking')
    check()
      .then((found) => {
        if (cancelled) return
        if (found) {
          setUpdate(found)
          setStage('available')
        } else {
          setStage('idle')
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e))
        setStage('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const install = useCallback(() => {
    if (!update) return

    let downloaded = 0
    let total = 0

    setStage('downloading')
    setProgress(0)

    update
      .downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            if (total > 0) setProgress(downloaded / total)
            break
          case 'Finished':
            setProgress(1)
            setStage('installing')
            break
        }
      })
      .then(() => relaunch())
      .catch((e) => {
        setError(String(e))
        setStage('error')
      })
  }, [update])

  const dismiss = useCallback(() => {
    setStage('idle')
    setError(null)
  }, [])

  return {
    stage,
    version: update?.version ?? null,
    notes: update?.body ?? null,
    progress,
    error,
    install,
    dismiss,
  }
}
