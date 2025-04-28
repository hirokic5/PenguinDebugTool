import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('GLOBAL ERROR:', event.error);
  // Log to terminal in a format that's easy to spot
  console.error('\n==================================');
  console.error('UNCAUGHT ERROR:');
  console.error(event.error?.message || event.message);
  console.error(event.error?.stack || 'No stack trace available');
  console.error('==================================\n');
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('UNHANDLED PROMISE REJECTION:', event.reason);
  console.error('\n==================================');
  console.error('UNHANDLED PROMISE REJECTION:');
  console.error(event.reason?.message || event.reason || 'Unknown reason');
  console.error(event.reason?.stack || 'No stack trace available');
  console.error('==================================\n');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
