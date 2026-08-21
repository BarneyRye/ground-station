use super::weather::WindProfile;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct RocketConfig {
    pub apogee: u32,
    pub drogue: bool,
    pub decent_rate: f32,
    pub drogue_decent_rate: Option<f32>,
    pub main_open_alt: Option<u32>,
}

#[derive(Serialize)]
pub struct RocketDrift {
    pub distance: f32,
    pub bearing: u32,
}

fn interpolate(wind: &WindProfile, alt: u32) -> (f32, f32) {
    let below = wind.range(..=alt).next_back();
    let above = wind.range(alt..).next();

    let to_uv = |(speed, dir): (f32, f32)| {
        let r = dir.to_radians();
        (-speed * r.sin(), -speed * r.cos())
    };

    match (below, above) {
        (Some((&a0, &w0)), Some((&a1, &w1))) if a0 != a1 => {
            let (u0, v0) = to_uv(w0);
            let (u1, v1) = to_uv(w1);
            let t = (alt - a0) as f32 / (a1 - a0) as f32;
            (u0 + (u1 - u0) * t, v0 + (v1 - v0) * t)
        }
        (Some((_, &w)), _) => to_uv(w),
        (_, Some((_, &w))) => to_uv(w),
        _ => (0.0, 0.0),
    }
}

fn descent_rate(rocket: &RocketConfig, alt: u32) -> f32 {
    match (rocket.drogue_decent_rate, rocket.main_open_alt) {
        (Some(drogue_rate), Some(main_alt)) if rocket.drogue && alt > main_alt => drogue_rate,
        _ => rocket.decent_rate,
    }
}

pub fn calc_drift(rocket: &RocketConfig, wind: &WindProfile) -> RocketDrift {
    let mut total_u = 0.0;
    let mut total_v = 0.0;
    let mut alt = rocket.apogee;

    while alt > 0 {
        let rate = descent_rate(rocket, alt);

        if rate > 0.0 {
            let dt = 1.0 / rate;
            let (u, v) = interpolate(wind, alt);
            total_u += u * dt;
            total_v += v * dt;
        }

        alt -= 1;
    }

    RocketDrift {
        distance: (total_u * total_u + total_v * total_v).sqrt(),
        bearing: total_u
            .atan2(total_v)
            .to_degrees()
            .rem_euclid(360.0)
            .round() as u32
            % 360,
    }
}
