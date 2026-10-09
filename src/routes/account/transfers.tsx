import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { getMyGameProfile } from '#/server/game-profile/profile';
import { transferSimulatedItem } from '#/server/game-profile/transfers';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/account/transfers')({
  loader: () => getMyGameProfile(),
  component: TransfersPage,
});
function TransfersPage() {
  const profile = Route.useLoaderData();
  const [itemId, setItemId] = useState(profile.vault[0]?.id ?? '');
  const [targetEmail, setTargetEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const result = await transferSimulatedItem({
        data: { itemId, targetEmail, quantity },
      });
      setMessage(`Transferência concluída: ${result.protocol}`);
    } catch (transferError) {
      setError(
        transferError instanceof Error
          ? transferError.message
          : 'Não foi possível transferir.',
      );
    }
  }
  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">COFRE · SIMULADOR</p>
        <h1>Transferir item</h1>
        <p className="form-intro">
          Fluxo local de teste. Nenhuma alteração é enviada ao OpenMU.
        </p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Item
            <select
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
            >
              {profile.vault.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.itemName} · x{item.quantity}
                </option>
              ))}
            </select>
          </label>
          <label>
            E-mail do destinatário
            <input
              type="email"
              required
              value={targetEmail}
              onChange={(event) => setTargetEmail(event.target.value)}
            />
          </label>
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <button className="button button-primary" type="submit">
            Transferir
          </button>
        </form>
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </PageShell>
  );
}
