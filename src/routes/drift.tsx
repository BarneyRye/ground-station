import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/drift')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/drift"!</div>
}
