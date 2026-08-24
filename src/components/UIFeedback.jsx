import { useCallback, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { UIFeedbackContext } from '../hooks/useUIFeedback';

let toastIdCounter = 0;

export function UIFeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  const confirmDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({
        message,
        title: options.title || 'Conferma azione',
        confirmLabel: options.confirmLabel || 'Conferma',
        cancelLabel: options.cancelLabel || 'Annulla',
        danger: !!options.danger,
      });
    });
  }, []);

  const handleConfirmResolve = (result) => {
    setConfirmState(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  const iconFor = (type) => {
    if (type === 'success') return <CheckCircle2 size={18} />;
    if (type === 'error') return <AlertTriangle size={18} />;
    return <Info size={18} />;
  };

  return (
    <UIFeedbackContext.Provider value={{ showToast, confirmDialog }}>
      {children}

      {/* Toast Stack */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{iconFor(t.type)}</span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Chiudi">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="modal-overlay" style={{ zIndex: 500 }} onClick={() => handleConfirmResolve(false)}>
          <div className="modal-content" style={{ maxWidth: '360px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px' }}>{confirmState.title}</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {confirmState.message}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => handleConfirmResolve(false)} style={{ flex: 1 }}>
                {confirmState.cancelLabel}
              </button>
              <button
                className={`btn ${confirmState.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleConfirmResolve(true)}
                style={{ flex: 1 }}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIFeedbackContext.Provider>
  );
}
