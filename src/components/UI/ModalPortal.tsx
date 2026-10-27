import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * ModalPortal hoists modal dialogues and overlays directly to `document.body`.
 * This completely isolates the modal from parent stacking contexts, CSS animations (e.g. animate-fade-in),
 * CSS filters/transforms, and relative z-index containers, preventing background text or cards
 * from ever bleeding or overflowing over the modal card.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
