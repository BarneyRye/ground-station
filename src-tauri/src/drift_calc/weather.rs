use serde::Deserialize;
use std::collections::BTreeMap;

pub type Error = Box<dyn std::error::Error + Send + Sync>;

const URL: &str = "https://api.open-meteo.com/v1/forecast";
const PRESSURES: [&str; 19] = [
    "1000", "975", "950", "925", "900", "850", "800", "700", "600", "500", "400", "300", "250",
    "200", "150", "100", "70", "50", "30",
];
const HEIGHTS: [u32; 4] = [10, 80, 120, 180];
const GEO_STR: &str = "geopotential_height_";
const WIND_SPEED_STR: &str = "wind_speed_";
const WIND_DIR_STR: &str = "wind_direction_";

pub type WindProfile = BTreeMap<u32, (f32, f32)>;

#[derive(Deserialize)]
pub struct TimeStamp {
    pub year: u16,
    pub month: u8,
    pub day: u8,
}

impl TimeStamp {
    fn to_iso(&self) -> String {
        format!("{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
}

#[derive(Deserialize)]
pub struct DataParameters {
    pub lat: f32,
    pub lon: f32,
    pub max_alt: u32,
    pub date: TimeStamp,
    pub time: u8,
}

#[derive(Deserialize)]
struct ApiResponse {
    elevation: f32,
    hourly: Hourly,
}

#[derive(Deserialize)]
struct Hourly {
    time: Vec<String>,
    #[serde(flatten)]
    series: BTreeMap<String, Vec<Option<f32>>>,
}

pub async fn get_data(launch_params: DataParameters) -> Result<WindProfile, Error> {
    let pressure_vars = PRESSURES.iter().flat_map(|p| {
        [
            format!("{}{}hPa", GEO_STR, p),
            format!("{}{}hPa", WIND_SPEED_STR, p),
            format!("{}{}hPa", WIND_DIR_STR, p),
        ]
    });

    let height_vars = HEIGHTS.iter().flat_map(|h| {
        [
            format!("{}{}m", WIND_SPEED_STR, h),
            format!("{}{}m", WIND_DIR_STR, h),
        ]
    });

    let hourly = pressure_vars
        .chain(height_vars)
        .collect::<Vec<String>>()
        .join(",");

    let date = launch_params.date.to_iso();

    let params = [
        ("latitude", launch_params.lat.to_string()),
        ("longitude", launch_params.lon.to_string()),
        ("hourly", hourly),
        ("start_date", date.clone()),
        ("end_date", date),
        ("wind_speed_unit", "ms".to_string()),
    ];

    let url = reqwest::Url::parse_with_params(URL, &params)?;
    let body: ApiResponse = reqwest::get(url).await?.json().await?;

    let hour: usize = launch_params.time as usize;
    if hour >= body.hourly.time.len() {
        return Err(format!(
            "hour {} out of range, response covers {} hours",
            hour,
            body.hourly.time.len()
        )
        .into());
    }

    let at = |key: &str| -> Option<f32> {
        body.hourly
            .series
            .get(key)
            .and_then(|s| s.get(hour).copied().flatten())
    };

    let ground = body.elevation;
    let mut profile = WindProfile::new();

    for p in PRESSURES {
        let (Some(alt), Some(speed), Some(dir)) = (
            at(&format!("{}{}hPa", GEO_STR, p)),
            at(&format!("{}{}hPa", WIND_SPEED_STR, p)),
            at(&format!("{}{}hPa", WIND_DIR_STR, p)),
        ) else {
            continue;
        };

        let agl = alt - ground;
        if agl < 0.0 {
            continue;
        }

        let agl = agl.round() as u32;
        let above_cap = agl > launch_params.max_alt;
        profile.insert(agl, (speed, dir));

        if above_cap {
            break;
        }
    }

    for h in HEIGHTS {
        let (Some(speed), Some(dir)) = (
            at(&format!("{}{}m", WIND_SPEED_STR, h)),
            at(&format!("{}{}m", WIND_DIR_STR, h)),
        ) else {
            continue;
        };

        if h > launch_params.max_alt {
            continue;
        }

        profile.insert(h, (speed, dir));
    }

    if profile.is_empty() {
        return Err("no usable wind levels returned".into());
    }

    Ok(profile)
}
