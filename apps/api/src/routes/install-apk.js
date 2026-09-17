import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    isIntegrationConfigured,
    respondNotConfigured,
} from '../utils/integrationConfig.js';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const EAS_ENTRY = path.join(ROOT, 'node_modules/eas-cli/bin/run');
const MOBILE_DIR = path.join(ROOT, 'mobile');
const NODE = process.execPath;

const PLACEHOLDER_PROJECT_ID = 'your-eas-project-id';
const UUID_RE =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function runEas(args, { timeout = 60000 } = {}) {
    return execFileAsync(NODE, [EAS_ENTRY, ...args], {
        cwd: MOBILE_DIR,
        env: { ...process.env, EXPO_TOKEN: process.env.EXPO_TOKEN },
        timeout,
        maxBuffer: 10 * 1024 * 1024,
    });
}

function extractJson(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
        throw new Error('EAS: δεν βρέθηκε JSON στην απάντηση:\n' + text);
    }
    return JSON.parse(text.slice(start, end + 1));
}

const easConfig = (req, res) => {
    let projectIdReady = false;
    try {
        const appJson = JSON.parse(
            fs.readFileSync(path.join(MOBILE_DIR, 'app.json'), 'utf8'),
        );
        const pid = appJson?.expo?.extra?.eas?.projectId;
        projectIdReady =
            typeof pid === 'string' &&
            pid !== PLACEHOLDER_PROJECT_ID &&
            UUID_RE.test(pid);
    } catch {
        projectIdReady = false;
    }
    res.json({
        configured: isIntegrationConfigured('EXPO_TOKEN'),
        projectIdReady,
    });
};

const startEasBuild = async (req, res) => {
    if (!isIntegrationConfigured('EXPO_TOKEN')) {
        return respondNotConfigured(res, {
            integration: 'Expo EAS Build',
            envKeys: 'EXPO_TOKEN',
        });
    }
    const { stdout, stderr } = await runEas(
        [
            'build',
            '--platform',
            'android',
            '--profile',
            'preview',
            '--non-interactive',
            '--no-wait',
        ],
        { timeout: 240000 },
    );
    const output = `${stdout}\n${stderr}`;
    const urlMatch = output.match(/builds\/([0-9a-f-]{36})/i);
    const idMatch = urlMatch || output.match(UUID_RE);
    if (!idMatch) {
        throw new Error(
            'EAS build: δεν ήταν δυνατή η ανάκτηση του build ID.\n' + output,
        );
    }
    res.json({ buildId: idMatch[1] });
};

const easStatus = async (req, res) => {
    const { buildId } = req.query;
    if (!buildId) {
        return res
            .status(422)
            .json({ error: 'buildId query param is required' });
    }
    if (!isIntegrationConfigured('EXPO_TOKEN')) {
        return respondNotConfigured(res, {
            integration: 'Expo EAS Build',
            envKeys: 'EXPO_TOKEN',
        });
    }
    const { stdout, stderr } = await runEas(
        ['build:view', buildId, '--json'],
        { timeout: 60000 },
    );
    const data = extractJson(`${stdout}\n${stderr}`);
    const build = data.data || data;
    const status = String(build.status || build.buildStatus || '').toLowerCase();
    const downloadUrl = build.artifacts?.buildUrl || build.buildUrl || null;
    res.json({ status, downloadUrl });
};

export default (router) => {
    router.get('/install-android/eas-config', easConfig);
    router.post('/install-android/eas-build', startEasBuild);
    router.get('/install-android/eas-status', easStatus);
    return router;
};
