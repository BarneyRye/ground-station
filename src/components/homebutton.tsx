import { Link } from '@tanstack/react-router'
import { PanelsTopLeftIcon } from 'lucide-react'
import { Button } from '@/ui/button'

export function HomeButton() {
  return (
    <Button
      asChild
      className="border-5 border-transparent hover:bg-foreground hover:border-primary text-xl rounded-xl items-center w-40 h-10"
    >
      <Link to="/">
        <PanelsTopLeftIcon className="size-5" />
        Dashboard
      </Link>
    </Button>
  )
}
