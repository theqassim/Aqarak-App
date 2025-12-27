function formatPrice(price, type) {
  if (!price) return "N/A";

  const numericPart = price.toString().replace(/[^\d.]/g, "");
  const formatted = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(numericPart);

  const currency = "ج.م.";
  const period = type && type === "إيجار" ? "/ شهر" : "";

  return `${formatted} ${currency}${period}`;
}

function getTypeTag(type) {
  if (type === "بيع") {
    return `<span class="property-tag tag-sale">بيع</span>`;
  }
  if (type === "إيجار") {
    return `<span class="property-tag tag-rent">إيجار</span>`;
  }
  return "";
}

const PUBLIC_VAPID_KEY =
  "BABE4bntVm_6RWE3zuv305i65FfcTN8xd6C3d4jdEwML8d7yLwoVywbgvhS7U-q2KE3cmKqDbgvZ8rK97C3gKp4";

function urlBase64ToUint8Array(base64String) {
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

async function triggerPushSubscription() {
  if ("serviceWorker" in navigator) {
    try {
      const register = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
        }
      );
      console.log("✅ Service Worker Registered");

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        console.log("✅ Notification permission granted.");

        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
        });

        await fetch("/api/subscribe", {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("✅ User Subscribed to Server");
      } else {
        console.log("❌ Notification permission denied.");
      }
    } catch (err) {
      console.error("❌ Service Worker/Push Error:", err);
    }
  } else {
    console.log("⚠️ Service Workers not supported in this browser.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  triggerPushSubscription();
});
