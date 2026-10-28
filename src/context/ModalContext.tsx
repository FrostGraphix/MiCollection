'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  FeedbackModal,
  FeedbackModalVariant,
  ModalAction,
  FeedbackModalProps,
} from '@/components/ui/FeedbackModal';

export interface ModalOptions {
  variant?: FeedbackModalVariant;
  title: string;
  message?: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  extraActions?: ModalAction[];
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  onClose?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'confirm' | 'warning' | 'error';
  danger?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ModalContextType {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  showSuccess: (
    title: string,
    message?: React.ReactNode,
    options?: Partial<ModalOptions>
  ) => void;
  showError: (
    title: string,
    message?: React.ReactNode,
    options?: Partial<ModalOptions>
  ) => void;
  showWarning: (
    title: string,
    message?: React.ReactNode,
    options?: Partial<ModalOptions>
  ) => void;
  showInfo: (
    title: string,
    message?: React.ReactNode,
    options?: Partial<ModalOptions>
  ) => void;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalConfig, setModalConfig] = useState<ModalOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(false);
      confirmResolveRef.current = null;
    }
    if (modalConfig?.onClose) {
      modalConfig.onClose();
    }
  }, [modalConfig]);

  const openModal = useCallback((options: ModalOptions) => {
    setModalConfig(options);
    setIsOpen(true);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        confirmResolveRef.current = resolve;
        const isDanger = options.danger ?? (options.variant === 'error');
        setModalConfig({
          variant: options.variant || (isDanger ? 'warning' : 'confirm'),
          title: options.title || 'Are you sure?',
          message: options.message,
          size: options.size || 'md',
          closeOnBackdrop: true,
          closeOnEscape: true,
          showCloseButton: true,
          primaryAction: {
            label: options.confirmText || 'Confirm',
            variant: isDanger ? 'danger' : 'primary',
            onClick: () => {
              setIsOpen(false);
              resolve(true);
              confirmResolveRef.current = null;
            },
          },
          secondaryAction: {
            label: options.cancelText || 'Cancel',
            variant: 'outline',
            onClick: () => {
              setIsOpen(false);
              resolve(false);
              confirmResolveRef.current = null;
            },
          },
          onClose: () => {
            resolve(false);
            confirmResolveRef.current = null;
          },
        });
        setIsOpen(true);
      });
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, message?: React.ReactNode, options?: Partial<ModalOptions>) => {
      openModal({
        variant: 'success',
        title,
        message,
        primaryAction: {
          label: 'Continue',
          variant: 'primary',
          onClick: closeModal,
        },
        ...options,
      });
    },
    [openModal, closeModal]
  );

  const showError = useCallback(
    (title: string, message?: React.ReactNode, options?: Partial<ModalOptions>) => {
      openModal({
        variant: 'error',
        title,
        message,
        primaryAction: {
          label: 'Okay',
          variant: 'danger',
          onClick: closeModal,
        },
        ...options,
      });
    },
    [openModal, closeModal]
  );

  const showWarning = useCallback(
    (title: string, message?: React.ReactNode, options?: Partial<ModalOptions>) => {
      openModal({
        variant: 'warning',
        title,
        message,
        primaryAction: {
          label: 'Understood',
          variant: 'primary',
          onClick: closeModal,
        },
        ...options,
      });
    },
    [openModal, closeModal]
  );

  const showInfo = useCallback(
    (title: string, message?: React.ReactNode, options?: Partial<ModalOptions>) => {
      openModal({
        variant: 'info',
        title,
        message,
        primaryAction: {
          label: 'Got it',
          variant: 'primary',
          onClick: closeModal,
        },
        ...options,
      });
    },
    [openModal, closeModal]
  );

  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
        confirm,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        isOpen,
      }}
    >
      {children}
      {modalConfig && (
        <FeedbackModal
          isOpen={isOpen}
          onClose={closeModal}
          variant={modalConfig.variant}
          title={modalConfig.title}
          message={modalConfig.message}
          primaryAction={modalConfig.primaryAction}
          secondaryAction={modalConfig.secondaryAction}
          extraActions={modalConfig.extraActions}
          closeOnBackdrop={modalConfig.closeOnBackdrop}
          closeOnEscape={modalConfig.closeOnEscape}
          showCloseButton={modalConfig.showCloseButton}
          size={modalConfig.size}
        >
          {modalConfig.children}
        </FeedbackModal>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
