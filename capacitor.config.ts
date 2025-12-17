import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orcestra.dicom',
  appName: 'Orcestra DiCoM',
  webDir: 'dist/public',  // ← MUDE AQUI! (era 'dist')
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;