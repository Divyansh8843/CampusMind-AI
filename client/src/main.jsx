import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import AppPreloader from './components/AppPreloader';
import { setupSessionInterceptor, syncSession } from './utils/sessionManager';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const preloadMs = Number(import.meta.env.VITE_PRELOADER_MS || 2200);

setupSessionInterceptor();

const Root = () => {
  React.useEffect(() => {
    syncSession();
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <BrowserRouter key="app">
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
);
