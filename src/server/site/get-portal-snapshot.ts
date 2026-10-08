import { createServerFn } from '@tanstack/react-start';
import { readSimulatedServerStatus } from '../integrations/openmu/simulated/server-status';
import { getActiveCampaigns } from './campaigns';
import { readSiteSettings } from './site-settings';

export const getPortalSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [settings, server, campaigns] = await Promise.all([
      readSiteSettings(),
      readSimulatedServerStatus(),
      getActiveCampaigns(),
    ]);
    return {
      updatedAt: new Date().toISOString(),
      server,
      news: settings.news,
      campaigns,
    };
  },
);
