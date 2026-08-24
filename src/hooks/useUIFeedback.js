import { createContext, useContext } from 'react';

export const UIFeedbackContext = createContext(null);

export function useUIFeedback() {
  const ctx = useContext(UIFeedbackContext);
  if (!ctx) {
    throw new Error('useUIFeedback deve essere usato dentro <UIFeedbackProvider>');
  }
  return ctx;
}
