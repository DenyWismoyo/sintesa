// Lokasi file: src/context/LoginModalContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface OpenLoginModalOptions {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  redirectTo?: string;
}

interface LoginModalContextType {
  isOpen: boolean;
  options: OpenLoginModalOptions;
  openLoginModal: (options?: OpenLoginModalOptions) => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenLoginModalOptions>({});

  const openLoginModal = useCallback((opts?: OpenLoginModalOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsOpen(false);
    setOptions({});
  }, []);

  return (
    <LoginModalContext.Provider
      value={{
        isOpen,
        options,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error('useLoginModal must be used within a LoginModalProvider');
  }
  return context;
}
