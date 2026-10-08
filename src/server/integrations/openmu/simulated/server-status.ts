export type SimulatedServerStatus = {
  name: string;
  status: 'online' | 'offline';
  statusLabel: string;
  onlinePlayers: number;
  experienceRate: number;
  dropRate: number;
};
export async function readSimulatedServerStatus(): Promise<SimulatedServerStatus> {
  return {
    name: 'Nightmare Season 1',
    status: 'online',
    statusLabel: 'Servidor online',
    onlinePlayers: 128,
    experienceRate: 500,
    dropRate: 35,
  };
}
