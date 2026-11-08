import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'dealping-scanner-test-'));
const fixture = join(temp, 'fixture.txt');
const report = join(temp, 'report.json');
const token = randomBytes(48).toString('base64url');

function scan(args: string[], expectedExit: number) {
  const result = spawnSync('sh', [join(root, 'scripts/betterleaks.sh'), ...args,
    '--report-format=json', '--report-path', report], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, expectedExit, 'Unexpected secret scanner exit status');
  const raw = readFileSync(report, 'utf8');
  assert.ok(!raw.includes(token), 'Secret must be redacted in reports');
  assert.ok(!(result.stdout + result.stderr).includes(token), 'Secret must be redacted in logs');
  return (JSON.parse(raw) ?? []) as { RuleID: string }[];
}

try {
  // Construct synthetic credentials at runtime; no usable secrets are committed.
  const paths = [
    'discord.com/api',
    'discordapp.com/api',
    'canary.discord.com/api',
    'ptb.discord.com/api/v10',
    'discord.com/api/v6',
    'canary.discordapp.com/api',
  ];
  writeFileSync(fixture, paths.map(path =>
    `https://${path}/webhooks/${'123456789012345678'}/${token}`
  ).join('\n'), { mode: 0o600 });
  const webhookFindings = scan(['dir', fixture], 1);
  assert.equal(webhookFindings.filter(f => f.RuleID === 'discord-webhook-url').length, paths.length);

  writeFileSync(fixture, [
    'https://discord.com/api/webhooks/...',
    'https://discord.com/api/webhooks/{id}/{token}',
    'https://example.com/api/webhooks/123/placeholder',
    'https://discord.com/channels/123/456',
  ].join('\n'));
  assert.equal(scan(['dir', fixture], 0).length, 0);

  const githubToken = `ghp_${randomBytes(27).toString('hex').slice(0, 36)}`;
  writeFileSync(fixture, githubToken);
  const upstreamFindings = scan(['dir', fixture], 1);
  assert.ok(upstreamFindings.some(f => f.RuleID === 'github-pat'), 'Upstream rules must remain enabled');
  assert.ok(!readFileSync(report, 'utf8').includes(githubToken));

  for (const args of [['init', '--quiet'], ['add', 'fixture.txt']]) {
    assert.equal(spawnSync('git', ['-C', temp, ...args], { stdio: 'pipe' }).status, 0);
  }
  writeFileSync(fixture, `https://discord.com/api/webhooks/123/${token}`);
  assert.equal(spawnSync('git', ['-C', temp, 'add', 'fixture.txt']).status, 0);
  assert.ok(scan(['git', temp, '--pre-commit', '--staged'], 1)
    .some(f => f.RuleID === 'discord-webhook-url'), 'Staged scans must block webhook URLs');

  console.log('Secret scanning checks passed: webhook variants, placeholders, upstream rules, staged changes, and redaction.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
