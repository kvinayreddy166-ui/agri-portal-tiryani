# Telangana Remote Sensing Combined Project Package

This package combines two inputs for your project:

1. **Telangana village/district/mandal boundary data** from `village_boundaries.json.xz`.
2. **Crop-health sample farm polygons and labels** from `Telengana-crop-health-challenge-main.zip`.

## What is combined

The farm polygons were spatially joined to the village boundary layer using each farm centroid.

- Farm sample polygons: **10,606**
- Farm samples matched to village boundary: **10,606**
- Labelled train samples: **7,888**
- Unlabelled test samples: **2,718**
- Village boundary features: **11,154**
- Villages with crop-health samples: **1,466**

## Main files for your PWA

Copy this folder to your Vite/React project:

```text
public/data/remote-sensing/
```

Recommended frontend files:

```text
01_boundaries/admin/telangana_village_boundaries_map_simplified_50m.geojson.gz
01_boundaries/admin/telangana_mandal_block_boundaries.geojson.gz
01_boundaries/admin/telangana_district_boundaries.geojson.gz
01_boundaries/admin/telangana_village_lookup.csv
03_dashboard_summaries/village_dashboard_seed_table.csv
05_app_integration/vite_react_geojson_gz_loader.ts
```

Recommended backend / analysis files:

```text
01_boundaries/admin/telangana_village_boundaries_project.geojson.gz
02_farm_samples/crop_health_farm_polygons_admin_joined.geojson.gz
02_farm_samples/crop_health_farm_samples_admin_joined.csv
04_remote_sensing_feature_plan/remote_sensing_index_formulas_for_app.csv
06_database_schema/supabase_postgis_schema.sql
```

## Best database keys

Use these IDs in your app and database:

| Level | Key field |
|---|---|
| District | `admin_old_district_code` / `district_code` |
| Mandal/block | `admin_old_block_mandal_code` / `block_mandal_code` |
| Village | `admin_village_code` / `village_code` |
| Farm sample | `farm_id` |

## How to use for crop health

1. Use village/farm boundaries to clip satellite imagery.
2. Extract Sentinel-2 NDVI, NDRE, NDMI, NDWI, SAVI.
3. Add Sentinel-1 VV/VH during cloudy season.
4. Join extracted satellite features to `farm_id` or `admin_village_code`.
5. Train or run stress classification using `health_category` as prototype label.
6. Show village-level summaries using `village_dashboard_seed_table.csv`. Risk columns are calculated from labelled train samples only; unlabelled test samples are counted separately as `unknown_health_farms`.

## Important limitations

- The boundary file uses the **old 10-district Telangana structure**. It is still useful spatially, but official reporting should add a modern 33-district mapping table.
- The crop-health challenge README describes the sample data as **fictional/illustrative**. Use it for prototype, UI, model workflow, and dashboard testing. For official deployment, replace labels with actual field observations, crop booking records, pest reports, and satellite-derived indices.

## Suggested app modules

- Remote Sensing Map: district → mandal → village drilldown
- Village Crop Health Dashboard: risk class, unhealthy %, primary crop, sample farm count
- Farm Sample Explorer: farm polygon, crop, health category, sowing/harvest dates, irrigation and water coverage
- Satellite Index Timeline: NDVI / NDMI / NDRE time series by village or farm
- Alerts: low NDVI, falling NDMI, high unhealthy %, rainfall deficit