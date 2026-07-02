import { renderToString } from 'react-dom/server';
import React from 'react';
import App from './src/App.jsx';

try {
  const html = renderToString(<App />);
  console.log("RENDER SUCCESS!");
} catch (e) {
  console.error("RENDER FAILED:", e);
}
