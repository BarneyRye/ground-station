pub mod calc;
pub mod weather;

use calc::{RocketConfig, RocketDrift};
use weather::DataParameters;

#[tauri::command]
pub async fn drift_calc(
    configs: Vec<RocketConfig>,
    params: DataParameters,
) -> Result<Vec<RocketDrift>, String> {
    let profile = weather::get_data(params).await.map_err(|e| e.to_string())?;

    Ok(configs
        .iter()
        .map(|rocket| calc::calc_drift(rocket, &profile))
        .collect())
}
