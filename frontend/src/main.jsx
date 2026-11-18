import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FitnessProvider } from './context/FitnessContext';
import App from './App';
import './index.css';

// Ensure Light Theme globally on mount
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  if (document.body) {
    document.body.classList.remove('dark');
    document.body.style.backgroundColor = '#F6FAF7';
    document.body.style.color = '#263D32';
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FitnessProvider>
        <App />
      </FitnessProvider>
    </BrowserRouter>
  </React.StrictMode>
);
