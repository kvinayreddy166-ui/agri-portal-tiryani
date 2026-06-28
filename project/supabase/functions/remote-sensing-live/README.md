# Remote Sensing Live GEE Function

This Edge Function keeps Google Earth Engine credentials on the server and returns live village-level observations for the Remote Sensing / Crop Health page.

It expects the frontend to send up to 25 village GeoJSON features and a date range. The function computes:

- Sentinel-2 SR Harmonized: NDVI, NDRE, NDMI, NDWI, SAVI
- Sentinel-1 GRD: VV, VH, VH/VV
- CHIRPS daily rainfall: period rainfall, 2014-2023 normal, rainfall anomaly

## Deploy

Apply the additive observation-history migration, then deploy the function:

```bash
supabase db push
supabase functions deploy remote-sensing-live
```

## Required Secrets

Use one JSON secret:

```bash
supabase secrets set GEE_SERVICE_ACCOUNT_JSON='{"client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","project_id":"..."}'
```

Or separate secrets:

```bash
supabase secrets set GEE_CLIENT_EMAIL='service-account@project.iam.gserviceaccount.com'
supabase secrets set GEE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
supabase secrets set GEE_PROJECT_ID='your-google-cloud-project-id'
```

The service account must be registered/authorized for Google Earth Engine and have access to the Earth Engine project.

## Observation History

When the migration `20260627120000_remote_sensing_live_observations.sql` is applied and the function has `SUPABASE_SERVICE_ROLE_KEY` available, successful GEE responses are upserted into `public.remote_sensing_observations` by village and date range.

If the service-role key is not available, the function still returns live values to the frontend and simply skips persistence.
