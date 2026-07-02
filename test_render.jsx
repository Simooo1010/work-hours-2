import { renderToString } from 'react-dom/server';
import React from 'react';

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

import Settings from './src/components/Settings.jsx';

try {
  const html = renderToString(
    <Settings 
      hourlyRate={null} 
      onUpdateRate={() => {}} 
      user={{ email: 'test@example.com' }} 
      onLogout={() => {}} 
    />
  );
  console.log("SETTINGS RENDER SUCCESS!");
} catch (e) {
  console.error("SETTINGS RENDER FAILED:", e);
}
