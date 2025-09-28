import React from 'react';
import ReactDOM from 'react-dom/client';
import Quiz from './Quiz';
import { DarkModeProvider } from './contexts/DarkModeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DarkModeProvider>
      <Quiz />
    </DarkModeProvider>
  </React.StrictMode>,
);