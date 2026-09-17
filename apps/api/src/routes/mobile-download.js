import path from 'node:path';
import { ZipArchive } from 'archiver';

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, '../../../..');

const IGNORE_PATTERNS = [
    'mobile/node_modules/**',
    'mobile/.expo/**',
    'mobile/dist/**',
    'mobile/build/**',
    'mobile/.git/**',
    'mobile/**/*.log',
];

export const downloadSource = async (req, res) => {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
        'Content-Disposition',
        'attachment; filename="reportaki-mobile.zip"',
    );

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on('error', (err) => {
        throw err;
    });
    archive.pipe(res);

    archive.glob('mobile/**/*', {
        cwd: WORKSPACE_ROOT,
        ignore: IGNORE_PATTERNS,
        dot: true,
    });

    await archive.finalize();
};

export default (router) => {
    router.get('/mobile-download/source', downloadSource);
    return router;
};
