importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These values are standard for this project's Firebase setup
firebase.initializeApp({
  apiKey: "AIzaSyBqT8QRQJuljNV1W5-XGK-plhSwLzwUJW4",
  authDomain: "appzeto-quick-commerce.firebaseapp.com",
  projectId: "appzeto-quick-commerce",
  storageBucket: "appzeto-quick-commerce.firebasestorage.app",
  messagingSenderId: "477007016819",
  appId: "1:477007016819:web:cc5fafe34a8b25b24a8b06"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/vite.svg',
    data: {
      link: payload.data?.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.openWindow(link)
  );
});
