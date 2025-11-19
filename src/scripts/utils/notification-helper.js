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
      console.log("✅ Service Worker ready:", registration);

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("📝 Creating new push subscription...");

        const convertedVapidKey = this.urlBase64ToUint8Array(
          CONFIG.PUSH_NOTIFICATION.PUBLIC_VAPID_KEY
        );

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        console.log("✅ New push subscription created:", subscription);
      } else {
        console.log("✅ Already have subscription:", subscription);
      }

      // ✅ CRITICAL FIX: Send subscription to backend
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error("❌ Error subscribing to push:", error);
      throw error;
    }
  }

  static async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // ✅ Unsubscribe from backend first
        await this.removeSubscriptionFromServer(subscription);

        // Then unsubscribe from browser
        await subscription.unsubscribe();
        console.log("✅ Unsubscribed from push notifications");

        this.showLocalNotification(
          "Notifikasi Dinonaktifkan",
          "Anda tidak akan menerima notifikasi lagi"
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Error unsubscribing:", error);
      return false;
    }
  }

  // ✅ CRITICAL FIX: Implement backend subscription
  static async sendSubscriptionToServer(subscription) {
    try {
      console.log("📤 Sending subscription to backend...");

      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No auth token, skip backend subscription");
        return;
      }

      const response = await fetch(
        `${CONFIG.BASE_URL}/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode.apply(
                  null,
                  new Uint8Array(subscription.getKey("p256dh"))
                )
              ),
              auth: btoa(
                String.fromCharCode.apply(
                  null,
                  new Uint8Array(subscription.getKey("auth"))
                )
              ),
            },
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Subscription sent to backend successfully");
        localStorage.setItem("pushSubscribed", "true");
      } else {
        const error = await response.json();
        console.error("❌ Backend subscription failed:", error);
      }
    } catch (error) {
      console.error("❌ Error sending subscription to backend:", error);
      // Don't throw - subscription still works locally
    }
  }

  // ✅ NEW: Remove subscription from backend
  static async removeSubscriptionFromServer(subscription) {
    try {
      console.log("📤 Removing subscription from backend...");

      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No auth token, skip backend removal");
        return;
      }

      const response = await fetch(
        `${CONFIG.BASE_URL}/notifications/subscribe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Subscription removed from backend successfully");
        localStorage.setItem("pushSubscribed", "false");
      } else {
        console.error("❌ Backend removal failed");
      }
    } catch (error) {
      console.error("❌ Error removing subscription from backend:", error);
    }
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
