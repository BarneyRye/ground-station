import type { LinkProps } from '@tanstack/react-router'
import {
  AntennaIcon,
  CpuIcon,
  FlameIcon,
  GaugeIcon,
  HardDriveIcon,
  type LucideIcon,
  WindIcon,
} from 'lucide-react'

interface Route {
  name: string
  to: LinkProps['to']
  icon: LucideIcon
  desc: string
}

export const NAV: Route[] = [
  {
    name: 'Dashboard',
    to: '/',
    icon: GaugeIcon,
    desc: 'Dashboard with updates, status and navigation',
  },
  {
    name: 'Telemetry',
    to: '/telemetry',
    icon: AntennaIcon,
    desc: 'Live telemetrary and arming page',
  },
  {
    name: 'Arming',
    to: '/arming',
    icon: FlameIcon,
    desc: 'Arming via bluetooth low energy',
  },
  {
    name: 'Blackbox',
    to: '/blackbox',
    icon: HardDriveIcon,
    desc: 'View and plot data from the SD card logs',
  },
  {
    name: 'Coder',
    to: '/coder',
    icon: CpuIcon,
    desc: 'Define and upload code',
  },
  {
    name: 'Drift Calculator',
    to: '/drift',
    icon: WindIcon,
    desc: 'Estimate drift direction and distance',
  },
]
