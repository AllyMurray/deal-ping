import { spawnSync } from 'node:child_process';
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? 'files';
const scanner = join(root, 'scripts/betterleaks.sh');

function scan(args: string[]): number {
  const result = spawnSync('sh', [scanner, ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (mode === 'staged') {
  process.exitCode = scan(['git', root, '--pre-commit', '--staged']);
} else if (mode === 'history') {
  process.exitCode = scan(['git', root, '--log-opts=--full-history --all --diff-merges=first-parent']);
} else if (mode === 'commits') {
  const base = process.env.SCAN_BASE;
  if (!base || /^0+$/.test(base)) {
    console.log('No previous commit supplied; source snapshot is checked separately.');
  } else {
    if (!/^[a-f0-9]{40}$/i.test(base)) throw new Error('Invalid scan base commit');
    process.exitCode = scan(['git', root, `--log-opts=--full-history --diff-merges=first-parent ${base}..HEAD`]);
  }
} else if (mode === 'files') {
  // Scan tracked and untracked source, excluding ignored local data/build output.
  // A snapshot also avoids following symlinks outside the checkout.
  const snapshot = mkdtempSync(join(tmpdir(), 'dealping-secrets-'));
  try {
    const listing = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root, encoding: 'utf8',
    });
    if (listing.status !== 0) throw new Error('Could not list source files for secret scanning');
    for (const name of new Set(listing.stdout.split('\0').filter(Boolean))) {
      const source = join(root, name);
      let stat;
      try { stat = lstatSync(source); } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue; // Local deletions
        throw error;
      }
      if (!stat.isFile()) continue;
      const target = join(snapshot, name);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
    }
    process.exitCode = scan(['dir', snapshot]);
  } finally {
    rmSync(snapshot, { recursive: true, force: true });
  }
} else {
  throw new Error(`Unknown scan mode: ${mode}`);
}
