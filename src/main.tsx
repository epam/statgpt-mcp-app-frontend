import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.scss';
import App from './App';
import { bridge } from './bridge';
import { logger, widgetId } from './log/logger';

const rootEl = document.getElementById('root')!;
rootEl.dataset.widgetId = widgetId;
logger.info('boot', 'widget instance mounted');

// Start the handshake before React mounts so the window `message` listener is
// attached as early as possible (the outer may post init immediately after it
// sees our bootstrap).
bridge.start();

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
