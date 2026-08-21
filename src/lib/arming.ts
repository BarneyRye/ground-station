import {
  type BleService,
  listServices,
  send,
  subscribe,
  unsubscribe,
} from '@mnlphlp/plugin-blec'

const WRITE_WITHOUT_RESPONSE = 0x04

export const ARM_CHARACTERISTIC_UUID = 'a1b20001-5c3d-4e6f-8a9b-0c1d2e3f4a5b'
export const STATUS_CHARACTERISTIC_UUID = 'a1b20002-5c3d-4e6f-8a9b-0c1d2e3f4a5b'

export const DISARM_COMMAND = 0x00
export const ARM_COMMAND = 0x01
export const STATUS_COMMAND = 0x02

export const TELEMETRY_PACKET_BYTES = 4
export const TELEMETRY_TIMEOUT_MS = 500

export type Telemetry = {
  pyros: number
  armed: boolean
  volts: number
}

export type ArmingLink = {
  sendCommand: (command: number) => Promise<void>
  close: () => Promise<void>
}

export function checkPyroStatus(byte: number): boolean[] {
  const channels: boolean[] = [false, false, false, false]
  for (let i = 0; i < 4; i++) {
    channels[i] = ((byte >> i) & 1) === 1
  }
  return channels
}

export function parseTelemetry(packet: number[]): Telemetry | undefined {
  if (packet.length < TELEMETRY_PACKET_BYTES) return undefined
  const [pyros, armed, voltsHigh, voltsLow] = packet
  return {
    pyros: pyros & 0x0f,
    armed: armed !== 0,
    volts: ((voltsHigh << 8) | voltsLow) / 1000,
  }
}

type Endpoints = {
  write: string
  writeType: 'withResponse' | 'withoutResponse'
  notify: string
}

async function getServices(address: string): Promise<BleService[]> {
  const services = await listServices(address)
  if (typeof services === 'string') throw new Error(services)
  return services
}

function findCharacteristic(services: BleService[], uuid: string) {
  for (const service of services) {
    const match = service.characteristics.find(
      (characteristic) => characteristic.uuid.toLowerCase() === uuid,
    )
    if (match) return match
  }
  return undefined
}

async function findEndpoints(address: string): Promise<Endpoints> {
  const services = await getServices(address)

  const arm = findCharacteristic(services, ARM_CHARACTERISTIC_UUID)
  if (!arm) throw new Error(`${address} has no arming characteristic`)

  const status = findCharacteristic(services, STATUS_CHARACTERISTIC_UUID)
  if (!status) throw new Error(`${address} has no status characteristic`)

  return {
    write: arm.uuid,
    writeType:
      (arm.properties & WRITE_WITHOUT_RESPONSE) !== 0
        ? 'withoutResponse'
        : 'withResponse',
    notify: status.uuid,
  }
}

export async function openArmingLink(
  address: string,
  onTelemetry: (telemetry: Telemetry) => void,
  onStale: () => void,
): Promise<ArmingLink> {
  const endpoints = await findEndpoints(address)

  let watchdog: ReturnType<typeof setTimeout> | undefined
  let closed = false

  function resetWatchdog() {
    clearTimeout(watchdog)
    if (closed) return
    watchdog = setTimeout(onStale, TELEMETRY_TIMEOUT_MS)
  }

  await subscribe(endpoints.notify, null, (data) => {
    const telemetry = parseTelemetry(data)
    if (!telemetry) return
    resetWatchdog()
    onTelemetry(telemetry)
  })

  resetWatchdog()

  return {
    sendCommand: (command) =>
      send(endpoints.write, [command & 0xff], endpoints.writeType),
    close: async () => {
      closed = true
      clearTimeout(watchdog)
      await unsubscribe(endpoints.notify)
    },
  }
}
