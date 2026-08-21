import { createRootRoute, Outlet } from '@tanstack/react-router'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { IconType } from 'react-icons'
import { FaInstagram, FaLinkedin } from 'react-icons/fa'
import { HomeButton } from '@/components/homebutton'
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
    <div className="flex h-dvh flex-col overflow-hidden">
      <UpdateBanner />
      <main className="min-h-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
      <footer className="shrink-0 text-muted-foreground">
        <Separator />
        <div className="p-4 grid grid-cols-3">
          <div className="flex items-center font-bold">
            &copy; {new Date().getFullYear()} Seadream Rocketry
          </div>
          <div className="flex flex-row gap-8 justify-center items-center">
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
          <div className="flex items-center justify-end">
            <HomeButton />
          </div>
        </div>
      </footer>
    </div>
  )
}
