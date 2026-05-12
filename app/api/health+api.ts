import { jsonResponse, preflightResponse } from '@/lib/server/apiSecurity';
import { hasOpenRouterKey } from '@/lib/server/openRouter';
import { hasRevenueCatServerKey } from '@/lib/server/revenueCat';

export async function GET(request: Request) {
  return jsonResponse(
    {
      aiConfigured: hasOpenRouterKey(),
      ok: true,
      protectedAiRoutes: Boolean(process.env.API_CLIENT_TOKEN),
      proEntitlementChecks: hasRevenueCatServerKey(),
      service: 'glowpep-api',
    },
    200,
    undefined,
    request,
  );
}

export async function OPTIONS(request: Request) {
  return preflightResponse(request);
}
