import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/coder')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/coder"!</div>
}
