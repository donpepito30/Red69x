import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AdProvider } from './context/AdContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AdProvider>
      <App />
    </AdProvider>
  </React.StrictMode>
);
