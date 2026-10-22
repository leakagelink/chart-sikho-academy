import type { CapacitorConfig } from '@capacitor/cli';

// The app is a full-stack app (login + database via Lovable Cloud), so the
// Android app loads the public published URL. Internet is required in the APK.
// The private preview URL must NOT be used here: it requires a Lovable login,
// which sends users to lovable.dev in the external browser.
const config: CapacitorConfig = {
  appId: 'com.chartsikho.app',
  appName: 'ChartSikho',
  webDir: 'public',
  server: {
    url: 'https://chart-sikho-course-hub.lovable.app',
    androidScheme: 'https',
    // Keep navigation on this project's public app host inside Android.
    // Never use '*' or '*.lovable.app': unrelated sites must remain external.
    allowNavigation: ['chart-sikho-course-hub.lovable.app'],
  },
};

export default config;
