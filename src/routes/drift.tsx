import { createFileRoute, Link } from '@tanstack/react-router'
import { WindIcon } from 'lucide-react'
import { useState } from 'react'
import { driftCalc } from '@/api/api'
import { type RocketDrift, toTimeStamp } from '@/lib/drift-calc'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Field, FieldLabel } from '@/ui/field'
import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Spinner } from '@/ui/spinner'

export const Route = createFileRoute('/drift')({
  component: RouteComponent,
})

interface LaunchSite {
  name: string
  lat: number
  lon: number
}

const CUSTOM_SITE = 'Custom'

const LAUNCH_SITES: LaunchSite[] = [
  { name: CUSTOM_SITE, lat: 0, lon: 0 },
  { name: 'MRC', lat: 52.659767, lon: -1.525834 },
  { name: 'EARS', lat: 52.2582, lon: 0.0937 },
]

const HOURS = Array.from({ length: 24 }, (_, h) => h)

const COMPASS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
]

function cardinal(bearing: number) {
  return COMPASS[Math.round(bearing / 22.5) % 16]
}

function formatDistance(metres: number) {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(2)} km`
    : `${metres.toFixed(0)} m`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function RouteComponent() {
  const [site, setSite] = useState<string>(CUSTOM_SITE)
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [date, setDate] = useState<string>(today())
  const [hour, setHour] = useState<string>('12')

  const [apogee, setApogee] = useState<string>('')
  const [descentRate, setDescentRate] = useState<string>('')
  const [drogue, setDrogue] = useState<boolean>(false)
  const [drogueDescentRate, setDrogueDescentRate] = useState<string>('')
  const [mainOpenAlt, setMainOpenAlt] = useState<string>('')

  const [result, setResult] = useState<RocketDrift | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState<boolean>(false)

  function selectSite(value: string) {
    setSite(value)
    const found = LAUNCH_SITES.find((s) => s.name === value)
    if (!found || found.name === CUSTOM_SITE) return
    setLatitude(String(found.lat))
    setLongitude(String(found.lon))
  }

  const customSite = site === CUSTOM_SITE

  function validate() {
    const lat = Number(latitude)
    const lon = Number(longitude)
    const apogeeValue = Number(apogee)
    const descent = Number(descentRate)

    if (!latitude || !Number.isFinite(lat) || lat < -90 || lat > 90)
      return 'Latitude must be between -90 and 90.'
    if (!longitude || !Number.isFinite(lon) || lon < -180 || lon > 180)
      return 'Longitude must be between -180 and 180.'
    if (!apogee || !Number.isFinite(apogeeValue) || apogeeValue <= 0)
      return 'Apogee must be greater than 0.'
    if (!descentRate || !Number.isFinite(descent) || descent <= 0)
      return 'Descent rate must be greater than 0.'

    if (drogue) {
      const drogueRate = Number(drogueDescentRate)
      const mainAlt = Number(mainOpenAlt)
      if (!drogueDescentRate || !Number.isFinite(drogueRate) || drogueRate <= 0)
        return 'Drogue descent rate must be greater than 0.'
      if (!mainOpenAlt || !Number.isFinite(mainAlt) || mainAlt <= 0)
        return 'Main deployment altitude must be greater than 0.'
      if (mainAlt >= apogeeValue)
        return 'Main deployment altitude must be below apogee.'
    }

    return null
  }

  async function calculate() {
    const problem = validate()
    if (problem) {
      setError(problem)
      setResult(null)
      return
    }

    setError(null)
    setResult(null)
    setCalculating(true)

    const apogeeValue = Number(apogee)

    try {
      const drifts = await driftCalc(
        [
          {
            apogee: apogeeValue,
            drogue,
            decent_rate: Number(descentRate),
            drogue_decent_rate: drogue ? Number(drogueDescentRate) : undefined,
            main_open_alt: drogue ? Number(mainOpenAlt) : undefined,
          },
        ],
        {
          lat: Number(latitude),
          lon: Number(longitude),
          max_alt: apogeeValue,
          date: toTimeStamp(new Date(date)),
          time: Number(hour),
        },
      )
      setResult(drifts[0] ?? null)
    } catch (e) {
      setError(String(e))
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="w-fit">
        <h1 className="flex flex-row items-center gap-3 font-extrabold text-3xl text-primary hover:opacity-80">
          <WindIcon size="32" strokeWidth={3} />
          Drift Calculator
        </h1>
        <p className="text-muted-foreground">
          This is a very rough estimation and, relies on estimations from
          simulated data and many assumptions. So don't take it as garunteed, as
          rockets themseleves are unpredictable.
        </p>
      </Link>

      <div className="flex flex-row flex-wrap items-start gap-4">
        <Card className="min-w-3xs flex-1">
          <CardHeader>
            <CardTitle>Launch Site</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Preset</FieldLabel>
              <Select value={site} onValueChange={selectSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a launch site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LAUNCH_SITES.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="Latitude"
                disabled={!customSite}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="Longitude"
                disabled={!customSite}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="min-w-3xs flex-1">
          <CardHeader>
            <CardTitle>Launch Window</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Time (UTC)</FieldLabel>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card className="min-w-3xs flex-1">
          <CardHeader>
            <CardTitle>Recovery</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="apogee">Apogee (m)</FieldLabel>
              <Input
                id="apogee"
                type="number"
                min="1"
                placeholder="Apogee"
                value={apogee}
                onChange={(e) => setApogee(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Deployment</FieldLabel>
              <Select
                value={drogue ? 'dual' : 'single'}
                onValueChange={(value) => setDrogue(value === 'dual')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="single">Single deployment</SelectItem>
                    <SelectItem value="dual">Dual deployment</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="descent-rate">
                {drogue ? 'Main descent rate (m/s)' : 'Descent rate (m/s)'}
              </FieldLabel>
              <Input
                id="descent-rate"
                type="number"
                step="any"
                min="0"
                placeholder="Descent rate"
                value={descentRate}
                onChange={(e) => setDescentRate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="drogue-rate">
                Drogue descent rate (m/s)
              </FieldLabel>
              <Input
                id="drogue-rate"
                type="number"
                step="any"
                min="0"
                placeholder="Drogue descent rate"
                disabled={!drogue}
                value={drogueDescentRate}
                onChange={(e) => setDrogueDescentRate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="main-alt">Main deployment (m)</FieldLabel>
              <Input
                id="main-alt"
                type="number"
                min="1"
                placeholder="Main deployment altitude"
                disabled={!drogue}
                value={mainOpenAlt}
                onChange={(e) => setMainOpenAlt(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="min-w-3xs flex-1">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              className="rounded-xl"
              onClick={calculate}
              disabled={calculating}
            >
              {calculating ? <Spinner /> : 'Calculate drift'}
            </Button>

            {error && <p className="text-destructive text-sm">{error}</p>}

            {result && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Drift distance
                  </p>
                  <p className="font-extrabold text-3xl text-primary">
                    {formatDistance(result.distance)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Bearing</p>
                  <p className="font-extrabold text-3xl text-primary">
                    {result.bearing}&deg; {cardinal(result.bearing)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
