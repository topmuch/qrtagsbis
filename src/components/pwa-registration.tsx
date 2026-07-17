'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available, show refresh prompt
                    console.log('New content available, please refresh.');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });

      // Handle offline/online status
      const handleOnline = () => {
        console.log('Back online');
      };
      const handleOffline = () => {
        console.log('Gone offline');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return null;
}

// Hook to check PWA install status
export function usePWAInstall() {
  useEffect(() => {
    // Check if app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = ('standalone' in window.navigator) && (window.navigator as Navigator & { standalone: boolean }).standalone;

    if (isStandalone || isInWebAppiOS) {
      console.log('App is running as PWA');
      document.body.classList.add('pwa-mode');
    }
  }, []);
}

// Component to prompt PWA installation
export function PWAInstallPrompt() {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      // Show install button or prompt
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  return null;
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
