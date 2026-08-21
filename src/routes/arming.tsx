import {
  type BleDevice,
  checkPermissions,
  connect,
  disconnect,
  getConnectionUpdates,
  startScan,
  stopScan,
} from '@mnlphlp/plugin-blec'
import { createFileRoute, Link } from '@tanstack/react-router'
import { FlameIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ArmButton, PyroChannels, VoltageGauge } from '@/components/arming'
import {
  ARM_COMMAND,
  type ArmingLink,
  DISARM_COMMAND,
  openArmingLink,
} from '@/lib/arming'
import { Button } from '@/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Spinner } from '@/ui/spinner'

export const Route = createFileRoute('/arming')({
  component: RouteComponent,
})

const SCAN_TIMEOUT_MS = 5000

function RouteComponent() {
  useEffect(() => {
    getConnectionUpdates((c) => {
      setConnecting(false)
      setConnected(c)
      c
        ? setDevice(devices.find((d) => d.address === address))
        : setDevice(undefined)
    })
  }, [])

  const scanTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  async function bleScan() {
    setScanning(true)
    scanTimer.current = setTimeout(() => setScanning(false), SCAN_TIMEOUT_MS)
    try {
      await checkPermissions(true)
      await startScan(setDevices, SCAN_TIMEOUT_MS)
    } catch (e) {
      console.error('BLE scan failed', e)
      clearTimeout(scanTimer.current)
      setScanning(false)
    }
  }

  async function bleStopScan() {
    clearTimeout(scanTimer.current)
    stopScan()
    setScanning(false)
  }

  async function bleConnect() {
    if (!address) return
    setConnecting(true)
    try {
      await connect(address, () => setConnected(false))
    } catch (e) {
      console.error('BLE connect failed', e)
      setConnecting(false)
    }
  }

  async function bleDisconnect() {
    disconnect()
    setConnected(false)
    setArmed(false)
    if (!device) setDevice(undefined)
  }

  function bleSelect(a: string) {
    bleDisconnect()
    setAddress(a)
    setDevice(devices.find((d) => d.address === address))
  }

  const armingLink = useRef<ArmingLink>(undefined)

  async function toggleArm(next: boolean) {
    const link = armingLink.current
    if (!link) return
    try {
      await link.sendCommand(next ? ARM_COMMAND : DISARM_COMMAND)
    } catch (e) {
      console.error('BLE arm command failed', e)
    }
  }

  const [armed, setArmed] = useState<boolean>(false)
  const [devices, setDevices] = useState<BleDevice[]>([])
  const [address, setAddress] = useState<string>('')
  const [device, setDevice] = useState<BleDevice>()
  const [connected, setConnected] = useState<boolean>(false)
  const [connecting, setConnecting] = useState<boolean>(false)
  const [scanning, setScanning] = useState<boolean>(false)
  const [pyros, setPyros] = useState<number>(0)
  const [voltage, setVoltage] = useState<number>(0.0)

  useEffect(() => {
    if (!connected || !address) return

    let cancelled = false
    openArmingLink(
      address,
      (telemetry) => {
        setPyros(telemetry.pyros)
        setVoltage(telemetry.volts)
        setArmed(telemetry.armed)
      },
      () => {
        console.warn('BLE telemetry stalled, dropping link')
        bleDisconnect()
      },
    )
      .then((link) => {
        if (cancelled) {
          link.close()
          return
        }
        armingLink.current = link
      })
      .catch((e) => console.error('BLE telemetry subscribe failed', e))

    return () => {
      cancelled = true
      armingLink.current?.close()
      armingLink.current = undefined
      setPyros(0)
      setVoltage(0)
    }
  }, [connected, address])

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-row flex-wrap gap-10">
        <Link to="/">
          <Card className="w-lg h-full hover:border-primary">
            <CardHeader>
              <CardTitle className="flex flex-row gap-4 items-center justify-center text-primary font-extrabold text-7xl mb-4">
                <FlameIcon size="70" strokeWidth={3} />
                Arming
              </CardTitle>
              <CardDescription className="text-center">
                Arming of the Seadream custom flight computer using BLE
                expansion module.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card className="w-2xl">
          <CardHeader>
            <CardTitle>Device Connection</CardTitle>
            <CardDescription>
              Scan and select a BLE device to connect to
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row gap-8">
            <Select onValueChange={bleSelect} disabled={devices.length < 1}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue
                  placeholder={
                    devices.length > 0 ? 'BLE Devices' : 'Scan for devices'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {devices.map((d) => (
                    <SelectItem
                      key={d.address}
                      value={d.address}
                      className="h-10"
                    >
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              className="border border-transparent hover:border-foreground hover:border h-10 w-16"
              onClick={scanning ? bleStopScan : bleScan}
            >
              {scanning ? <Spinner /> : 'Scan'}
            </Button>
            <Button
              className="border border-transparent hover:border-foreground hover:border h-10 w-24"
              onClick={connected ? bleDisconnect : bleConnect}
            >
              {connecting ? <Spinner /> : connected ? 'Disconnect' : 'Connect'}
            </Button>
          </CardContent>
        </Card>
        <VoltageGauge volts={voltage} disabled={!connected} />
      </div>
      <div className="flex md:flex-row flex-col gap-10">
        <ArmButton armed={armed} disabled={!connected} onToggle={toggleArm} />
        <PyroChannels continuity={pyros} disabled={!connected} />
      </div>
    </div>
  )
}
