import type { OpenMuMode, OpenMuPublicGateway } from './contracts/public';
import { OpenMuUnavailableError } from './contracts/public';

const mode = (process.env.OPENMU_MODE ?? 'simulated') as OpenMuMode;

const simulatedGateway: OpenMuPublicGateway = {
  async health() {
    return {
      mode: 'simulated',
      connected: true,
      capabilities: ['server-status', 'ranking', 'events', 'player-profile'],
      message: 'Dados locais simulados; nenhuma chamada foi feita ao jogo.',
    };
  },
};

const realGateway: OpenMuPublicGateway = {
  async health() {
    throw new OpenMuUnavailableError();
  },
};

export function getOpenMuGateway(): OpenMuPublicGateway {
  return mode === 'real' ? realGateway : simulatedGateway;
}

export function getOpenMuMode(): OpenMuMode {
  return mode === 'real' ? 'real' : 'simulated';
}
