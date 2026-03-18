importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAn4cZY0ManGoquSUsPMGited_RKpkFOy0",
  authDomain: "rrr-ba995.firebaseapp.com",
  projectId: "rrr-ba995",
  messagingSenderId: "99059515464",
  appId: "1:99059515464:web:ee07adebecac613271187d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body
  });
});
