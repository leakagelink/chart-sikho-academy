import type { CapacitorConfig } from '@capacitor/cli';

// The app is a full-stack app (login + database via Lovable Cloud), so the
// Android app loads the primary public domain. Internet is required in the APK.
// The private preview URL must NOT be used here: it requires a Lovable login,
// which sends users to lovable.dev in the external browser.
const config: CapacitorConfig = {
  appId: 'com.chartsikho.app',
  appName: 'ChartSikho',
  // Offline fallback shell only; the live app comes from server.url.
  webDir: 'capacitor-web',
  // Lets the website show app-only screens (e.g. the app sign-in design).
  appendUserAgent: 'ChartSikhoApp',
  server: {
    url: 'https://chartsikho.in',
    androidScheme: 'https',
    // Keep navigation on this project's public app hosts inside Android.
    // www and lovable.app redirect to the primary domain, so they are listed too.
    // Never use '*' or '*.lovable.app': unrelated sites must remain external.
    allowNavigation: ['chartsikho.in', 'www.chartsikho.in', 'chart-sikho-course-hub.lovable.app'],
  },
  // Draw the app edge-to-edge behind the status bar (full-screen look);
  // the page pads its header with the safe-area inset.
  plugins: {
    SystemBars: { insetsHandling: 'css', style: 'DARK' },
  },
};

export default config;
