import { DownloadIcon, XIcon } from 'lucide-react'
import { useUpdater } from '@/lib/updater'
import { Button } from '@/ui/button'
import { Spinner } from '@/ui/spinner'

export function UpdateBanner() {
  const { stage, version, progress, error, install, dismiss } = useUpdater()

  if (stage === 'idle' || stage === 'checking') return null

  return (
    <div className="flex shrink-0 items-center gap-3 border-b bg-secondary px-4 py-2 text-sm text-secondary-foreground">
      {stage === 'available' && (
        <>
          <DownloadIcon className="size-4" />
          <span className="flex-1">Version {version} is available.</span>
          <Button size="sm" onClick={install}>
            Update and restart
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={dismiss}>
            <XIcon />
          </Button>
        </>
      )}

      {stage === 'downloading' && (
        <>
          <Spinner />
          <span className="flex-1">
            Downloading {version} ({Math.round(progress * 100)}%)
          </span>
        </>
      )}

      {stage === 'installing' && (
        <>
          <Spinner />
          <span className="flex-1">
            Installing {version}, restarting shortly.
          </span>
        </>
      )}

      {stage === 'error' && (
        <>
          <span className="flex-1 text-destructive">
            Update failed: {error}
          </span>
          <Button size="icon-sm" variant="ghost" onClick={dismiss}>
            <XIcon />
          </Button>
        </>
      )}
    </div>
  )
}
