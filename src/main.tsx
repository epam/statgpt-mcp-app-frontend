import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import './styles/global.scss';
import App from './App';
import { bridge } from './bridge';

ModuleRegistry.registerModules([AllCommunityModule]);

// Start the handshake before React mounts so the window `message` listener is
// attached as early as possible (the outer may post init immediately after it
// sees our bootstrap).
bridge.start();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
