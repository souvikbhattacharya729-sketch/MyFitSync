import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FitnessProvider } from './context/FitnessContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FitnessProvider>
        <App />
      </FitnessProvider>
    </BrowserRouter>
  </React.StrictMode>
);
