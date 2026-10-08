import { createServerFn } from '@tanstack/react-start';
import { readSimulatedServerStatus } from '../integrations/openmu/simulated/server-status';
import { readSiteSettings } from './site-settings';

export const getPortalSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [settings, server] = await Promise.all([
      readSiteSettings(),
      readSimulatedServerStatus(),
    ]);
    return { updatedAt: new Date().toISOString(), server, news: settings.news };
  },
);
