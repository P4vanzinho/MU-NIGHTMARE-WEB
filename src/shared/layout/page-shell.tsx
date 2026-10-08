import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="MU Nightmare, início">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>MU NIGHTMARE</span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="/server">Servidor</a>
          <a href="/news">Notícias</a>
          <a href="/ranking">Ranking</a>
          <a href="/login">Entrar</a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>MU NIGHTMARE</span>
        <span>Portal local em construção</span>
      </footer>
    </div>
  );
}
