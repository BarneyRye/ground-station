import { createRootRoute, Outlet } from '@tanstack/react-router'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { IconType } from 'react-icons'
import { FaInstagram, FaLinkedin } from 'react-icons/fa'
import { UpdateBanner } from '@/components/update-banner'
import { Separator } from '@/ui/separator'

export const Route = createRootRoute({
  component: RootLayout,
})

interface Social {
  icon: IconType
  title: string
  link: string
}

const SOCIALS: Social[] = [
  {
    icon: FaInstagram,
    title: 'Instagram',
    link: 'https://www.instagram.com/seadreamrocketry/',
  },
  {
    icon: FaLinkedin,
    title: 'Linkedin',
    link: 'https://www.linkedin.com/company/seadream-rocketry',
  },
]

function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <UpdateBanner />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <footer className="shrink-0 text-muted-foreground">
        <Separator />
        <div className="p-4 grid grid-cols-2">
          <div className="text-left items-center font-bold">
            &copy; {new Date().getFullYear()} Seadream Rocketry
          </div>
          <div className="flex flex-row gap-8 justify-center">
            {SOCIALS.map((s) => (
              <a
                key={s.link}
                className="flex flex-row items-center gap-1 hover:text-primary font-bold"
                href={s.link}
                onClick={(event) => {
                  event.preventDefault()
                  openUrl(s.link)
                }}
              >
                <s.icon />
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
