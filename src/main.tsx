import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// El tema es uno solo y oscuro, a propósito: la página es un reproductor
// y la carátula manda. Ya no hay conmutador que fijar antes de pintar.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
