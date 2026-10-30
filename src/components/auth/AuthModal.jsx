import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import StepSignup from './StepSignup';
import Logo from '../Logo';
import './AuthModal.css';

export default function AuthModal() {
  const { isModalOpen, modalMode, setModalMode, closeModal } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  return (
    <div className="auth-modal-backdrop" onClick={closeModal}>
      <div
        className="auth-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Bar */}
        <div className="auth-modal-topbar">
          <div className="auth-logo-wrap">
            <Logo />
          </div>
          <button
            type="button"
            className="auth-close-btn"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="auth-modal-body">
          {modalMode === 'login' ? (
            <LoginForm
              onSwitchToSignup={() => setModalMode('signup')}
              onClose={closeModal}
            />
          ) : (
            <StepSignup
              onSwitchToLogin={() => setModalMode('login')}
              onClose={closeModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
