import { createFileRoute } from '@tanstack/react-router';

import { getSimulatedEvents } from '#/server/events/events';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/events')({
  loader: () => getSimulatedEvents(),
  component: EventsPage,
});

function EventsPage() {
  const events = Route.useLoaderData();
  return (
    <PageShell>
      <section className="content-section events-page">
        <p className="eyebrow">AGENDA</p>
        <h1>Próximos eventos</h1>
        <p className="form-intro">
          Horários simulados do servidor. A agenda indica programação, não
          execução confirmada.
        </p>
        <div className="event-list">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <div>
                <span>
                  {event.multiplier ? `${event.multiplier}x` : 'Evento'}
                </span>
                <h2>{event.name}</h2>
                <p>{event.description}</p>
              </div>
              <div className="event-time">
                <time dateTime={event.startsAt}>
                  {new Date(event.startsAt).toLocaleString('pt-BR')}
                </time>
                <span>
                  até {new Date(event.endsAt).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
