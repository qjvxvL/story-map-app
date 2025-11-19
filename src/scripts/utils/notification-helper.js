import CONFIG from "../config/config.js";

class NotificationHelper {
  static async init() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return false;
    }

    const permission = Notification.permission;
    console.log("Notification permission:", permission);

    if (permission === "granted") {
      await this.subscribeToPushNotifications();
      return true;
    }

    return false;
  }

  static async requestPermission() {
    if (!("Notification" in window)) {
      alert("Browser ini tidak mendukung notifikasi");
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log("Permission result:", permission);

    if (permission === "granted") {
      await this.subscribeToPushNotifications();
      this.showLocalNotification(
        "Notifikasi Diaktifkan!",
        "Anda akan menerima notifikasi untuk story baru"
      );
      return true;
    }

    return false;
  }

  static async subscribeToPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log("Service Worker ready:", registration);

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            CONFIG.PUSH_NOTIFICATION.PUBLIC_VAPID_KEY
          ),
        });

        console.log("New push subscription:", subscription);
        await this.sendSubscriptionToServer(subscription);
      } else {
        console.log("Already subscribed:", subscription);
      }

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      throw error;
    }
  }

  static async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("Unsubscribed from push notifications");
        this.showLocalNotification(
          "Notifikasi Dinonaktifkan",
          "Anda tidak akan menerima notifikasi lagi"
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return false;
    }
  }

  static async sendSubscriptionToServer(subscription) {
    console.log("Subscription to send to server:", subscription);
    // Optional: send to your backend if you have one
  }

  static showLocalNotification(title, body, options = {}) {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-96x96.png",
        vibrate: [200, 100, 200],
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  static async isSubscribed() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export default NotificationHelper;
