let currentOffset = 0;
const LIMIT = 6;
let isLoading = false;
let currentSearchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  fetchLatestProperties(true);
  updateNavigation();
  updateMobileHeader();
  checkNotifications();
  setupSearchLogic();

  let deferredPrompt;
  const installToast = document.getElementById("install-toast");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem("installPromptDismissed"))
      installToast.style.display = "flex";
  });
  document
    .getElementById("install-btn-action")
    ?.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        installToast.style.display = "none";
      }
    });
  document.getElementById("close-install")?.addEventListener("click", () => {
    installToast.style.display = "none";
    localStorage.setItem("installPromptDismissed", "true");
  });
});

function setupSearchLogic() {
  const searchInputs = document.querySelectorAll(".search-bar");
  const searchButtons = document.querySelectorAll(".search-button");

  window.performSearch = function (inputElement) {
    const query = inputElement.value.trim();

    currentSearchQuery = query;

    currentOffset = 0;

    const titleEl = document.querySelector(".section-title");
    if (titleEl) {
      titleEl.innerHTML = "";
      if (query) {
        titleEl.appendChild(document.createTextNode('نتائج البحث عن: "'));
        const span = document.createElement("span");
        span.style.color = "white";
        span.textContent = query;
        titleEl.appendChild(span);
        titleEl.appendChild(document.createTextNode('"'));
      } else {
        titleEl.textContent = "أحدث العقارات";
      }
    }

    fetchLatestProperties(true);
  };

  searchButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      const input = searchInputs[index];
      if (input) performSearch(input);
    });
  });

  searchInputs.forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch(input);
    });
  });
}

async function fetchLatestProperties(isFirstLoad = false) {
  if (isLoading) return;
  isLoading = true;

  const container = document.getElementById("listings-container");
  const loadMoreBtn = document.getElementById("load-more-btn");

  if (isFirstLoad && container) {
    currentOffset = 0;

    const loadingMsg = currentSearchQuery
      ? '<i class="fas fa-robot fa-spin fa-2x"></i><p style="margin-top:10px; color:#00ff88;">الذكاء الاصطناعي يبحث لك عن أفضل النتائج...</p>'
      : '<i class="fas fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:10px; color:#aaa;">جاري التحميل...</p>';

    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;">${loadingMsg}</div>`;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
  } else {
    if (loadMoreBtn)
      loadMoreBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
  }

  try {
    let url;

    if (currentSearchQuery && currentSearchQuery.trim() !== "") {
      url = `/api/ai-search?limit=${LIMIT}&offset=${currentOffset}&query=${encodeURIComponent(
        currentSearchQuery
      )}`;
    } else {
      url = `/api/properties?limit=${LIMIT}&offset=${currentOffset}`;
    }

    const response = await fetch(url);
    const properties = await response.json();

    if (isFirstLoad && container) container.innerHTML = "";

    if (isFirstLoad && properties.length === 0 && container) {
      container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #333; margin-bottom: 15px;"></i>
                    <p style="color: #ccc; font-size: 1.1rem;">
                        ${
                          currentSearchQuery
                            ? "لم نجد عقارات مطابقة تماماً، حاول تغيير كلمات البحث."
                            : "لا توجد عقارات حالياً."
                        }
                    </p>
                    ${
                      currentSearchQuery
                        ? '<button onclick="clearSearch()" style="background:none; border:1px solid var(--neon-primary); color:var(--neon-primary); padding:8px 20px; border-radius:20px; margin-top:10px; cursor:pointer;">عرض الكل</button>'
                        : ""
                    }
                </div>
            `;
      isLoading = false;
      return;
    }

    properties.forEach((prop) => {
      const bgImage = prop.imageUrl || "logo.png";
      let priceText = parseInt(prop.price || 0).toLocaleString();
      const typeLower = prop.type ? String(prop.type).trim().toLowerCase() : "";
      const isSale =
        typeLower === "buy" || typeLower === "بيع" || typeLower === "sale";

      const typeClass = isSale ? "is-sale" : "is-rent";
      const typeText = isSale ? "للبيع" : "للإيجار";

      let featuresHtml = "";

      if (prop.type === "land" || prop.type === "أرض") {
        featuresHtml += `<span><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>`;
        if (prop.finishing_type)
          featuresHtml += `<span style="margin-right:10px;"><i class="fas fa-layer-group"></i> ${prop.finishing_type}</span>`;
      } else if (prop.type === "building" || prop.type === "عمارة") {
        featuresHtml += `<span><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>`;
        if (prop.floors_count)
          featuresHtml += `<span style="margin-right:10px;"><i class="fas fa-building"></i> ${prop.floors_count} دور</span>`;
      } else {
        if (prop.rooms)
          featuresHtml += `<span style="margin-left:8px;"><i class="fas fa-bed"></i> ${prop.rooms}</span>`;
        if (prop.bathrooms)
          featuresHtml += `<span style="margin-left:8px;"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>`;
        if (prop.area)
          featuresHtml += `<span><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>`;
      }

      const featuredClass = prop.isFeatured ? "featured-card-glow" : "";
      let extraBadges = prop.isFeatured
        ? `<div class="featured-crown"><i class="fas fa-crown"></i> مميز</div>`
        : "";
      const verifiedBadge = prop.is_verified
        ? `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-left:5px; vertical-align:middle;"></i>`
        : "";

      const html = `
                <div class="adv-card ${featuredClass}" onclick="window.location.href='property?id=${prop.id}'" style="cursor: pointer;">
                    <div class="adv-card-img-box">
                        <img src="${bgImage}" alt="${prop.title}" class="adv-card-img" loading="lazy">
                        <span class="adv-type-badge ${typeClass}">${typeText}</span>
                        <div class="adv-price-tag">${priceText} ج.م</div>
                        ${extraBadges} 
                    </div>
                    <div class="adv-card-body">
                        <h3 class="adv-title" title="${prop.title}">${verifiedBadge} ${prop.title}</h3>
                        
                        <div class="adv-features">${featuresHtml}</div>
                        
                        <a href="property?id=${prop.id}" class="adv-details-btn">عرض التفاصيل <i class="fas fa-arrow-left"></i></a>
                    </div>
                </div>
            `;
      if (container) container.innerHTML += html;
    });

    currentOffset += properties.length;

    const btnContainer = document.getElementById("load-more-container");
    if (!btnContainer && container) {
      const newBtnDiv = document.createElement("div");
      newBtnDiv.id = "load-more-container";
      newBtnDiv.style.gridColumn = "1 / -1";
      newBtnDiv.style.textAlign = "center";
      newBtnDiv.style.marginTop = "20px";
      newBtnDiv.innerHTML = `<button id="load-more-btn" class="load-more-btn">عرض المزيد <i class="fas fa-arrow-down"></i></button>`;
      container.parentNode.appendChild(newBtnDiv);
      document
        .getElementById("load-more-btn")
        .addEventListener("click", () => fetchLatestProperties(false));
    }

    const btn = document.getElementById("load-more-btn");
    if (btn) {
      if (properties.length < LIMIT) btn.style.display = "none";
      else {
        btn.style.display = "block";
        btn.innerHTML = 'عرض المزيد <i class="fas fa-arrow-down"></i>';
      }
    }
  } catch (error) {
    console.error("Error:", error);
    if (isFirstLoad && container)
      container.innerHTML =
        '<p style="color:red; text-align:center;">حدث خطأ في الاتصال.</p>';
  } finally {
    isLoading = false;
  }
}
window.clearSearch = function () {
  document.querySelectorAll(".search-bar").forEach((el) => (el.value = ""));
  currentSearchQuery = "";
  currentOffset = 0;
  document.querySelector(".section-title").textContent = "أحدث العقارات";
  fetchLatestProperties(true);
};

async function updateMobileHeader() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    const mobCenterAction = document.getElementById("mob-center-action");
    const mobMenuToggle = document.getElementById("mob-menu-toggle");
    const mobGuestBtns = document.getElementById("mob-guest-btns");
    const mobName = document.getElementById("mob-user-name");
    const mobBalance = document.getElementById("mob-user-balance");

    if (data.isAuthenticated) {
      if (mobCenterAction) mobCenterAction.style.display = "block";
      if (mobMenuToggle) mobMenuToggle.style.display = "flex";
      if (mobGuestBtns) mobGuestBtns.style.display = "none";

      const verifiedBadge = data.is_verified
        ? `<i class="fas fa-check" style="background:#FFD700; color:white; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; border:1px solid white; margin-right:5px; vertical-align:middle;"></i>`
        : "";

      if (mobName)
        mobName.innerHTML = `${data.name || "مستخدم"} ${verifiedBadge}`;

      if (mobBalance) {
        if (data.isPaymentActive) {
          mobBalance.textContent = `${data.balance || 0} نقطة`;
          mobBalance.style.display = "block";
        } else {
          mobBalance.style.display = "none";
        }
      }
    } else {
      if (mobCenterAction) mobCenterAction.style.display = "none";
      if (mobMenuToggle) mobMenuToggle.style.display = "none";
      if (mobGuestBtns) mobGuestBtns.style.display = "flex";
    }
  } catch (e) {
    console.error("Header Error", e);
  }
}

window.toggleNotifications = async function (e) {
  e.stopPropagation();
  const container = document.getElementById("notifications-container");
  const innerBadge = document.getElementById("notif-count-text");
  const outerBadge = document.getElementById("menu-notif-badge");

  if (container.style.display === "block") {
    container.style.display = "none";
  } else {
    container.style.display = "block";
    if (innerBadge && innerBadge.style.display !== "none") {
      innerBadge.style.display = "none";
      if (outerBadge) outerBadge.style.display = "none";
      try {
        await fetch("/api/user/notifications/read", { method: "POST" });
      } catch (e) {}
    }
  }
};

async function checkNotifications() {
  try {
    const res = await fetch("/api/user/notifications");
    const data = await res.json();

    const mobBadge = document.getElementById("menu-notif-badge");
    const mobInnerBadge = document.getElementById("notif-count-text");
    const mobList = document.getElementById("menu-notif-list");

    const desktopBadge = document.getElementById("desktop-notif-badge");
    const desktopList = document.getElementById("desktop-notif-list");

    if (data.unreadCount > 0) {
      const countText = data.unreadCount > 9 ? "+9" : data.unreadCount;
      if (mobBadge) {
        mobBadge.style.display = "block";
        mobBadge.textContent = countText;
      }
      if (mobInnerBadge) {
        mobInnerBadge.style.display = "inline-block";
        mobInnerBadge.textContent = `${data.unreadCount} جديدة`;
      }
      if (desktopBadge) {
        desktopBadge.style.display = "block";
        desktopBadge.textContent = countText;
      }
    } else {
      if (mobBadge) mobBadge.style.display = "none";
      if (mobInnerBadge) mobInnerBadge.style.display = "none";
      if (desktopBadge) desktopBadge.style.display = "none";
    }

    let listHTML = "";
    if (data.notifications && data.notifications.length > 0) {
      listHTML = data.notifications
        .map(
          (n) => `
        <div class="menu-notif-item swipe-item ${
          n.is_read ? "" : "unread"
        }" id="notif-${n.id}" data-id="${n.id}" onclick="handleNotifClick('${
            n.link || ""
          }')">
            <div class="swipe-action-bg"><i class="fas fa-trash-alt"></i> حذف</div>
            <div class="swipe-content">
                <div style="padding-left: 10px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="width:6px; height:6px; background:var(--neon-primary); border-radius:50%; display:${
                          n.is_read ? "none" : "block"
                        }"></span>
                        <strong style="color:white; font-size:0.95rem;">${
                          n.title
                        }</strong>
                    </div>
                    <p style="color:#bbb; font-size:0.85rem; margin:0; line-height:1.5;">${
                      n.message
                    }</p>
                    <div style="margin-top:8px; font-size:0.7rem; color:#666; display:flex; align-items:center; gap:5px;">
                        <i class="far fa-clock"></i>
                        ${new Date(n.created_at).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                </div>
            </div>
        </div>
      `
        )
        .join("");
    } else {
      listHTML =
        '<p style="text-align:center; color:#555; padding:15px;">لا توجد إشعارات حالياً</p>';
    }

    if (mobList) {
      mobList.innerHTML = listHTML;
      initSwipeGestures();
    }

    if (desktopList && data.notifications && data.notifications.length > 0) {
      desktopList.innerHTML = data.notifications
        .map(
          (n) => `
            <div id="desktop-notif-${n.id}" class="desktop-notif-item ${
            n.is_read ? "" : "unread"
          }" onclick="handleNotifClick('${n.link || ""}')">
                <button class="desktop-delete-btn" onclick="deleteNotification(event, '${
                  n.id
                }')" title="حذف">
                    <i class="fas fa-times"></i>
                </button>
                <div style="padding-right: 5px;">
                    <strong style="color:white; display:block; margin-bottom:5px;">${
                      n.title
                    }</strong>
                    <p style="color:#bbb; font-size:0.9rem; margin:0;">${
                      n.message
                    }</p>
                </div>
            </div>
        `
        )
        .join("");
    } else if (desktopList) {
      desktopList.innerHTML =
        '<p style="text-align:center; padding:10px;">لا توجد إشعارات</p>';
    }
  } catch (e) {
    console.error("Notif Error", e);
  }
}

window.handleNotifClick = function (link) {
  if (link && link !== "null" && link !== "undefined" && link !== "") {
    window.location.href = link;
  }
};

function initSwipeGestures() {
  const items = document.querySelectorAll(".swipe-item");
  items.forEach((item) => {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    item.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        isSwiping = false;
        item.querySelector(".swipe-content").style.transition = "none";
      },
      { passive: true }
    );

    item.addEventListener(
      "touchmove",
      (e) => {
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        if (Math.abs(diff) > 10) {
          isSwiping = true;
          const content = item.querySelector(".swipe-content");
          content.style.transform = `translateX(${diff}px)`;

          const bg = item.querySelector(".swipe-action-bg");
          if (bg) bg.style.opacity = Math.min(Math.abs(diff) / 80, 1);
        }
      },
      { passive: true }
    );

    item.addEventListener("touchend", (e) => {
      const content = item.querySelector(".swipe-content");
      content.style.transition = "transform 0.3s ease";
      const diff = currentX - startX;

      if (isSwiping && Math.abs(diff) > 100) {
        content.style.transform =
          diff > 0 ? "translateX(100%)" : "translateX(-100%)";
        setTimeout(() => {
          const id = item.getAttribute("data-id");
          deleteNotificationDirect(id, item);
        }, 200);
      } else {
        content.style.transform = "translateX(0)";
      }
      isSwiping = false;
    });
  });
}

async function deleteNotificationDirect(id, element) {
  try {
    await fetch(`/api/user/notification/${id}`, { method: "DELETE" });
    element.style.height = "0";
    element.style.opacity = "0";
    element.style.margin = "0";
    setTimeout(() => element.remove(), 300);
  } catch (e) {}
}

window.deleteNotification = async (e, id) => {
  if (e) e.stopPropagation();
  try {
    const res = await fetch(`/api/user/notification/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const elMob = document.getElementById(`notif-${id}`);
      if (elMob) {
        elMob.style.height = "0";
        elMob.style.opacity = "0";
        setTimeout(() => elMob.remove(), 300);
      }

      const elDesk = document.getElementById(`desktop-notif-${id}`);
      if (elDesk) {
        elDesk.style.opacity = "0";
        setTimeout(() => elDesk.remove(), 200);
      }
    }
  } catch (e) {
    console.error("خطأ في الحذف", e);
  }
};

window.toggleMobileMenu = async function () {
  const menu = document.getElementById("mobile-profile-dropdown");
  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
};

window.addEventListener("click", function (e) {
  const menu = document.getElementById("mobile-profile-dropdown");
  const isMenuBtn = e.target.closest(".menu-toggle-btn");
  const isMenu = e.target.closest(".mobile-dropdown");
  const isDeleteBtn = e.target.closest(".notif-delete-btn");

  if (
    menu &&
    menu.style.display === "block" &&
    !isMenuBtn &&
    !isMenu &&
    !isDeleteBtn
  ) {
    menu.style.display = "none";
  }
});

async function updateNavigation() {
  const nav = document.getElementById("dynamic-nav");
  if (!nav) return;
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (data.isAuthenticated) {
      nav.innerHTML = `
                <div class="desktop-notif-wrapper">
                    <button class="desktop-notif-btn" onclick="toggleDesktopNotif(event)">
                        <i class="fas fa-bell"></i>
                        <span id="desktop-notif-badge" class="desktop-badge">0</span>
                    </button>
                    <div id="desktop-notif-dropdown" class="desktop-notif-dropdown">
<div class="notif-header">
    <span style="color:white;">التنبيهات</span>
    <span onclick="markAllRead()" class="mark-read-all" style="cursor:pointer;">
        <i class="fas fa-check-double"></i> قراءة الكل
    </span>
</div>
                        <div id="desktop-notif-list">
                            <p style="text-align:center; color:#777; padding:15px;">جاري التحميل...</p>
                        </div>
                    </div>
                </div>

                <a href="properties" class="nav-button">جميع العقارات</a>
                <a href="properties?type=buy" class="nav-button">شراء</a>
                <a href="properties?type=rent" class="nav-button">ايجار</a>
                <a href="about-us" class="nav-button">من نحن</a> 
                <a href="dashboard" class="nav-button">حسابي</a> 
                <a href="sell" class="sell-btn">اعرض عقارك!</a>
            `;

      checkNotifications();
    } else {
      nav.innerHTML = `
                <a href="about-us" class="nav-button">من نحن</a> <a href="authentication" class="nav-button">تسجيل دخول</a>
                <a href="authentication?mode=register" class="sell-btn">انشاء حساب</a>
            `;
    }
  } catch (error) {
    nav.innerHTML = `
            <a href="about-us" class="nav-button">من نحن</a>
            <a href="authentication" class="nav-button">تسجيل دخول</a>
        `;
  }
}

function toggleAiChat() {
  const hud = document.getElementById("ai-interface");
  const input = document.getElementById("ai-user-input");
  const orb = document.querySelector(".ai-orb-container");
  const complaintBtn = document.querySelector(".complaint-float-btn");

  if (hud.style.display === "flex") {
    hud.style.display = "none";
    document.body.classList.remove("chat-open");

    if (orb) orb.style.display = "flex";
    if (complaintBtn) complaintBtn.style.display = "block";
  } else {
    hud.style.display = "flex";
    document.body.classList.add("chat-open");

    setTimeout(() => input.focus(), 100);

    if (window.innerWidth <= 768) {
      if (orb) orb.style.display = "none";
      if (complaintBtn) complaintBtn.style.display = "none";
    }
  }
}

function handleAiEnter(e) {
  if (e.key === "Enter") sendAiMessage();
}

async function sendAiMessage() {
  const input = document.getElementById("ai-user-input");
  const consoleDiv = document.getElementById("ai-console");
  const typingIndicator = document.getElementById("ai-typing");

  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  input.value = "";

  if (typingIndicator) typingIndicator.style.display = "flex";
  consoleDiv.scrollTop = consoleDiv.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    });

    const data = await response.json();
    if (typingIndicator) typingIndicator.style.display = "none";
    typeWriterResponse(data.reply);
  } catch (error) {
    if (typingIndicator) typingIndicator.style.display = "none";
    appendMessage("⚠️ فقدنا الاتصال بالقاعدة الأم (خطأ في السيرفر).", "bot");
  }
}

function appendMessage(text, sender) {
  const consoleDiv = document.getElementById("ai-console");
  const div = document.createElement("div");
  div.className = `ai-msg ai-msg-${sender}`;

  if (sender === "bot") {
    div.innerHTML = `
            <div class="ai-avatar"><img src="logo.png" alt="AI"></div>
            <div class="ai-text">${text}</div>
        `;
    div.querySelector(".ai-text").innerHTML = text;
  } else {
    const textDiv = document.createElement("div");
    textDiv.className = "ai-text";
    textDiv.textContent = text;
    div.appendChild(textDiv);
  }
  consoleDiv.appendChild(div);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function typeWriterResponse(text) {
  const consoleDiv = document.getElementById("ai-console");
  const div = document.createElement("div");
  div.className = "ai-msg ai-msg-bot";

  div.innerHTML = `
        <div class="ai-avatar"><img src="logo.png" alt="AI"></div>
        <div class="ai-text"></div>
    `;
  consoleDiv.appendChild(div);

  const textElement = div.querySelector(".ai-text");
  let i = 0;
  const speed = 10;

  function type() {
    if (i < text.length) {
      if (text.charAt(i) === "<") {
        const endTag = text.indexOf(">", i);
        textElement.innerHTML += text.substring(i, endTag + 1);
        i = endTag + 1;
      } else {
        textElement.innerHTML += text.charAt(i);
        i++;
      }
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
      setTimeout(type, speed);
    }
  }
  type();
}

let recognition;
let isListening = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "ar-EG";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = function () {
    isListening = true;
    const btn = document.getElementById("ai-mic-btn");
    if (btn) btn.classList.add("ai-mic-active");
    document.getElementById("ai-user-input").placeholder =
      "جاري الاستماع... 🎧";
  };

  recognition.onend = function () {
    isListening = false;
    const btn = document.getElementById("ai-mic-btn");
    if (btn) btn.classList.remove("ai-mic-active");
    document.getElementById("ai-user-input").placeholder =
      "اكتب استفسارك هنا...";
  };

  recognition.onresult = function (event) {
    const transcript = Array.from(event.results)
      .map((result) => result[0])
      .map((result) => result.transcript)
      .join("");

    const input = document.getElementById("ai-user-input");
    input.value = transcript;
  };

  recognition.onerror = function (event) {
    console.error("Voice Error:", event.error);
    isListening = false;
    const btn = document.getElementById("ai-mic-btn");
    if (btn) btn.classList.remove("ai-mic-active");
  };
}

function toggleVoiceInput() {
  if (!recognition) {
    alert("عذراً، متصفحك لا يدعم الكتابة الصوتية.");
    return;
  }
  if (isListening) recognition.stop();
  else recognition.start();
}
window.toggleDesktopNotif = async function (e) {
  e.stopPropagation();
  const dropdown = document.getElementById("desktop-notif-dropdown");
  const badge = document.getElementById("desktop-notif-badge");

  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  } else {
    dropdown.style.display = "block";

    if (badge && badge.style.display !== "none") {
      badge.style.display = "none";
      try {
        await fetch("/api/user/notifications/read", { method: "POST" });
      } catch (e) {}
    }
  }
};

window.markAllRead = async function () {
  try {
    await fetch("/api/user/notifications/read", { method: "POST" });
    const badges = document.querySelectorAll(
      "#desktop-notif-badge, #menu-notif-badge, #notif-count-text"
    );
    badges.forEach((b) => (b.style.display = "none"));
    document
      .querySelectorAll(".menu-notif-item.unread")
      .forEach((el) => el.classList.remove("unread"));
  } catch (e) {}
};

window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("desktop-notif-dropdown");
  const btn = e.target.closest(".desktop-notif-btn");
  const isInsideDropdown = e.target.closest(".desktop-notif-dropdown");

  if (
    dropdown &&
    dropdown.style.display === "block" &&
    !btn &&
    !isInsideDropdown
  ) {
    dropdown.style.display = "none";
  }
});
const typeText = "في عقار معين في دماغك؟ احجز عقارك دلوقتي 🤔";
const typeContainer = document.querySelector(".typewriter-text");
let typeIndex = 0;

function typeWriterAnim() {
  if (typeContainer && typeIndex < typeText.length) {
    typeContainer.innerHTML += typeText.charAt(typeIndex);
    typeIndex++;
    setTimeout(typeWriterAnim, 100);
  }
}
document.addEventListener("DOMContentLoaded", typeWriterAnim);

function scrollToRequest() {
  document
    .querySelector(".request-property-section")
    .scrollIntoView({ behavior: "smooth" });
}
function openComplaintModal() {
  document.getElementById("complaint-modal").style.display = "flex";
}
function closeComplaintModal() {
  document.getElementById("complaint-modal").style.display = "none";
}
async function submitComplaint() {
  const btn = document.querySelector("#complaint-modal .action-btn");
  const originalText = btn.innerHTML;
  const text = document.getElementById("complaint-text").value;
  if (!text) return alert("اكتب تفاصيل الشكوى");

  btn.innerHTML = "جاري الإرسال...";
  btn.disabled = true;
  try {
    const res = await fetch("/api/submit-complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      alert("تم الإرسال بنجاح ✅");
      closeComplaintModal();
      document.getElementById("complaint-text").value = "";
    } else {
      alert("يجب تسجيل الدخول أولاً");
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

window.onload = function () {
  var expiryDate = new Date("2026-03-03");
  var today = new Date();
  if (
    !localStorage.getItem("hidePromoForever") &&
    !sessionStorage.getItem("hidePromoSession") &&
    today < expiryDate
  ) {
    document.getElementById("promoPopup").style.display = "flex";
  }
};
function closePopup() {
  document.getElementById("promoPopup").style.display = "none";
  if (document.getElementById("dontShowAgain").checked)
    localStorage.setItem("hidePromoForever", "true");
  else sessionStorage.setItem("hidePromoSession", "true");
}

window.closeIosPrompt = () => {
  document.getElementById("ios-install-prompt").style.display = "none";
  localStorage.setItem("iosPromptDismissed", Date.now());
};
document.addEventListener("DOMContentLoaded", () => {
  const isIos =
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone =
    window.navigator.standalone ||
    window.matchMedia("(display-mode: standalone)").matches;
  if (isIos && !isStandalone && !localStorage.getItem("iosPromptDismissed")) {
    setTimeout(() => {
      document.getElementById("ios-install-prompt").style.display = "flex";
    }, 3000);
  }
});
