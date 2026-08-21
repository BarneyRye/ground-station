import {
  BatteryFullIcon,
  BatteryLowIcon,
  BatteryMediumIcon,
  BatteryWarningIcon,
  ZapIcon,
  ZapOffIcon,
} from 'lucide-react'
import { checkPyroStatus } from '@/lib/arming'
import { cn } from '@/lib/utils'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card'

export function ArmButton({
  armed,
  disabled,
  onToggle,
}: {
  armed: boolean
  disabled?: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <Card
      className={cn(
        'w-full items-center gap-6 md:w-1/4',
        disabled && 'opacity-30',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={armed}
        aria-label={armed ? 'Disarm igniter' : 'Arm igniter'}
        disabled={disabled}
        onClick={() => onToggle(!armed)}
        className={cn(
          'relative aspect-square w-full max-w-64 select-none rounded-full border-4',
          'transition duration-200 ease-out active:scale-[0.97] active:duration-75',
          'outline-none focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
          disabled &&
            'cursor-not-allowed border-border bg-muted/40 opacity-50 shadow-none',
          !disabled &&
            armed &&
            'cursor-pointer border-red-400/60 bg-linear-to-b from-red-500 to-red-800 shadow-[0_0_55px_-8px_var(--color-red-500)] hover:from-red-400 hover:to-red-700',
          !disabled &&
            !armed &&
            'inset-shadow-sm cursor-pointer border-border bg-linear-to-b from-secondary to-card hover:border-muted-foreground/50 hover:from-muted',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            'font-mono text-2xl font-bold uppercase tracking-[0.2em]',
            armed ? 'text-white' : 'text-muted-foreground',
          )}
        >
          {armed ? 'Armed' : 'Safe'}
        </span>
        {armed && !disabled && (
          <span className="pointer-events-none absolute inset-2 animate-pulse rounded-full border-2 border-red-200/40" />
        )}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {disabled
          ? 'Connect a device to enable arming'
          : armed
            ? 'Igniter live — press to disarm'
            : 'Press to arm igniter'}
      </p>
    </Card>
  )
}

export function PyroChannels({
  continuity,
  disabled,
}: {
  continuity: number
  disabled?: boolean
}) {
  const channels = checkPyroStatus(continuity).map((ok, i) => ({
    id: `pyro-${i + 1}`,
    label: `Pyro ${i + 1}`,
    ok,
  }))
  const live = channels.filter((c) => c.ok).length

  return (
    <Card className={cn('flex-1', disabled && 'opacity-30')}>
      <CardHeader>
        <CardTitle>Pyro Continuity</CardTitle>
        <CardDescription>
          Igniter circuit check across all four channels
        </CardDescription>
        <CardAction>
          <span
            className={cn(
              'rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-widest',
              disabled || live === 0
                ? 'border-border text-muted-foreground'
                : 'border-green-500/40 text-green-400',
            )}
          >
            {disabled ? '—' : live} / 4 live
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="grid flex-1 auto-rows-fr grid-cols-2 gap-4 lg:grid-cols-4">
        {channels.map((channel) => {
          const lit = !disabled && channel.ok
          return (
            <div
              key={channel.id}
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-lg border p-4 transition duration-200',
                lit
                  ? 'border-green-500/40 bg-linear-to-b from-green-950/50 to-card shadow-[0_0_30px_-14px_var(--color-green-400)]'
                  : 'border-border bg-linear-to-b from-secondary/40 to-card',
              )}
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {channel.label}
              </span>
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-full border transition duration-200',
                  lit
                    ? 'border-green-400/50 bg-green-500/15 text-green-400 shadow-[0_0_20px_-4px_var(--color-green-400)]'
                    : 'border-border bg-muted/40 text-muted-foreground',
                )}
              >
                {lit ? (
                  <ZapIcon className="size-6 fill-current" />
                ) : (
                  <ZapOffIcon className="size-6" />
                )}
              </span>
              <span
                className={cn(
                  'font-mono text-sm font-bold uppercase tracking-widest',
                  lit ? 'text-green-400' : 'text-muted-foreground',
                )}
              >
                {disabled ? 'N/A' : channel.ok ? 'Cont' : 'Open'}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

const VOLTAGE_MIN = 6.0
const VOLTAGE_MAX = 8.4
const VOLTAGE_CAUTION = 6.4
const VOLTAGE_NOMINAL = 7.4

const VOLTAGE_LEVELS = {
  offline: {
    label: 'No Data',
    icon: BatteryWarningIcon,
    text: 'text-muted-foreground',
    border: 'border-border',
    bar: 'bg-muted-foreground/30',
    glow: '',
  },
  critical: {
    label: 'Critical',
    icon: BatteryLowIcon,
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    bar: 'bg-linear-to-r from-rose-600 to-rose-400',
    glow: 'shadow-[0_0_28px_-10px_var(--color-rose-400)]',
  },
  caution: {
    label: 'Caution',
    icon: BatteryMediumIcon,
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    bar: 'bg-linear-to-r from-amber-600 to-amber-400',
    glow: 'shadow-[0_0_28px_-10px_var(--color-amber-400)]',
  },
  nominal: {
    label: 'Nominal',
    icon: BatteryFullIcon,
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bar: 'bg-linear-to-r from-emerald-600 to-emerald-400',
    glow: 'shadow-[0_0_28px_-10px_var(--color-emerald-400)]',
  },
}

function voltageLevel(volts: number): keyof typeof VOLTAGE_LEVELS {
  if (volts <= 0) return 'offline'
  if (volts > VOLTAGE_NOMINAL) return 'nominal'
  if (volts > VOLTAGE_CAUTION) return 'caution'
  return 'critical'
}

function voltagePercent(volts: number): number {
  const span = VOLTAGE_MAX - VOLTAGE_MIN
  return Math.min(100, Math.max(0, ((volts - VOLTAGE_MIN) / span) * 100))
}

export function VoltageGauge({
  volts,
  disabled,
}: {
  volts: number
  disabled?: boolean
}) {
  const level = disabled ? 'offline' : voltageLevel(volts)
  const style = VOLTAGE_LEVELS[level]
  const Icon = style.icon
  const fill = level === 'offline' ? 0 : voltagePercent(volts)

  return (
    <Card className={cn('w-md', disabled && 'opacity-30')}>
      <CardHeader>
        <CardTitle>Pack Voltage</CardTitle>
        <CardDescription>2S supply to the flight computer</CardDescription>
        <CardAction>
          <span
            className={cn(
              'rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-widest',
              style.border,
              style.text,
            )}
          >
            {style.label}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className={cn('flex items-baseline gap-3', style.text)}>
          <Icon className="size-10 self-center" strokeWidth={1.5} />
          <span className="font-mono text-5xl font-bold tabular-nums">
            {level === 'offline' ? '--.--' : volts.toFixed(2)}
          </span>
          <span className="font-mono text-2xl text-muted-foreground">V</span>
        </div>
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              'relative h-3 w-full overflow-hidden rounded-full border bg-muted/40',
              style.border,
              style.glow,
            )}
          >
            <div
              className={cn(
                'h-full transition-[width] duration-300',
                style.bar,
              )}
              style={{ width: `${fill}%` }}
            />
            <span
              className="absolute inset-y-0 w-0.5 bg-background/80"
              style={{ left: `${voltagePercent(VOLTAGE_CAUTION)}%` }}
            />
            <span
              className="absolute inset-y-0 w-0.5 bg-background/80"
              style={{ left: `${voltagePercent(VOLTAGE_NOMINAL)}%` }}
            />
          </div>
          <div className="relative h-4 font-mono text-[0.65rem] text-muted-foreground">
            <span className="absolute left-0">{VOLTAGE_MIN.toFixed(1)}</span>
            <span
              className="absolute -translate-x-1/2"
              style={{ left: `${voltagePercent(VOLTAGE_CAUTION)}%` }}
            >
              {VOLTAGE_CAUTION.toFixed(1)}
            </span>
            <span
              className="absolute -translate-x-1/2"
              style={{ left: `${voltagePercent(VOLTAGE_NOMINAL)}%` }}
            >
              {VOLTAGE_NOMINAL.toFixed(1)}
            </span>
            <span className="absolute right-0">{VOLTAGE_MAX.toFixed(1)} V</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
