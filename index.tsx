import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Elemento #root nao encontrado para iniciar a aplicacao.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
