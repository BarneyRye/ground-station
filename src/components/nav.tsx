import { NAV } from '@/lib/nav'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card'

export function NavCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>App Navigation</CardTitle>
        <CardDescription>
          A list of all the pages and functionailty of this app
        </CardDescription>
      </CardHeader>
      <CardContent>
        {NAV.map((nav) =>
          nav.name === 'Dashboard' ? null : (
            <a key={nav.to as string} href={nav.to as string} className="block">
              <Card className="hover:border-primary text-muted-foreground p-2 mb-4 w-full">
                <CardHeader>
                  <CardTitle className="flex flex-row gap-4 items-center">
                    <nav.icon />
                    <span className="text-primary">{nav.name}</span>
                  </CardTitle>
                  <CardDescription>{nav.desc}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          ),
        )}
      </CardContent>
    </Card>
  )
}
