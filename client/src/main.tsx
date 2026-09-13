import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Path-based mount: the storefront keeps its hand-rolled router untouched,
// while everything under /admin is served by the React Router based AdminApp.
const isAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!);

  if (isAdmin) {
    const { default: AdminApp } = await import('./admin/AdminApp');
    root.render(
      <StrictMode>
        <AdminApp />
      </StrictMode>
    );
  } else {
    const { default: App } = await import('./App');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

bootstrap();
