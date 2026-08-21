import { invoke } from '@tauri-apps/api/core'
import type {
  DataParameters,
  RocketConfig,
  RocketDrift,
} from '@/lib/drift-calc'

export function drift_calc(
  configs: RocketConfig[],
  params: DataParameters,
): Promise<RocketDrift[]> {
  return invoke('drift_calc', { configs, params })
}
