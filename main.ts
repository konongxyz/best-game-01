// Emberfall's entry program for make.fun's best-game-01 (Node 22, standard
// library only). The game itself is the static site in game/ — index.html
// plus its ES modules, no build step, no network — and this program hands
// it in: it copies game/ and screenshots/ into the output directory and
// writes dossier.json there with the kit's vendored library, exactly the
// bytes the scorer rebuilds and compares.
//
// Run it the way the grader does (output defaults to /output), or locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game first with: node serve.ts  (http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the gate's own (reference/gate.json): the dossier text is
// capped at 160 KiB, screenshots at 4 files of 256 KiB, and game/ at 993
// entries, 48 MiB in all and 1,000 bytes a path.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Emberfall handed in: game/ and screenshots/ copied, dossier.json ${dossier.length} bytes.`);
