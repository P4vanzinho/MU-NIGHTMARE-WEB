export type OpenMuMode = 'simulated' | 'real';

export type OpenMuCapability =
  | 'server-status'
  | 'ranking'
  | 'events'
  | 'player-profile';

export type OpenMuHealth = {
  mode: OpenMuMode;
  connected: boolean;
  capabilities: OpenMuCapability[];
  message: string;
};

export interface OpenMuPublicGateway {
  health(): Promise<OpenMuHealth>;
}

export class OpenMuUnavailableError extends Error {
  constructor(
    message = 'A integração real com OpenMU ainda não está configurada.',
  ) {
    super(message);
    this.name = 'OpenMuUnavailableError';
  }
}
