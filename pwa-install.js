(() => {
  'use strict';

  const installButton = document.getElementById('installApp');
  const installHelp = document.getElementById('installHelp');
  let deferredPrompt = null;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

  function showButton(label) {
    if (!installButton || isStandalone()) return;
    installButton.querySelector('span:last-child').textContent = label;
    installButton.classList.add('show');
  }

  if ('serviceWorker' in navigator) {
    let swRegistration = null;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then((reg) => {
        swRegistration = reg;
        reg.update();
      }).catch((error) => {
        console.warn('Service worker \u043d\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d:', error);
      });
    });

    // Возвращаясь на вкладку (например, из WhatsApp) — снова проверяем,
    // нет ли новой версии, а не только при самом первом открытии.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && swRegistration) {
        swRegistration.update();
      }
    });

    // Если появилась новая версия — страница сама обновится один раз,
    // без ручных действий пользователя (очистка кэша, инкогнито и т.п.)
    let alreadyReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (alreadyReloaded) return;
      alreadyReloaded = true;
      window.location.reload();
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showButton('\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u043d\u0430 \u0442\u0435\u043b\u0435\u0444\u043e\u043d');
  });

  if (isIOS && isSafari && !isStandalone()) {
    showButton('\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043d\u0430 \u044d\u043a\u0440\u0430\u043d \u00abDomoy\u00bb');
    if (installHelp) {
      installHelp.textContent = '\u041d\u0430 iPhone \u043d\u0430\u0436\u043c\u0438\u0442\u0435 \u043a\u043d\u043e\u043f\u043a\u0443 \u00ab\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f\u00bb, \u0437\u0430\u0442\u0435\u043c \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u00ab\u041d\u0430 \u044d\u043a\u0440\u0430\u043d Domoy\u00bb.';
    }
  }

  installButton?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.classList.remove('show');
      return;
    }

    if (isIOS) {
      installHelp?.classList.toggle('show');
      return;
    }

    if (installHelp) {
      installHelp.textContent = '\u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u043c\u0435\u043d\u044e \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0438 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u00ab\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435\u00bb \u0438\u043b\u0438 \u00ab\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u044b\u0439 \u044d\u043a\u0440\u0430\u043d\u00bb.';
      installHelp.classList.add('show');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installButton?.classList.remove('show');
    installHelp?.classList.remove('show');
  });
})();
