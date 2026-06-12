import React from 'react';
import { createRoot } from 'react-dom/client';

function ShellApp() {
  return <h1>Shell host placeholder</h1>;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShellApp />
  </React.StrictMode>,
);
