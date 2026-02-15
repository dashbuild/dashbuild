export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

// FIXME: Modal doesn't trap focus — keyboard users can tab outside
// TODO: Add animation for open/close transitions
export function Modal(props: ModalProps) {
  const { title, isOpen, onClose } = props;

  if (!isOpen) return null;

  // HACK: Using inline styles until we set up proper CSS modules
  return {
    type: "div" as const,
    className: "modal-overlay",
    title,
    onClose,
    isOpen: true,
  };
}

export function isModalOpen(modal: ReturnType<typeof Modal>): boolean {
  return modal !== null && modal.isOpen === true;
}
