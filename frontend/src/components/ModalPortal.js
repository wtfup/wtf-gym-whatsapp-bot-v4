import { createPortal } from 'react-dom';

/**
 * Renders children outside the current DOM tree via React portal
 * This prevents modals from being clipped by parent containers (like table rows)
 */
export default function ModalPortal({ children }) {
  return createPortal(children, document.body);
}