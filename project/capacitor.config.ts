import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.tiryani.agriportal',
  appName: 'Tiryani Agriculture Portal',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
