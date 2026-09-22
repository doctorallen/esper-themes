// Captures a screenshot of every contributed theme in an isolated VS Code
// Extension Development Host, with sample code open, then rewrites the README
// screenshot section. Adapted from Deckard's capture-dashboard-screenshot.mjs.
//
// Usage:
//   npm run capture:screenshots                 # every theme
//   npm run capture:screenshots -- Replicant Q  # only these themes
//
// ESPER_SCREENSHOT_KEEP_HOST=1 leaves each host open for inspection.

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const imageDirectory = join(repositoryRoot, 'docs', 'images', 'themes');
const readmePath = join(repositoryRoot, 'README.md');
const README_START = '<!-- theme-screenshots:start -->';
const README_END = '<!-- theme-screenshots:end -->';
const WIDTH = 1920;
const HEIGHT = 1080;
const Q_THEME = 'Q';

// Opened in this order; the last one is the active editor in the screenshot.
// ESPER_SCREENSHOT_FILES overrides the set (comma separated, workspace
// relative), ESPER_SCREENSHOT_LINE the substring scrolled to the top of the
// active editor, and ESPER_SCREENSHOT_SUFFIX the name each image is written
// under, so one theme can be shot against more than one grammar.
const sampleFiles = (process.env.ESPER_SCREENSHOT_FILES ?? [
  'angular/relay-dashboard.component.html',
  'angular/relay-telemetry.service.ts',
].join(',')).split(',').map((file) => file.trim()).filter(Boolean);
const activeFileLine = process.env.ESPER_SCREENSHOT_LINE ?? 'export class RelayTelemetryService';
const imageSuffix = process.env.ESPER_SCREENSHOT_SUFFIX ?? '';
// ESPER_SCREENSHOT_DIFF shoots the diff editor instead, so the inserted and
// removed washes can be checked the way they are actually seen.
const diffCapture = process.env.ESPER_SCREENSHOT_DIFF === '1';

const manifest = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'));
const contributedThemes = manifest.contributes.themes.map((theme) => ({
  label: theme.label,
  path: resolve(repositoryRoot, theme.path),
}));
const requested = process.argv.slice(2);
const unknown = requested.filter(
  (label) => !contributedThemes.some((theme) => theme.label === label),
);
if (unknown.length > 0) {
  throw new Error(
    `Unknown theme(s): ${unknown.join(', ')}. Choose from: ${contributedThemes
      .map((theme) => theme.label)
      .join(', ')}.`,
  );
}
const themes =
  requested.length > 0
    ? contributedThemes.filter((theme) => requested.includes(theme.label))
    : contributedThemes;

function slug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', ...options }).trim();
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function hexToRgb(hex) {
  const value = hex.replace(/^#/, '');
  const [red, green, blue] = [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16));
  return `rgb(${red}, ${green}, ${blue})`;
}

function choosePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once('error', rejectPort);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? rejectPort(error) : resolvePort(port)));
    });
  });
}

async function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) {
      return;
    }
    pending.delete(message.id);
    message.error
      ? request.reject(new Error(JSON.stringify(message.error)))
      : request.resolve(message.result ?? {});
  };
  await new Promise((resolveOpen, rejectOpen) => {
    socket.onopen = resolveOpen;
    socket.onerror = rejectOpen;
  });
  return {
    call(method, params = {}, sessionId) {
      return new Promise((resolveCall, rejectCall) => {
        const id = ++nextId;
        pending.set(id, { resolve: resolveCall, reject: rejectCall });
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    },
    close() {
      socket.close();
    },
  };
}

async function evaluate(client, expression, sessionId) {
  const result = await client.call(
    'Runtime.evaluate',
    { expression, returnByValue: true },
    sessionId,
  );
  return result.result?.value;
}

// A git repository with one modified and one untracked file, so the Explorer
// shows the theme's Git decoration colors.
function writeWorkspace(workspace) {
  cpSync(join(repositoryRoot, 'samples'), workspace, { recursive: true });
  const git = (...args) => run('git', args, { cwd: workspace });
  git('init', '--quiet');
  git('add', '.');
  git(
    '-c', 'user.name=Esper Screenshots',
    '-c', 'user.email=screenshots@example.invalid',
    'commit', '--quiet', '-m', 'Samples',
  );
  const modified = join(workspace, 'angular', 'relay-dashboard.component.ts');
  writeFileSync(modified, `${readFileSync(modified, 'utf8')}\n// Pending review.\n`);
  writeFileSync(join(workspace, 'angular', 'relay-alerts.ts'), 'export const alerts = [];\n');
  writeDiffPair(workspace);
}

// A small before/after pair with inserted, removed and changed-within-a-line
// edits, so one frame shows every wash the diff editor paints.
function writeDiffPair(workspace) {
  mkdirSync(join(workspace, 'diff'), { recursive: true });
  const before = `export const relayDefaults = {
  socketPath: '/run/relay.sock',
  journalDir: '/var/lib/relay',
  maxReaders: 32,
  logLevel: 'info',
};

export function describeRelay(status) {
  if (status === 'degraded') {
    return 'Relay is degraded.';
  }
  return 'Relay is healthy.';
}
`;
  const after = `export const relayDefaults = {
  socketPath: '/run/relay.sock',
  journalDir: '/var/lib/relay',
  maxReaders: 64,
  fsync: true,
  logLevel: 'info',
};

export function describeRelay(status, since) {
  if (status === 'degraded') {
    return \`Relay has been degraded since \${since}.\`;
  }
  return 'Relay is healthy.';
}
`;
  writeFileSync(join(workspace, 'diff', 'relay-defaults.before.ts'), before);
  writeFileSync(join(workspace, 'diff', 'relay-defaults.after.ts'), after);
}

function writeProfileSettings(profile, theme) {
  mkdirSync(join(profile, 'User'), { recursive: true });
  writeFileSync(
    join(profile, 'User', 'settings.json'),
    JSON.stringify(
      {
        'workbench.colorTheme': theme.label,
        'workbench.startupEditor': 'none',
        'workbench.tips.enabled': false,
        'workbench.secondarySideBar.defaultVisibility': 'hidden',
        'workbench.editor.highlightModifiedTabs': true,
        // Modern UI ships as a VS Code experiment, which a fresh profile with
        // telemetry off never receives, so turn it on explicitly.
        'workbench.experimental.modernUI': true,
        'chat.disableAIFeatures': true,
        'extensions.ignoreRecommendations': true,
        'security.workspace.trust.enabled': false,
        'telemetry.telemetryLevel': 'off',
        'update.mode': 'none',
        'editor.fontSize': 14,
        'editor.semanticHighlighting.enabled': true,
        'editor.stickyScroll.enabled': false,
        'editor.occurrencesHighlight': 'off',
        'editor.selectionHighlight': false,
        'editor.lightbulb.enabled': 'off',
        // The samples import packages that are not installed; keep their
        // diagnostics out of the picture while semantic highlighting still runs.
        'typescript.validate.enable': false,
        'javascript.validate.enable': false,
        'git.blame.statusBarItem.enabled': false,
        'git.openRepositoryInParentFolders': 'never',
        'window.title': '${rootName}',
      },
      null,
      2,
    ),
  );
}

// Runs inside the isolated host, so no OS-level input reaches other windows.
function writeCompanionExtension(companion) {
  writeFileSync(
    join(companion, 'package.json'),
    JSON.stringify({
      name: 'esper-screenshot-helper',
      publisher: 'esper-screenshot',
      version: '0.0.1',
      engines: { vscode: '^1.136.0' },
      activationEvents: ['onStartupFinished'],
      main: './extension.js',
    }),
  );
  writeFileSync(
    join(companion, 'extension.js'),
    `const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const files = ${JSON.stringify(sampleFiles)};
const activeLine = ${JSON.stringify(activeFileLine)};
const diffCapture = ${JSON.stringify(diffCapture)};
function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
async function run(command, ...args) {
  await vscode.commands.executeCommand(command, ...args);
}
function scopedColor(key) {
  const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
  const customizations = vscode.workspace.getConfiguration().get('workbench.colorCustomizations') || {};
  return customizations['[' + theme + ']']?.[key];
}
async function activate() {
  try {
    for (let attempt = 0; attempt < 120 && !fs.existsSync(path.join(__dirname, 'sized')); attempt += 1) {
      await delay(500);
    }
    const isQ = vscode.workspace.getConfiguration('workbench').get('colorTheme') === ${JSON.stringify(Q_THEME)};
    // Q generates its palette on startup, and every theme gets its Modern UI
    // tab strokes written to settings; wait for both before laying out.
    for (
      let attempt = 0;
      attempt < 120 && (!scopedColor('tab.activeBorderTop') || (isQ && !scopedColor('editor.background')));
      attempt += 1
    ) {
      await delay(500);
    }
    await run('workbench.action.closeAllEditors');
    await run('workbench.action.closeAuxiliaryBar');
    await run('workbench.action.closePanel');
    const workspace = vscode.workspace.workspaceFolders[0].uri;
    if (diffCapture) {
      await run(
        'vscode.diff',
        vscode.Uri.joinPath(workspace, 'diff', 'relay-defaults.before.ts'),
        vscode.Uri.joinPath(workspace, 'diff', 'relay-defaults.after.ts'),
        'relay-defaults.ts (Working Tree)',
      );
      await run('workbench.view.explorer');
      await run('workbench.action.focusActiveEditorGroup');
      await delay(2500);
      fs.writeFileSync(
        path.join(__dirname, 'ready'),
        JSON.stringify({
          editorBackground: isQ ? scopedColor('editor.background') : undefined,
          activeBorderTop: scopedColor('tab.activeBorderTop'),
          topLine: '1',
        }),
      );
      return;
    }
    let editor;
    for (const file of files) {
      editor = await vscode.window.showTextDocument(vscode.Uri.joinPath(workspace, file), { preview: false });
    }
    const lines = editor.document.getText().split(/\\r?\\n/);
    const line = Math.max(0, lines.findIndex((candidate) => candidate.includes(activeLine)));
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
    await run('workbench.view.explorer');
    await run('revealInExplorer', editor.document.uri);
    await run('workbench.action.focusActiveEditorGroup');
    await delay(1500);
    // Revealing the Explorer can scroll the editor, so put the line back on top.
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
    await delay(500);
    fs.writeFileSync(
      path.join(__dirname, 'ready'),
      JSON.stringify({
        editorBackground: isQ ? scopedColor('editor.background') : undefined,
        activeBorderTop: scopedColor('tab.activeBorderTop'),
        topLine: String(line + 1),
      }),
    );
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, 'error'), error.stack || String(error));
  }
}
module.exports = { activate };
`,
  );
}

function verifyPortOwner(port, profile) {
  const listener = run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN']).split('\n')[1];
  const owner = listener?.trim().split(/\s+/)[1];
  if (!owner) {
    throw new Error(`No process owns CDP port ${port}`);
  }
  const command = run('ps', ['-ww', '-p', owner, '-o', 'command=']);
  if (!command.includes(profile) || !command.includes(repositoryRoot)) {
    throw new Error(`CDP port ${port} is not owned by this capture host: ${command}`);
  }
  return owner;
}

async function waitForCdp(port) {
  let failure;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      const version = await response.json();
      if (typeof version.webSocketDebuggerUrl === 'string') {
        return version;
      }
    } catch (error) {
      failure = error;
    }
    await delay(1000);
  }
  throw new Error(`CDP endpoint was not reachable on port ${port}: ${failure?.message ?? 'unknown error'}`);
}

async function stopHost(port, owner) {
  if (!owner) {
    return;
  }
  try {
    process.kill(Number(owner), 'SIGTERM');
  } catch (error) {
    if (error.code === 'ESRCH') {
      return;
    }
    throw error;
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN']).status !== 0) {
      return;
    }
    await delay(250);
  }
  throw new Error(`Capture host did not release CDP port ${port}`);
}

// The editor has painted the expected background and active tab stroke, and
// tokenized the sample.
function renderedExpression(editorBackground, activeBorderTop, topLine) {
  return `(() => {
    const editor = document.querySelector('.part.editor .monaco-editor .monaco-editor-background');
    if (!editor || getComputedStyle(editor).backgroundColor !== ${JSON.stringify(editorBackground)}) return false;
    const tab = document.querySelector('.part.editor .tab.active > .tab-fill');
    if (!tab || getComputedStyle(tab).borderTopColor !== ${JSON.stringify(activeBorderTop)}) return false;
    const firstLine = document.querySelector('.part.editor .margin-view-overlays .line-numbers');
    if (firstLine?.textContent?.trim() !== ${JSON.stringify(topLine)}) return false;
    // The capture window takes focus, so stray typing can land in a sample
    // file; never shoot a modified one.
    if (document.querySelector('.part.editor .tab.dirty')) return false;
    const tokens = new Set([...document.querySelectorAll('.part.editor .view-lines span[class^="mtk"]')].map((span) => span.className));
    const explorerRows = document.querySelectorAll('.explorer-folders-view .monaco-list-row').length;
    return tokens.size > 5 && explorerRows > 3;
  })()`;
}

async function captureTheme(theme, output) {
  const workspaceParent = mkdtempSync(join(tmpdir(), 'esper-screenshot-workspace-'));
  const workspace = join(workspaceParent, 'samples');
  const profile = mkdtempSync(join(tmpdir(), 'esper-screenshot-profile-'));
  const extensions = mkdtempSync(join(tmpdir(), 'esper-screenshot-extensions-'));
  const companion = mkdtempSync(join(tmpdir(), 'esper-screenshot-companion-'));
  const port = await choosePort();
  let owner;
  let succeeded = false;
  try {
    writeWorkspace(workspace);
    writeProfileSettings(profile, theme);
    writeCompanionExtension(companion);
    spawn(
      'code',
      [
        '--new-window',
        '--disable-workspace-trust',
        '--skip-welcome',
        '--skip-release-notes',
        '--disable-telemetry',
        '--user-data-dir', profile,
        '--extensions-dir', extensions,
        '--extensionDevelopmentPath', repositoryRoot,
        '--extensionDevelopmentPath', companion,
        `--remote-debugging-port=${port}`,
        workspace,
      ],
      { detached: true, stdio: 'ignore' },
    ).unref();

    const version = await waitForCdp(port);
    owner = verifyPortOwner(port, profile);
    const client = await createCdpClient(version.webSocketDebuggerUrl);
    try {
      let sessionId;
      let expectedBackground;
      if (theme.label !== Q_THEME) {
        const themeJson = JSON.parse(readFileSync(theme.path, 'utf8'));
        expectedBackground = hexToRgb(themeJson.colors['editor.background']);
      }
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const targets = (await client.call('Target.getTargets')).targetInfos ?? [];
        const workbench = targets.find(
          (target) => target.type === 'page' && (target.url ?? '').endsWith('/workbench/workbench.html'),
        );
        if (workbench && !sessionId) {
          ({ sessionId } = await client.call('Target.attachToTarget', {
            targetId: workbench.targetId,
            flatten: true,
          }));
          await client.call(
            'Emulation.setDeviceMetricsOverride',
            { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false },
            sessionId,
          );
          writeFileSync(join(companion, 'sized'), 'ok');
        }
        const errorPath = join(companion, 'error');
        if (existsSync(errorPath)) {
          throw new Error(readFileSync(errorPath, 'utf8'));
        }
        const readyPath = join(companion, 'ready');
        if (sessionId && existsSync(readyPath)) {
          const ready = JSON.parse(readFileSync(readyPath, 'utf8'));
          if (!expectedBackground) {
            if (!ready.editorBackground) {
              throw new Error('Q did not generate a palette.');
            }
            expectedBackground = hexToRgb(ready.editorBackground);
          }
          if (!ready.activeBorderTop) {
            throw new Error(`${theme.label} has no Modern UI tab border in settings.`);
          }
          const expectedBorder = hexToRgb(ready.activeBorderTop);
          if (
            await evaluate(
              client,
              renderedExpression(expectedBackground, expectedBorder, ready.topLine),
              sessionId,
            )
          ) {
            // Semantic tokens arrive after the TypeScript server starts.
            await delay(4000);
            const screenshot = await client.call(
              'Page.captureScreenshot',
              { format: 'png', fromSurface: true },
              sessionId,
            );
            const png = Buffer.from(screenshot.data, 'base64');
            if (png.readUInt32BE(16) !== WIDTH || png.readUInt32BE(20) !== HEIGHT) {
              throw new Error(`Screenshot is not ${WIDTH}x${HEIGHT}.`);
            }
            mkdirSync(imageDirectory, { recursive: true });
            writeFileSync(output, png);
            succeeded = true;
            return;
          }
        }
        await delay(1000);
      }
      throw new Error(`${theme.label} did not render within 120 seconds.`);
    } finally {
      client.close();
    }
  } finally {
    if (succeeded && process.env.ESPER_SCREENSHOT_KEEP_HOST !== '1') {
      await stopHost(port, owner);
      for (const directory of [workspaceParent, profile, extensions, companion]) {
        rmSync(directory, { recursive: true, force: true });
      }
    } else {
      console.error(
        `Capture host retained:\nworkspace=${workspace}\nprofile=${profile}\ncompanion=${companion}\nport=${port}\npid=${owner}`,
      );
    }
  }
}

function updateReadme() {
  const readme = readFileSync(readmePath, 'utf8');
  const start = readme.indexOf(README_START);
  const end = readme.indexOf(README_END);
  if (start < 0 || end < start) {
    throw new Error(`README.md needs ${README_START} and ${README_END} markers.`);
  }
  const sections = contributedThemes
    .filter((theme) => existsSync(join(imageDirectory, `${slug(theme.label)}.png`)))
    .map((theme) => {
      const image = relative(repositoryRoot, join(imageDirectory, `${slug(theme.label)}.png`));
      return `### ${theme.label}\n\n![${theme.label} theme](${image})`;
    });
  const block = `${README_START}\n\n${sections.join('\n\n')}\n\n${README_END}`;
  writeFileSync(readmePath, readme.slice(0, start) + block + readme.slice(end + README_END.length));
}

for (const theme of themes) {
  const output = join(imageDirectory, `${slug(theme.label)}${imageSuffix}.png`);
  console.log(`Capturing ${theme.label}...`);
  await captureTheme(theme, output);
  console.log(`  wrote ${relative(repositoryRoot, output)}`);
}
// The README section lists the canonical shot of each theme, so a run that
// aimed the camera somewhere else leaves it alone.
if (!imageSuffix) {
  updateReadme();
  console.log('Updated README.md screenshots.');
}
