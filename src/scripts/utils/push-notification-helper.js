const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

class PushNotificationHelper {
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

  static async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  static async subscribe(token) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        const convertedVapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // Send subscription to server
      const response = await fetch(
        "https://story-api.dicoding.dev/v1/notifications/subscribe",
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
        console.log("Push notification subscribed");
        localStorage.setItem("pushSubscribed", "true");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  static async unsubscribe(token) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from server
        await fetch(
          "https://story-api.dicoding.dev/v1/notifications/subscribe",
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

        // Unsubscribe from browser
        await subscription.unsubscribe();
        console.log("Push notification unsubscribed");
        localStorage.setItem("pushSubscribed", "false");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  static isSubscribed() {
    return localStorage.getItem("pushSubscribed") === "true";
  }
}

export default PushNotificationHelper;
