import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.nuruna.app',
  appName: 'Nuruna',
  webDir: 'dist',
  server: {
    // androidScheme: 'https' für Deep Links (optional)
  },
};

export default config;
