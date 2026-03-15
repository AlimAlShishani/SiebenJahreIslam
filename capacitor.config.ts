/// <reference types="@capacitor-community/safe-area" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.nuruna.twa',
  appName: 'Nuruna',
  webDir: 'dist',
  server: {
    // androidScheme: 'https' für Deep Links (optional)
  },
  plugins: {
    SystemBars: { insetsHandling: 'disable' },
  },
};

export default config;
