import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getInitialTheme } from './components/ThemeToggle';
import './index.css';

// Fija el tema antes de pintar, para que no parpadee al cargar.
document.documentElement.setAttribute('data-theme', getInitialTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
