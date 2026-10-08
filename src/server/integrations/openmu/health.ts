import { createServerFn } from '@tanstack/react-start';
import { getOpenMuGateway } from './composition';
import type { OpenMuHealth } from './contracts/public';

export const readOpenMuHealth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OpenMuHealth> => {
    try {
      return await getOpenMuGateway().health();
    } catch (error) {
      return {
        mode: 'real',
        connected: false,
        capabilities: [],
        message:
          error instanceof Error ? error.message : 'Integração indisponível.',
      };
    }
  },
);
