import { Link } from '@tanstack/react-router'
import { PanelsTopLeftIcon } from 'lucide-react'
import { Button } from '@/ui/button'

export function HomeButton() {
  return (
    <Button
      asChild
      className="border-5 hover:bg-foreground hover:border-primary text-2xl rounded-xl items-center h-auto py-3"
    >
      <Link to="/">
        <PanelsTopLeftIcon className="size-7" />
        Dashboard
      </Link>
    </Button>
  )
}
