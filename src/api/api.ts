import { invoke } from '@tauri-apps/api/core'
import type {
  DataParameters,
  RocketConfig,
  RocketDrift,
} from '@/lib/drift-calc'

export function driftCalc(
  configs: RocketConfig[],
  params: DataParameters,
): Promise<RocketDrift[]> {
  return invoke('drift_calc', { configs, params })
}

export async function blackboxExtract(_input: string, _output: string) {
  await new Promise((resolve) => setTimeout(resolve, 3000))
}
