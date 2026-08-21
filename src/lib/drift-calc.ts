export interface RocketConfig {
  apogee: number
  drogue: boolean
  decent_rate: number
  drogue_decent_rate?: number
  main_open_alt?: number
}

export interface TimeStamp {
  year: number
  month: number
  day: number
}

export interface DataParameters {
  lat: number
  lon: number
  max_alt: number
  date: TimeStamp
  time: number
}

export interface RocketDrift {
  distance: number
  bearing: number
}

export function toTimeStamp(date: Date): TimeStamp {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}
