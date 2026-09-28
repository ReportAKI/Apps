import path from 'node:path';
import { ZipArchive } from 'archiver';

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, '../../../..');

const IGNORE_PATTERNS = [
    'apps/**/node_modules/**',
    'apps/**/dist/**',
    'apps/**/build/**',
    'apps/**/.cache/**',
    'apps/**/.vite/**',
    'apps/**/.git/**',
    'apps/**/pb_data/**',
    'apps/pocketbase/pocketbase',
    'apps/**/*.log',
    'apps/api/.env',
    'apps/**/.env',
    'mobile/node_modules/**',
    'mobile/.expo/**',
    'mobile/dist/**',
    'mobile/build/**',
    'mobile/.git/**',
    'mobile/**/*.log',
    'mobile/google-service-account.json',
    'node_modules/**',
    'vault/**',
    '.git/**',
];

const LOCAL_SETUP_TXT = `ReportAKI — Τοπική εγκατάσταση (VS Code)

1) Απαιτήσεις
   - Node.js 20+ (ή 22)
   - VS Code
   - Για iOS builds: macOS + Xcode + λογαριασμός Apple Developer
   - Για Android builds: Android Studio (προαιρετικά) + λογαριασμός Expo/EAS
   - Για Play Store: Google Play Console
   - Για App Store: Apple Developer Program

2) Αποσυμπιέστε το ZIP και ανοίξτε τον φάκελο στο VS Code

3) Εγκατάσταση dependencies
   npm install
   cd mobile && npm install && cd ..

4) PocketBase (τοπικά)
   cd apps/pocketbase
   # Κατεβάστε το binary από https://pocketbase.io/docs/ αν λείπει
   ./pocketbase superuser upsert Η_EMAIL_ΣΑΣ Ο_ΚΩΔΙΚΟΣ_ΣΑΣ --dir=./pb_data
   ./pocketbase serve --http=127.0.0.1:8090
   Admin UI: http://127.0.0.1:8090/_/

5) API secrets (ΜΟΝΟ server-side)
   cp apps/api/.env.example apps/api/.env
   Συμπληρώστε στο apps/api/.env:
     PB_SUPERUSER_EMAIL=...
     PB_SUPERUSER_PASSWORD=...
   Ποτέ μην βάλετε αυτούς τους κωδικούς σε React, mobile ή public repo.

6) Εκκίνηση monorepo
   npm run dev
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - PocketBase: http://localhost:8090

7) Mobile (Expo) — Android & iOS
   cd mobile
   # Τοπικό API από φυσική συσκευή: βάλτε το LAN IP του PC
   export EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3001
   export EXPO_PUBLIC_PB_URL=http://192.168.x.x:8090
   npx expo start
   - Android emulator: a
   - iOS simulator (macOS): i
   - Φυσική συσκευή: Expo Go + QR

8) Production mobile URLs
   Στο mobile/app.json → extra.apiBaseUrl και extra.pocketbaseUrl
   βάλτε το δημοσιευμένο domain σας, π.χ.:
     https://το-domain.com/hcgi/api
     https://το-domain.com/hcgi/platform

9) Builds για stores (EAS)
   npm i -g eas-cli
   eas login
   cd mobile
   # Βάλτε πραγματικό projectId στο app.json → extra.eas.projectId
   eas build:configure

   # Δοκιμή APK
   eas build --platform android --profile preview

   # Play Store (AAB)
   eas build --platform android --profile production
   eas submit --platform android

   # App Store (IPA) — απαιτεί Apple Developer
   eas build --platform ios --profile production
   eas submit --platform ios

10) Σημειώσεις stores
    - Android package: com.reportaki.app
    - iOS bundle: com.reportaki.app
    - Privacy policy URL και screenshots απαιτούνται από τα stores
    - Μην ανεβάζετε apps/api/.env ή google-service-account.json στο git

Η web λειτουργικότητα (ΚΑΕΚ, χάρτης, Πόρισμα Ακινήτου, εξαγωγές) παραμένει ίδια.
`;

export default async (req, res) => {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
        'Content-Disposition',
        'attachment; filename="reportaki-source.zip"',
    );

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on('error', (err) => {
        throw err;
    });
    archive.pipe(res);

    archive.glob('apps/**/*', {
        cwd: WORKSPACE_ROOT,
        ignore: IGNORE_PATTERNS,
        dot: true,
    });

    archive.glob('mobile/**/*', {
        cwd: WORKSPACE_ROOT,
        ignore: IGNORE_PATTERNS,
        dot: true,
    });

    archive.file(path.join(WORKSPACE_ROOT, 'package.json'), { name: 'package.json' });
    archive.file(path.join(WORKSPACE_ROOT, 'package-lock.json'), {
        name: 'package-lock.json',
    });

    try {
        archive.file(path.join(WORKSPACE_ROOT, 'apps/api/.env.example'), {
            name: 'apps/api/.env.example',
        });
    } catch {
    }

    archive.append(LOCAL_SETUP_TXT, { name: 'LOCAL_SETUP.txt' });

    await archive.finalize();
};
