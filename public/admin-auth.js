document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 بدء التحقق من الصلاحيات...");

  try {
    const response = await fetch("/api/auth/me");
    console.log("📡 حالة استجابة السيرفر:", response.status);

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 البيانات المستلمة من السيرفر:", data);

    if (!data.isAuthenticated || data.role !== "admin") {
      console.warn("⛔ محاولة دخول غير مصرح بها.");
      window.location.href = "/";
    } else {
      console.log("✅ أهلاً بك يا أدمن!");
      document.body.style.display = "block";
    }
  } catch (error) {
    console.error("❌ فشل التحقق من الصلاحيات (NetworkError):", error);
    alert(
      "حدث خطأ في الاتصال بالسيرفر. تأكد أن السيرفر يعمل.\n(راجع الكونسول)"
    );
  }
});
