import { describe, expect, it } from 'vitest';

import { readSimulatedServerStatus } from '../src/server/integrations/openmu/simulated/server-status';

describe('simulador de status OpenMU', () => {
  it('expõe o contrato mínimo usado pelo portal', async () => {
    const status = await readSimulatedServerStatus();

    expect(status).toMatchObject({
      status: 'online',
      statusLabel: 'Servidor online',
      onlinePlayers: expect.any(Number),
      experienceRate: expect.any(Number),
      dropRate: expect.any(Number),
    });
  });
});
