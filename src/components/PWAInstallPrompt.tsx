import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  language: 'es' | 'en';
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ language }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const texts = {
    es: {
      install: "Instalar App",
      installTitle: "¡Instala la aplicación!",
      installMessage: "Instala el Observatorio de I+D en tu dispositivo para acceso rápido y funcionamiento sin conexión.",
      installButton: "Instalar",
      cancelButton: "Ahora no",
      iosInstall: "Para instalar esta app en tu iPhone/iPad, toca el botón de compartir",
      iosStep1: "1. Toca el icono de compartir",
      iosStep2: "2. Selecciona 'Añadir a pantalla de inicio'",
      iosStep3: "3. Toca 'Añadir' para confirmar",
      updateTitle: "¡Actualización Disponible!",
      updateMessage: "Hay una nueva versión disponible. ¿Deseas actualizar ahora?",
      updateButton: "Actualizar",
      reloadButton: "Recargar"
    },
    en: {
      install: "Install App",
      installTitle: "Install the app!",
      installMessage: "Install the R&D Observatory on your device for quick access and offline functionality.",
      installButton: "Install",
      cancelButton: "Not now",
      iosInstall: "To install this app on your iPhone/iPad, tap the share button",
      iosStep1: "1. Tap the share icon",
      iosStep2: "2. Select 'Add to Home Screen'",
      iosStep3: "3. Tap 'Add' to confirm",
      updateTitle: "Update Available!",
      updateMessage: "A new version is available. Do you want to update now?",
      updateButton: "Update",
      reloadButton: "Reload"
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Detectar si ya está instalado como PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as { standalone?: boolean }).standalone ||
                              document.referrer.includes('android-app://');
    setIsStandalone(isInStandaloneMode);

    // Detectar actualizaciones del service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });
      });

      // Detectar si hay un service worker en espera
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }
      });
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt después de un tiempo si no está instalado
      setTimeout(() => {
        if (!isInStandaloneMode) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Mostrar después de 10 segundos
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Ocultar prompt si la app se instala
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Guardar en localStorage para no mostrar de nuevo durante un tiempo
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // No mostrar si ya está instalado o si fue dismisseado recientemente
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime);
      const dayInMs = 24 * 60 * 60 * 1000;
      if (timeDiff < dayInMs * 7) { // No mostrar por 7 días
        setShowInstallPrompt(false);
      }
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  const handleForceReload = () => {
    // Limpiar cache y recargar
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }
    window.location.reload();
  };

  // No renderizar si está instalado como PWA
  if (isStandalone) {
    return null;
  }

  // Prompt para iOS
  if (isIOS && showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">{t('installTitle')}</h3>
            <div className="mt-2 text-xs text-gray-600">
              <p className="mb-2">{t('iosInstall')}</p>
              <ol className="space-y-1">
                <li>{t('iosStep1')}</li>
                <li>{t('iosStep2')}</li>
                <li>{t('iosStep3')}</li>
              </ol>
            </div>
            <div className="mt-3">
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('cancelButton')}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Prompt para Android/Chrome
  if (deferredPrompt && showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">{t('installTitle')}</h3>
            <p className="mt-1 text-xs text-gray-600">{t('installMessage')}</p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {t('installButton')}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('cancelButton')}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 border-l-4 border-blue-400">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">{t('updateTitle')}</h3>
            <p className="mt-1 text-sm opacity-90">{t('updateMessage')}</p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleUpdate}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                {t('updateButton')}
              </button>
              <button
                onClick={handleForceReload}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-400 transition-colors"
              >
                {t('reloadButton')}
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="text-blue-200 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt; 