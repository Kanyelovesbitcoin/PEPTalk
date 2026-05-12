const fs = require('node:fs');
const path = require('node:path');

for (const filename of ['.env.testflight.local', '.env.local', '.env']) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) continue;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const requiredGroups = [
  ['EXPO_PUBLIC_API_BASE_URL', 'API_BASE_URL'],
  ['EXPO_PUBLIC_API_CLIENT_TOKEN'],
  ['API_CLIENT_TOKEN'],
  ['EXPO_PUBLIC_REVENUECAT_API_KEY', 'REVENUECAT_PUBLIC_SDK_KEY'],
  ['REVENUECAT_REST_API_KEY', 'REVENUECAT_API_KEY'],
  ['EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID', 'REVENUECAT_ENTITLEMENT_ID'],
  ['OPENROUTER_API_KEY'],
  ['API_ALLOWED_ORIGINS'],
  ['APP_PRIVACY_POLICY_URL'],
  ['APP_SUPPORT_URL'],
];

const missing = requiredGroups
  .filter((keys) => keys.every((key) => !process.env[key]))
  .map((keys) => keys.join(' or '));

const failures = [];

if (missing.length > 0) {
  failures.push(`Missing release environment variables: ${missing.join(', ')}`);
}

try {
  const apiUrl = new URL(process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL);
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  if (apiUrl.protocol !== 'https:') {
    failures.push('EXPO_PUBLIC_API_BASE_URL must use https for release builds.');
  }
  if (localHosts.has(apiUrl.hostname) || apiUrl.hostname.endsWith('.local') || apiUrl.hostname.includes('example')) {
    failures.push('EXPO_PUBLIC_API_BASE_URL must be a real hosted production API, not localhost or an example URL.');
  }
} catch {
  failures.push('EXPO_PUBLIC_API_BASE_URL must be an absolute hosted URL.');
}

for (const key of ['EXPO_PUBLIC_API_CLIENT_TOKEN', 'API_CLIENT_TOKEN']) {
  const value = process.env[key] ?? '';
  if (value.length > 0 && value.length < 24) {
    failures.push(`${key} should be at least 24 characters.`);
  }
  if (/replace|example|your-|placeholder/i.test(value)) {
    failures.push(`${key} still looks like a placeholder.`);
  }
}

if (
  process.env.EXPO_PUBLIC_API_CLIENT_TOKEN &&
  process.env.API_CLIENT_TOKEN &&
  process.env.EXPO_PUBLIC_API_CLIENT_TOKEN !== process.env.API_CLIENT_TOKEN
) {
  failures.push('EXPO_PUBLIC_API_CLIENT_TOKEN and API_CLIENT_TOKEN must match for the hosted API gate.');
}

const revenueCatKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || process.env.REVENUECAT_PUBLIC_SDK_KEY || '';
if (/replace|example|your-|placeholder/i.test(revenueCatKey)) {
  failures.push('RevenueCat API key still looks like a placeholder.');
}
if (!/^appl_/.test(revenueCatKey)) {
  failures.push('iOS release should use the RevenueCat Apple public SDK key, usually starting with appl_.');
}
const revenueCatRestKey = process.env.REVENUECAT_REST_API_KEY || process.env.REVENUECAT_API_KEY || '';
if (/replace|example|your-|placeholder/i.test(revenueCatRestKey)) {
  failures.push('REVENUECAT_REST_API_KEY or REVENUECAT_API_KEY still looks like a placeholder.');
}

const entitlementId = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || process.env.REVENUECAT_ENTITLEMENT_ID || '';
if (!/^[a-z0-9_.-]{3,64}$/i.test(entitlementId)) {
  failures.push('RevenueCat entitlement ID must be a stable non-empty identifier.');
}

const openRouterKey = process.env.OPENROUTER_API_KEY || '';
if (/replace|example|your-|placeholder/i.test(openRouterKey)) {
  failures.push('OPENROUTER_API_KEY still looks like a placeholder.');
}

const allowedOrigins = (process.env.API_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.includes('*')) {
  failures.push('API_ALLOWED_ORIGINS must be an allowlist, not "*".');
}
if (!allowedOrigins.some((origin) => origin.startsWith('https://'))) {
  failures.push('API_ALLOWED_ORIGINS must include the production https origin.');
}

for (const key of ['APP_PRIVACY_POLICY_URL', 'APP_SUPPORT_URL']) {
  try {
    const url = new URL(process.env[key] || '');
    if (url.protocol !== 'https:') {
      failures.push(`${key} must use https.`);
    }
  } catch {
    failures.push(`${key} must be an absolute https URL.`);
  }
}

if (failures.length > 0) {
  console.error(`Release environment is not ready:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Release environment looks ready.');
