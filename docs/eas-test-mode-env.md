# EAS Test Mode Environment

Use `.env.testflight.local` as the fill-in sheet for TestFlight testing. It is ignored by git, so it is safe to put real test keys there on your machine.

## What goes where

These values are bundled into the TestFlight app:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_API_CLIENT_TOKEN`
- `EXPO_PUBLIC_REVENUECAT_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`

These values belong on the hosted API/server environment:

- `API_CLIENT_TOKEN`
- `REVENUECAT_REST_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_VISION_MODEL`
- `API_ALLOWED_ORIGINS`
- `APP_PRIVACY_POLICY_URL`
- `APP_SUPPORT_URL`

The `EXPO_PUBLIC_API_CLIENT_TOKEN` and `API_CLIENT_TOKEN` values must match. Use a random value at least 24 characters long.
The default OpenRouter vision model is `google/gemini-2.5-flash`, a Google Gemini model served through OpenRouter.

## Push to EAS for TestFlight

EAS cloud builds do not automatically receive local `.env` files. After filling in `.env.testflight.local`, push it to the EAS `production` environment because the current TestFlight build profile uses:

```json
"production": {
  "autoIncrement": true,
  "environment": "production"
}
```

Use the EAS CLI:

```powershell
eas env:push --environment production --path .env.testflight.local
```

Then create the iOS TestFlight build:

```powershell
npm.cmd run verify:release-env
npx.cmd eas build --platform ios --profile production
npx.cmd eas submit -p ios --profile production
```

The release verifier reads `.env.testflight.local`, so you can run `npm.cmd run verify:release-env` directly after filling it in.

## RevenueCat test notes

- Use the RevenueCat Apple public SDK key in `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- Do not put a RevenueCat secret key in an `EXPO_PUBLIC_` variable.
- The entitlement ID should match the RevenueCat entitlement attached to your offering, currently `glowpep_pro`.
- TestFlight purchases use Apple's sandbox purchase flow, but the RevenueCat products and offering still need to be configured in RevenueCat and App Store Connect.
