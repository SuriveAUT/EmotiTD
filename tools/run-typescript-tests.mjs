import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'test-artifacts', 'logic-tests');
const tsconfigPath = path.join(root, 'test-artifacts', 'logic-tests.tsconfig.json');
const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

writeFileSync(tsconfigPath, JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'ES2022',
    moduleResolution: 'Bundler',
    strict: true,
    skipLibCheck: true,
    esModuleInterop: true,
    isolatedModules: true,
    noEmit: false,
    rootDir: root,
    outDir
  },
  files: [
    path.join(root, 'src', 'vite-env.d.ts'),
    path.join(root, 'src', 'core', 'audioManifest.ts'),
    path.join(root, 'src', 'core', 'AudioManager.ts'),
    path.join(root, 'src', 'core', 'performancePolicy.ts'),
    path.join(root, 'src', 'ui', 'textPolicy.ts')
  ]
}, null, 2));

execFileSync(process.execPath, [tscBin, '--project', tsconfigPath], { cwd: root, stdio: 'inherit' });

const audioManagerOut = path.join(outDir, 'src', 'core', 'AudioManager.js');
writeFileSync(
  audioManagerOut,
  readFileSync(audioManagerOut, 'utf8')
    .replace("from './audioManifest';", "from './audioManifest.js';")
);

for (const testFile of [
  path.join(root, 'tools', 'audioManifest.test.mjs'),
  path.join(root, 'tools', 'audioManager.test.mjs'),
  path.join(root, 'tools', 'performancePolicy.test.mjs'),
  path.join(root, 'tools', 'textPolicy.test.mjs')
]) {
  execFileSync(process.execPath, ['--test', testFile], { cwd: root, stdio: 'inherit' });
}
