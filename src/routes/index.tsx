import { createFileRoute } from '@tanstack/react-router'
import { openUrl } from '@tauri-apps/plugin-opener'
import seadreamlogo from '@/assets/seadreamlogo.png'
import { NavCard } from '@/components/nav'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        <a
          href="https://www.instagram.com/seadreamrocketry/"
          className="lg:basis-3/4 min-w-0"
          onClick={(event) => {
            event.preventDefault()
            openUrl('https://www.instagram.com/seadreamrocketry/')
          }}
        >
          <Card className="flex flex-row items-center h-full hover:border-primary">
            <img
              src={seadreamlogo}
              alt="Seadream logo"
              className="xl:w-32 w-16 shrink-0"
            />
            <h1 className="font-extrabold xl:text-7xl md:text-5xl text-2xl text-primary">
              Seadream Ground Station App
            </h1>
          </Card>
        </a>
        <Card className="lg:basis-1/4 min-w-0">
          <CardHeader>
            <CardTitle>About This App:</CardTitle>
            <CardDescription className="-mb-6">
              <p className="mb-2">
                This app serves as a basis for Seadream avionics control and
                data flow. It has been developed to work along side our range of
                custom avionics, for a range of utilities.
              </p>
              <p>
                It was built using the open source
                <a
                  href="https://v2.tauri.app"
                  className="font-semibold text-primary hover:text-foreground"
                  onClick={(event) => {
                    event.preventDefault()
                    openUrl('https://v2.tauri.app')
                  }}
                >
                  {' '}
                  Tauri V2{' '}
                </a>
                app development framework, with a react based frontend and rust
                backend.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full">
        <NavCard />
        <Card></Card>
        <Card></Card>
      </div>
    </div>
  )
}
