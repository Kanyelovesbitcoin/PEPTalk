const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();

const FORBIDDEN_DEPENDENCIES = ['expo-camera', 'expo-image-picker'];
const FORBIDDEN_PATHS = [
  'app/scan.tsx',
  'app/api/skin-analysis+api.ts',
  'lib/storage/skinScans.ts',
  'lib/utils/skinAnalysis.ts',
];
const SOURCE_DIRS = ['app', 'components', 'lib', 'types', 'docs'];
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md']);
const FORBIDDEN_PATTERNS = [
  /safe to take/i,
  /recommended dose/i,
  /where to buy/i,
  /3 scans per day/i,
  /face scan/i,
  /Glow ELO/i,
  /skin-analysis/i,
  /CameraView/i,
  /ImagePicker/i,
  /useCameraPermissions/i,
  /NSCameraUsageDescription/i,
  /NSPhotoLibraryUsageDescription/i,
];

const ALLOWED_TEXT_MATCHES = [
  {
    file: 'docs/app-store-readiness.md',
    pattern: /No camera or photo permission is requested\./i,
  },
  {
    file: 'docs/app-store-submission-package.md',
    pattern: /GlowPep does not request camera or photo library access\./i,
  },
  {
    file: 'docs/testflight-release-checklist.md',
    pattern: /No camera or photo permission appears in iOS settings\./i,
  },
  {
    file: 'lib/utils/resetAppData.ts',
    pattern: /glowpep\/skin-scans/i,
  },
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function normalizePath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function walk(dir, files = []) {
  const absoluteDir = path.join(ROOT, dir);
  if (!fs.existsSync(absoluteDir)) return files;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      walk(normalizePath(absolutePath), files);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isAllowedMatch(file, line) {
  return ALLOWED_TEXT_MATCHES.some((allow) => allow.file === file && allow.pattern.test(line));
}

const failures = [];

const packageJson = readJson('package.json');
const dependencyNames = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
]);

for (const dependency of FORBIDDEN_DEPENDENCIES) {
  if (dependencyNames.has(dependency)) {
    failures.push(`Forbidden camera/photo dependency remains in package.json: ${dependency}`);
  }
}

const appConfig = fs.readFileSync(path.join(ROOT, 'app.config.ts'), 'utf8');
for (const dependency of FORBIDDEN_DEPENDENCIES) {
  if (appConfig.includes(dependency)) {
    failures.push(`Forbidden camera/photo plugin remains in app.config.ts: ${dependency}`);
  }
}

for (const forbiddenPath of FORBIDDEN_PATHS) {
  if (exists(forbiddenPath)) {
    failures.push(`Forbidden scan-era file still exists: ${forbiddenPath}`);
  }
}

for (const filePath of SOURCE_DIRS.flatMap((dir) => walk(dir))) {
  const file = normalizePath(filePath);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (isAllowedMatch(file, line)) return;
    const hit = FORBIDDEN_PATTERNS.find((pattern) => pattern.test(line));
    if (hit) {
      failures.push(`${file}:${index + 1} contains forbidden release copy/code: ${hit}`);
    }
  });
}

if (failures.length > 0) {
  console.error(`App Store readiness failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('App Store readiness checks passed.');
