import type { CapacitorConfig } from '@capacitor/cli';

// The app is a full-stack app (login + database via Lovable Cloud), so the
// Android app loads the live preview URL. Internet is required in the APK.
// After go-live, replace this URL with the published/custom domain.
const config: CapacitorConfig = {
  appId: 'com.chartsikho.app',
  appName: 'ChartSikho',
  webDir: 'public',
  server: {
    url: 'https://id-preview--62b93306-bbec-431c-8a80-05c6306a5ecd.lovable.app',
    androidScheme: 'https',
  },
};

export default config;
