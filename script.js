(function () {
    "use strict";
  
    /* ==================================================
       API
    ================================================== */
  
    const API_URL = "https://wedding-api.fatemehzare791379.workers.dev";
  
  
    /* ==================================================
       ELEMENTS
    ================================================== */
  
    const video = document.getElementById("hero");
    const music = document.getElementById("music");
    const start = document.getElementById("start");
    const glow = document.getElementById("glow");
    const letterOverlay = document.getElementById("letterOverlay");
    const invite = document.getElementById("invite");
    const muteBtn = document.getElementById("muteBtn");
    const backBtn = document.getElementById("backBtn");
    const soundWave = document.getElementById("soundWave");
  
    const slidesEl = document.getElementById("slides");
    const dots = document.querySelectorAll(".dot");
  
    const mapWrap = document.getElementById("mapWrap");
    const mapModal = document.getElementById("mapModal");
    const openNeshan = document.getElementById("openNeshan");
    const openBalad = document.getElementById("openBalad");
    const openGoogle = document.getElementById("openGoogle");
    const closeModal = document.getElementById("closeModal");
  
    const guestMessage = document.getElementById("guestMessage");
    const saveMessage = document.getElementById("saveMessage");
    const messagesList = document.getElementById("messagesList");
  
    const adminPanel = document.getElementById("adminPanel");
    const adminOpen = document.getElementById("adminOpen");
    const adminLogin = document.getElementById("adminLogin");
    const adminContent = document.getElementById("adminContent");
    const adminPassword = document.getElementById("adminPassword");
    const adminLoginBtn = document.getElementById("adminLoginBtn");
    const adminMessages = document.getElementById("adminMessages");
  
    const toastWrap = document.getElementById("toastWrap");
  
  
    /* ==================================================
       STATE
    ================================================== */
  
    let started = false;
    let currentSlide = 0;
    let scrollTimer = null;
  
    const MESSAGE_PAGE_SIZE = 4;
    let messagePage = 0;
    let allMessages = [];
  
    const AVATAR_COLORS = [
        "#5f9ea0",
        "#8d6aa8",
        "#b3708a",
        "#7d8f5f",
        "#c99b4a",
        "#5f8fa8"
    ];
  
    const ADMIN_MESSAGE_PAGE_SIZE = 5;
    let adminMessagePage = 0;
    let allAdminMessages = [];
  
    const GUESTS_PAGE_SIZE = 5;
    let guestsPage = 0;
    let allGuests = [];
  
    let nextMessageId = 1;
  
  
    /* ==================================================
       GUEST / UNIQUE LINK
    ================================================== */
  
    const params = new URLSearchParams(window.location.search);
  
    const guestToken =
        params.get("guest") ||
        params.get("token") ||
        params.get("guestId") ||
        "";
  
    let guestDisplayName =
        params.get("name") ||
        params.get("guestName") ||
        "";
  
  
    /* ==================================================
       HELPER
    ================================================== */
  
    function esc(text) {
        const div = document.createElement("div");
        div.textContent = String(text ?? "");
        return div.innerHTML;
    }
  
    function faNumber(number) {
        return String(number).replace(
            /\d/g,
            function (digit) {
                return "۰۱۲۳۴۵۶۷۸۹"[digit];
            }
        );
    }
  
  
    /* ==================================================
       TOAST
    ================================================== */
  
    function showToast(text, type) {
  
        if (!toastWrap) {
            return;
        }
  
        const toast = document.createElement("div");
  
        toast.className =
            "toast" +
            (type === "error" ? " error" : "");
  
        toast.innerHTML =
            '<span class="toast-icon">' +
            (type === "error" ? "!" : "🌹") +
            "</span>" +
            '<span class="toast-text">' +
            esc(text) +
            "</span>";
  
        toastWrap.appendChild(toast);
  
        requestAnimationFrame(function () {
            toast.classList.add("show");
        });
  
        setTimeout(function () {
  
            toast.classList.remove("show");
  
            setTimeout(function () {
                toast.remove();
            }, 400);
  
        }, 2600);
    }
  
  
    /* ==================================================
       TOUCH SUPPORT
    ================================================== */
  
    function addTouchSupport(element, callback) {
        if (!element) return;
  
        let touchStarted = false;
        let touchMoved = false;
  
        element.addEventListener('touchstart', function(e) {
            touchStarted = true;
            touchMoved = false;
            this.style.transform = 'scale(0.96)';
            this.style.transition = 'transform 0.1s ease';
        }, { passive: true });
  
        element.addEventListener('touchmove', function(e) {
            if (touchStarted) {
                touchMoved = true;
            }
        }, { passive: true });
  
        element.addEventListener('touchend', function(e) {
            if (touchStarted && !touchMoved) {
                touchStarted = false;
                this.style.transform = '';
                e.preventDefault();
                callback.call(this, e);
            } else {
                touchStarted = false;
                this.style.transform = '';
            }
        }, { passive: false });
  
        element.addEventListener('touchcancel', function() {
            touchStarted = false;
            this.style.transform = '';
        }, { passive: true });
  
        element.addEventListener('click', function(e) {
            if (!touchStarted) {
                callback.call(this, e);
            }
        });
    }
  
  
    /* ==================================================
       API HELPER
    ================================================== */
  
    async function apiRequest(
        path,
        options = {}
    ) {
  
        const response = await fetch(
            API_URL + path,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            }
        );
  
        let data;
  
        try {
            data = await response.json();
        } catch (error) {
            throw new Error("پاسخ نامعتبر از سرور");
        }
  
        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "خطایی رخ داده است"
            );
        }
  
        return data;
    }
  
  
    /* ==================================================
       نمایش نام مهمان در اسلایدها
    ================================================== */
  
    function displayGuestNames() {
        const guestNameDisplay = document.getElementById('guestNameDisplay');
        if (guestNameDisplay) {
            let displayName = guestDisplayName || 'مهمان عزیز';
            guestNameDisplay.innerHTML = `
                <span style="display: block; font-size: 0.5em; opacity: 0.7; margin-bottom: 8px; font-family: 'Amiri', serif;">
                </span>
                ${esc(displayName)}
                <span style="display: block; font-size: 0.4em; opacity: 0.5; margin-top: 10px; font-family: 'Amiri', serif;">
                </span>
            `;
        }
  
        const invitationGuestName = document.getElementById('invitationGuestName');
        if (invitationGuestName) {
            let displayName = guestDisplayName || 'مهمان عزیز';
            invitationGuestName.textContent = displayName;
        }
    }
  
  
    /* ==================================================
       INVITATION START
    ================================================== */
  
    async function playInvitation() {
  
        if (started) {
            return;
        }

        // اگر لینک منقضی/حذف شده، ویدیو پخش نشود
        if (invitationInvalid) {
            showExpiredInvitation();
            return;
        }

        // منتظر نتیجهٔ چک لینک بمان (اگر هنوز نیامده)
        if (guestToken && !guestInfoReady) {
            return;
        }
  
        started = true;
  
        if (start) {
            start.classList.add("hidden");
        }
  
        try {
            video.currentTime = 0;
        } catch (e) {}
  
        try {
            music.currentTime = 0;
        } catch (e) {}
  
        if (video) {
            video.play().catch(function (error) {
                console.warn(
                    "Video playback failed:",
                    error
                );
            });
        }
  
        if (music) {
            music.muted = false;
  
            music.play().catch(function (error) {
                console.warn(
                    "Music playback failed:",
                    error
                );
  
                showToast(
                    "برای پخش موسیقی دوباره روی صفحه لمس کنید.",
                    "error"
                );
            });
        }
  
        if (muteBtn) {
            muteBtn.classList.add("show");
        }
  
        if (backBtn) {
            backBtn.classList.add("show");
        }
  
        setTimeout(function () {
  
            if (!glow) {
                return;
            }
  
            glow.classList.remove("on");
  
            void glow.offsetWidth;
  
            glow.classList.add("on");
  
        }, 900);
    }
  
  
    function handleStartTap(e) {
        if (started) return;
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        playInvitation();
    }

    if (start) {
        addTouchSupport(start, handleStartTap);
        start.addEventListener("click", handleStartTap);
        const startBtn = start.querySelector("button");
        if (startBtn) {
            addTouchSupport(startBtn, handleStartTap);
        }
    }

    if (video) {
        addTouchSupport(video, handleStartTap);
        video.addEventListener("click", handleStartTap);
    }

    document.addEventListener(
        "click",
        function (e) {
            if (!started) {
                handleStartTap(e);
            }
        },
        true
    );

    document.addEventListener(
        "touchend",
        function (e) {
            if (!started) {
                var t = e.target;
                if (
                    t &&
                    (t.closest("#muteBtn") ||
                        t.closest("#backBtn") ||
                        t.closest("#adminOpen") ||
                        t.closest("#adminPanel"))
                ) {
                    return;
                }
                handleStartTap(e);
            }
        },
        { passive: false }
    );
  
  
    /* ==================================================
       MUSIC
    ================================================== */
  
    if (muteBtn) {
        addTouchSupport(muteBtn, function() {
            music.muted = !music.muted;
            if (soundWave) {
                soundWave.style.display = music.muted ? "none" : "";
            }
        });
    }
  
  
    /* ==================================================
       BACK TO START
    ================================================== */
  
    function resetToStart() {
  
        if (!started) {
            return;
        }
  
        started = false;
  
        if (invite) {
            invite.classList.remove("show");
        }
  
        if (start) {
            start.classList.remove("hidden");
        }
  
        if (glow) {
            glow.classList.remove("on");
        }

        if (letterOverlay) {
            letterOverlay.classList.remove("show");
            letterOverlay.setAttribute("aria-hidden", "true");
        }
  
        if (video) {
            video.pause();
            try {
                video.currentTime = 0;
            } catch (e) {}
        }
  
        if (music) {
            music.pause();
            try {
                music.currentTime = 0;
            } catch (e) {}
        }
  
        if (muteBtn) {
            muteBtn.classList.remove("show");
        }
  
        if (backBtn) {
            backBtn.classList.remove("show");
        }
  
        if (slidesEl) {
            slidesEl.scrollTop = 0;
            slidesEl.scrollTo({
                top: 0,
                behavior: "auto"
            });
        }
  
        setActiveDot(0);
  
        // یک فریم بعد هم مطمئن شو روی اسلاید اول است
        requestAnimationFrame(function () {
            if (slidesEl) {
                slidesEl.scrollTop = 0;
            }
            setActiveDot(0);
        });
  
    }
  
    if (backBtn) {
        addTouchSupport(backBtn, resetToStart);
    }
  
  
    /* ==================================================
       VIDEO END
    ================================================== */
  
    function showInvitation() {
  
        if (invitationInvalid) {
            return;
        }

        // همیشه از اسلاید اول شروع شود
        if (slidesEl) {
            slidesEl.scrollTo({
                top: 0,
                behavior: "auto"
            });
        }
        setActiveDot(0);

        if (invite) {
            invite.classList.add("show");
        }
  
    }
  
    if (video) {
  
        video.addEventListener(
            "ended",
            showInvitation
        );
  
        video.addEventListener(
            "timeupdate",
            function () {

                /*
                 * متن نامه در خود ویدئو نیست؛ اینجا زنده روی نامه قرار می‌گیرد.
                 * با رسیدن ویدئو به بخش نامه، متن ظاهر می‌شود.
                 */
                if (letterOverlay && video.duration) {
                    const showAt = Math.max(0, video.duration - 7.8);
                    if (video.currentTime >= showAt) {
                        if (!letterOverlay.classList.contains("show")) {
                            letterOverlay.classList.add("show");
                            letterOverlay.setAttribute("aria-hidden", "false");
                        }
                    } else {
                        letterOverlay.classList.remove("show");
                        letterOverlay.setAttribute("aria-hidden", "true");
                    }
                }

                if (
                    video.duration &&
                    video.currentTime >=
                    video.duration - 0.15
                ) {
                    showInvitation();
                }

            }
        );
  
    }
  
  
    /* ==================================================
       SLIDER
    ================================================== */
  
    function setActiveDot(index) {
  
        currentSlide = index;
  
        dots.forEach(
            function (dot, i) {
  
                dot.classList.toggle(
                    "active",
                    i === index
                );
  
            }
        );
  
    }
  
  
    function goToSlide(index) {
  
        index = Math.max(
            0,
            Math.min(
                dots.length - 1,
                index
            )
        );
  
        if (!slidesEl) {
            return;
        }
  
        slidesEl.scrollTo({
            top:
                index *
                slidesEl.clientHeight,
            behavior: "smooth"
        });
  
        setActiveDot(index);
    }
  
  
    dots.forEach(
        function (dot) {
  
            addTouchSupport(dot, function() {
                goToSlide(
                    Number(
                        this.dataset.i
                    )
                );
            });
  
        }
    );
  
  
    if (slidesEl) {
  
        slidesEl.addEventListener(
            "scroll",
            function () {
  
                clearTimeout(scrollTimer);
  
                scrollTimer = setTimeout(
                    function () {
  
                        const height =
                            slidesEl.clientHeight;
  
                        if (!height) {
                            return;
                        }
  
                        const index =
                            Math.round(
                                slidesEl.scrollTop /
                                height
                            );
  
                        setActiveDot(index);
  
                    },
                    60
                );
  
            },
            {
                passive: true
            }
        );
  
    }
  
  
    window.addEventListener(
        "resize",
        function () {
  
            if (!slidesEl) {
                return;
            }
  
            slidesEl.scrollTo({
                top:
                    currentSlide *
                    slidesEl.clientHeight,
                behavior: "auto"
            });
  
        }
    );
  
  
    /* ==================================================
       MAP
    ================================================== */
  
    const VENUE_LAT = 31.935501;
    const VENUE_LNG = 54.309899;
  
    const VENUE_PLACE_ID =
        "ChIJCUOS6_sQpj8Rb5ZdWYlEb50";
  
    const VENUE_GOOGLE_MAPS_LINK =
        "https://maps.app.goo.gl/CQtGCFuTfmPmc2HGA";
  
    const VENUE_BALAD_LINK =
        "https://balad.ir/p/36oSAtOBms7JG7";
  
    const VENUE_NESHAN_LINK =
        "https://neshan.org/maps/places/a0257624c3deb565466c9b3d6629942a#c31.936-54.315-15z-0p";
  
  
    if (mapWrap) {
        addTouchSupport(mapWrap, function () {
            mapModal.classList.add("show");
        });
    }
  
  
    if (closeModal) {
        addTouchSupport(closeModal, function () {
            mapModal.classList.remove("show");
        });
    }
  
  
    if (mapModal) {
  
        mapModal.addEventListener(
            "click",
            function (event) {
  
                if (
                    event.target === mapModal
                ) {
                    mapModal.classList.remove("show");
                }
  
            }
        );
  
    }
  
  
    if (openGoogle) {
        addTouchSupport(openGoogle, function () {
  
            window.open(
                VENUE_GOOGLE_MAPS_LINK,
                "_blank",
                "noopener,noreferrer"
            );
  
            mapModal.classList.remove("show");
        });
    }
  
  
    if (openNeshan) {
        addTouchSupport(openNeshan, function () {
  
            window.open(
                VENUE_NESHAN_LINK,
                "_blank",
                "noopener,noreferrer"
            );
  
            mapModal.classList.remove("show");
        });
    }
  
  
    if (openBalad) {
        addTouchSupport(openBalad, function () {
  
            window.open(
                VENUE_BALAD_LINK,
                "_blank",
                "noopener,noreferrer"
            );
  
            mapModal.classList.remove("show");
        });
    }
  
  
    /* ==================================================
       GUEST VIEW
    ================================================== */
  
    let invitationInvalid = false;
    let guestInfoReady = !guestToken; // اگر توکن نباشد، نیازی به چک نیست

    function showExpiredInvitation() {
        invitationInvalid = true;
        started = true; // جلوگیری از پخش ویدیو/موسیقی

        if (start) start.classList.add("hidden");
        if (invite) invite.classList.remove("show");
        if (muteBtn) muteBtn.classList.remove("show");
        if (backBtn) backBtn.classList.remove("show");
        if (adminOpen) adminOpen.style.display = "none";
        if (video) {
            try { video.pause(); } catch (e) {}
            video.style.display = "none";
        }
        if (music) {
            try { music.pause(); } catch (e) {}
        }

        var overlay = document.getElementById("expiredOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "expiredOverlay";
            overlay.innerHTML =
                '<div class="expired-card">' +
                '<div class="orn">❦</div>' +
                '<h2>متأسفیم</h2>' +
                '<p>این لینک دعوت‌نامه دیگر معتبر نیست<br>یا منقضی شده است.</p>' +
                '<p class="expired-sub">از همراهی شما سپاسگزاریم 🌹</p>' +
                '</div>';
            document.querySelector(".stage").appendChild(overlay);
        }
        overlay.style.display = "flex";
    }

    async function loadGuestInfo() {
  
        if (!guestToken) {
            guestInfoReady = true;
            return;
        }
  
        try {
  
            const data =
                await apiRequest(
                    "/invitations/" +
                    encodeURIComponent(guestToken)
                );
  
            const invitation =
                data.invitation;
  
            if (
                invitation &&
                invitation.guest_name &&
                invitation.expired !== true
            ) {
                guestDisplayName =
                    invitation.guest_name;
  
                displayGuestNames();
                guestInfoReady = true;
            } else {
                showExpiredInvitation();
                guestInfoReady = true;
            }
  
        } catch (error) {
  
            console.warn(
                "خطا در دریافت اطلاعات دعوت‌نامه:",
                error
            );
  
            showExpiredInvitation();
            guestInfoReady = true;
  
        }
  
    }
  
  
    /* ==================================================
       ADMIN GEAR
    ================================================== */
  
    if (guestToken) {
        if (adminOpen) {
            adminOpen.style.display = "none";
        }
    }
  
  
    /* ==================================================
       GET MESSAGES
    ================================================== */
  
    async function getMessages() {
  
        const data =
            await apiRequest(
                "/messages"
            );
  
        return data.messages || [];
    }
  
  
    /* ==================================================
       MESSAGE COUNTER
    ================================================== */
  
    function updateMessageCounter() {
  
        const counter =
            document.getElementById(
                "messageCounter"
            );
  
        if (!counter) {
            return;
        }
  
        counter.innerHTML =
            "<span class='counter-num'>" +
            faNumber(allMessages.length) +
            "</span> پیام محبت‌آمیز شما <span class='counter-heart'>♥</span>";
  
    }
  
  
    function formatMessageMeta(item) {
  
        const raw =
            item.created_at ||
            item.createdAt ||
            item.date ||
            item.timestamp ||
            item.submitted_at ||
            null;
  
        if (!raw) {
            return "";
        }
  
        try {
  
            const d = new Date(raw);
  
            if (isNaN(d.getTime())) {
                return "";
            }
  
            const time =
                d.toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit"
                });
  
            const date =
                d.toLocaleDateString("fa-IR");
  
            return time + " &middot; " + date;
  
        } catch (error) {
            return "";
        }
  
    }
  
  
    /* ==================================================
       MESSAGE PAGINATION
    ================================================== */
  
    function renderMessages() {
  
        if (!messagesList) {
            return;
        }
  
        updateMessageCounter();
  
        if (!allMessages || allMessages.length === 0) {
  
            messagesList.innerHTML = `
        <div class="guest-message empty">
          <span>
            هنوز پیامی ثبت نشده است 🌹
          </span>
        </div>
      `;
  
            renderMessagePagination();
  
            return;
        }
  
  
        const startIndex =
            messagePage *
            MESSAGE_PAGE_SIZE;
  
        const pageItems =
            allMessages.slice(
                startIndex,
                startIndex +
                MESSAGE_PAGE_SIZE
            );
  
  
        if (pageItems.length === 0) {
            messagePage = 0;
            renderMessages();
            return;
        }
  
  
        messagesList.innerHTML =
            pageItems
                .map(function (item, i) {
  
                    const globalIndex =
                        startIndex + i;
  
                    const badgeNumber =
                        allMessages.length -
                        globalIndex;
  
                    const color =
                        AVATAR_COLORS[
                            globalIndex %
                            AVATAR_COLORS.length
                        ];
  
                    const meta =
                        formatMessageMeta(item);
  
                    return `
            <div class="guest-message">
              <div
                class="avatar"
                style="background:${color};"
              >
                ${faNumber(badgeNumber)}
              </div>
  
              <div class="msg-body">
                <div class="msg-head">
                  <span class="msg-name">
                    ${esc(
                        item.name ||
                        "مهمان"
                    )}
                    <span class="msg-heart">♥</span>
                  </span>
  
                  ${
                    meta
                        ? `<span class="msg-time">${meta}</span>`
                        : ""
                  }
                </div>
  
                <div class="msg-text">
                  ${esc(
                        item.message
                    )}
                </div>
              </div>
            </div>
          `;
  
                })
                .join("");
  
  
        renderMessagePagination();
    }
  
  
    function renderMessagePagination() {
  
        const pagination =
            document.getElementById(
                "messagePagination"
            );
  
        if (!pagination) {
            return;
        }
  
        const totalPages =
            Math.ceil(
                allMessages.length /
                MESSAGE_PAGE_SIZE
            );
  
  
        if (totalPages <= 1) {
  
            pagination.innerHTML = "";
  
            return;
        }
  
  
        let html = "";
  
        html += `
      <button
        type="button"
        class="message-page-btn"
        data-page="prev"
        ${messagePage === 0 ? "disabled" : ""}
      >
        ‹
      </button>
    `;
  
        for (
            let i = 0;
            i < totalPages;
            i++
        ) {
  
            html += `
        <button
          type="button"
          class="message-page-btn ${i === messagePage ? "active" : ""}"
          data-page="${i}"
        >
          ${faNumber(i + 1)}
        </button>
      `;
  
        }
  
        html += `
      <button
        type="button"
        class="message-page-btn"
        data-page="next"
        ${messagePage >= totalPages - 1 ? "disabled" : ""}
      >
        ›
      </button>
    `;
  
  
        pagination.innerHTML = html;
  
  
        pagination
            .querySelectorAll(
                ".message-page-btn"
            )
            .forEach(function (button) {
  
                addTouchSupport(button, function() {
                    const page =
                        this.dataset.page;
  
                    if (page === "prev") {
                        if (messagePage > 0) {
                            messagePage--;
                        }
                    } else if (page === "next") {
                        if (messagePage < totalPages - 1) {
                            messagePage++;
                        }
                    } else {
                        messagePage = Number(page);
                    }
  
                    renderMessages();
                });
  
            });
  
    }
  
  
    async function loadMessages() {
  
        try {
  
            allMessages =
                await getMessages();
  
            if (!Array.isArray(allMessages)) {
                allMessages = [];
            }
  
            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        allMessages.length /
                        MESSAGE_PAGE_SIZE
                    )
                );
  
            if (
                messagePage >=
                totalPages
            ) {
                messagePage =
                    totalPages - 1;
            }
  
            renderMessages();
  
        } catch (error) {
  
            console.error(
                "خطا در بارگیری پیام‌ها:",
                error
            );
  
            if (messagesList) {
  
                messagesList.innerHTML = `
          <div class="guest-message">
            <span>
              خطا در بارگیری پیام‌ها.
              لطفاً صفحه را مجدداً بارگذاری کنید.
            </span>
          </div>
        `;
  
            }
  
        }
  
    }
  
  
    /* ==================================================
       SAVE MESSAGE
    ================================================== */
  
    if (saveMessage) {
  
        addTouchSupport(saveMessage, async function() {
  
            const guestNameInput = document.getElementById('guestName');
            const inputName = guestNameInput ? guestNameInput.value.trim() : "";
            // اگر نام وارد نشده، از نام مهمان اسلاید اول استفاده شود
            const name = inputName || guestDisplayName || 'مهمان عزیز';
  
            const message =
                guestMessage
                    ? guestMessage.value.trim()
                    : "";
  
  
            if (!message) {
  
                showToast(
                    "لطفاً پیام خود را بنویسید.",
                    "error"
                );
  
                if (guestMessage) {
                    guestMessage.focus();
                }
  
                return;
            }
  
  
            this.disabled = true;
  
  
            try {
  
                await apiRequest(
                    "/messages",
                    {
                        method: "POST",
  
                        body: JSON.stringify({
                            name: name,
                            message: message,
                            token:
                                guestToken || null
                        })
                    }
                );
  
  
                if (guestMessage) {
                    guestMessage.value = "";
                }
  
  
                messagePage = 0;
  
                await loadMessages();
  
                showToast(
                    "پیام شما با موفقیت ثبت شد."
                );
  
  
            } catch (error) {
  
                console.error(
                    "خطا در ثبت پیام:",
                    error
                );
  
                showToast(
                    error.message ||
                    "خطا در ذخیره پیام.",
                    "error"
                );
  
            } finally {
  
                this.disabled = false;
  
            }
  
        });
  
    }
  
  
    /* ==================================================
       ADMIN PANEL
    ================================================== */
  
    function closeAdmin() {
  
        adminPanel.classList.remove(
            "show"
        );
  
        adminPassword.value = "";
  
        adminLogin.hidden = false;
        adminContent.hidden = true;
  
        document.querySelectorAll(".admin-tab").forEach(function(tab) {
            tab.classList.remove("active");
        });
  
        var messagesSection = document.getElementById("messagesSection");
        var sharingSection = document.getElementById("sharingSection");
  
        if (messagesSection) {
            messagesSection.hidden = true;
        }
  
        if (sharingSection) {
            sharingSection.hidden = true;
        }
  
    }
  
  
    if (adminOpen) {
        addTouchSupport(adminOpen, function () {
            adminPanel.classList.add("show");
            setTimeout(function () {
                adminPassword.focus();
            }, 100);
        });
    }
  
  
    if (adminPanel) {
  
        adminPanel.addEventListener(
            "click",
            function (event) {
  
                if (
                    event.target ===
                    adminPanel
                ) {
                    closeAdmin();
                }
  
            }
        );
  
    }
  
  
    /* ==================================================
       ADMIN LOGIN
    ================================================== */
  
    function adminLoginAction() {
  
        const ADMIN_PASSWORD =
            "8520";
  
  
        if (
            adminPassword.value ===
            ADMIN_PASSWORD
        ) {
  
            adminLogin.hidden = true;
            adminContent.hidden = false;
  
            var messagesSection = document.getElementById("messagesSection");
            var sharingSection = document.getElementById("sharingSection");
  
            if (messagesSection) {
                messagesSection.hidden = true;
            }
  
            if (sharingSection) {
                sharingSection.hidden = true;
            }
  
            document.querySelectorAll(".admin-tab").forEach(function(tab) {
                tab.classList.remove("active");
            });
  
            renderAdminMessages();
            loadGuests();
  
        } else {
  
            showToast(
                "رمز نادرست است.",
                "error"
            );
  
            adminPassword.value = "";
  
            adminPassword.focus();
  
        }
  
    }
  
  
    if (adminLoginBtn) {
        addTouchSupport(adminLoginBtn, adminLoginAction);
    }
  
  
    if (adminPassword) {
  
        adminPassword.addEventListener(
            "keydown",
            function (event) {
  
                if (
                    event.key ===
                    "Enter"
                ) {
                    adminLoginAction();
                }
  
            }
        );
  
    }
  
  
    /* ==================================================
       ADMIN TABS
    ================================================== */
  
    var messagesTab = document.getElementById("messagesTab");
    var sharingTab = document.getElementById("sharingTab");
  
    if (messagesTab) {
        addTouchSupport(messagesTab, function () {
            document.querySelectorAll(".admin-tab").forEach(function(t) {
                t.classList.remove("active");
            });
            this.classList.add("active");
            document.getElementById("messagesSection").hidden = false;
            document.getElementById("sharingSection").hidden = true;
            renderAdminMessages();
        });
    }
  
  
    if (sharingTab) {
        addTouchSupport(sharingTab, function () {
            document.querySelectorAll(".admin-tab").forEach(function(t) {
                t.classList.remove("active");
            });
            this.classList.add("active");
            document.getElementById("messagesSection").hidden = true;
            document.getElementById("sharingSection").hidden = false;
            loadGuests();
        });
    }
  
  
    /* ==================================================
       ADMIN MESSAGES
    ================================================== */
  
    async function renderAdminMessages() {
  
        if (!adminMessages) {
            return;
        }
  
        try {
  
            const data =
                await apiRequest(
                    "/admin/messages"
                );
  
            allAdminMessages =
                data.messages || [];
  
            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        allAdminMessages.length /
                        ADMIN_MESSAGE_PAGE_SIZE
                    )
                );
  
            if (adminMessagePage >= totalPages) {
                adminMessagePage = totalPages - 1;
            }
  
            const counter =
                document.getElementById(
                    "adminMessageCount"
                );
  
            if (counter) {
                counter.textContent =
                    faNumber(
                        allAdminMessages.length
                    );
            }
  
            renderAdminMessagesPage();
  
        } catch (error) {
  
            console.error(error);
  
            adminMessages.innerHTML =
                "<p>خطا در بارگیری پیام‌ها.</p>";
  
        }
  
    }
  
  
    function renderAdminMessagesPage() {
  
        if (!adminMessages) {
            return;
        }
  
        if (!allAdminMessages.length) {
  
            adminMessages.innerHTML =
                "<p>پیامی وجود ندارد.</p>";
  
            renderAdminMessagesPagination();
  
            return;
        }
  
  
        const startIndex =
            adminMessagePage *
            ADMIN_MESSAGE_PAGE_SIZE;
  
        const pageItems =
            allAdminMessages.slice(
                startIndex,
                startIndex +
                ADMIN_MESSAGE_PAGE_SIZE
            );
  
  
        adminMessages.innerHTML =
                pageItems
                    .map(function (item) {
  
                        return `
              <div
                class="admin-row"
                data-message-id="${esc(item.id)}"
              >
  
                <span>
                  <b>
                    ${esc(
                            item.name ||
                            "مهمان"
                        )}
                  </b>
  
                  <br>
  
                  <small>
                    ${esc(
                            item.message
                        )}
                  </small>
                </span>
  
                <button
                  type="button"
                  data-toggle="${esc(item.id)}"
                >
                  ${item.visible ? "عدم نمایش" : "نمایش"}
                </button>
  
                <button
                  type="button"
                  data-delete="${esc(item.id)}"
                  style="background:#8a5a5a;"
                >
                  ✕
                </button>
  
              </div>
            `;
  
                    })
                    .join("");
  
  
        renderAdminMessagesPagination();
  
    }
  
  
    function renderAdminMessagesPagination() {
  
        const pagination =
            document.getElementById(
                "adminMessagePagination"
            );
  
        if (!pagination) {
            return;
        }
  
        const totalPages =
            Math.ceil(
                allAdminMessages.length /
                ADMIN_MESSAGE_PAGE_SIZE
            );
  
        if (totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }
  
        let html = "";
  
        html += `
      <button
        type="button"
        class="message-page-btn"
        data-page="prev"
        ${adminMessagePage === 0 ? "disabled" : ""}
      >
        ‹
      </button>
    `;
  
        for (let i = 0; i < totalPages; i++) {
            html += `
        <button
          type="button"
          class="message-page-btn ${i === adminMessagePage ? "active" : ""}"
          data-page="${i}"
        >
          ${faNumber(i + 1)}
        </button>
      `;
        }
  
        html += `
      <button
        type="button"
        class="message-page-btn"
        data-page="next"
        ${adminMessagePage >= totalPages - 1 ? "disabled" : ""}
      >
        ›
      </button>
    `;
  
        pagination.innerHTML = html;
  
        pagination
            .querySelectorAll(".message-page-btn")
            .forEach(function (button) {
  
                addTouchSupport(button, function () {
  
                    const page = this.dataset.page;
  
                    if (page === "prev") {
                        if (adminMessagePage > 0) {
                            adminMessagePage--;
                        }
                    } else if (page === "next") {
                        if (adminMessagePage < totalPages - 1) {
                            adminMessagePage++;
                        }
                    } else {
                        adminMessagePage = Number(page);
                    }
  
                    renderAdminMessagesPage();
                });
  
            });
  
    }
  
  
    /* ==================================================
       ADMIN MESSAGE ACTIONS
    ================================================== */
  
    if (adminMessages) {
  
        adminMessages.addEventListener(
            "click",
            async function (event) {
  
                const toggleBtn =
                    event.target.closest(
                        "button[data-toggle]"
                    );
  
                const deleteBtn =
                    event.target.closest(
                        "button[data-delete]"
                    );
  
  
                if (toggleBtn) {
  
                    const id =
                        Number(
                            toggleBtn.dataset.toggle
                        );
  
                    try {
  
                        await apiRequest(
                            "/messages/" +
                            id +
                            "/toggle",
                            {
                                method: "PUT"
                            }
                        );
  
                        await renderAdminMessages();
                        await loadMessages();
  
                    } catch (error) {
  
                        console.error(error);
  
                        showToast(
                            "خطا در تغییر وضعیت پیام.",
                            "error"
                        );
  
                    }
  
                    return;
                }
  
  
                if (deleteBtn) {
  
                    const id =
                        Number(
                            deleteBtn.dataset.delete
                        );
  
  
                    if (
                        !confirm(
                            "آیا از حذف این پیام اطمینان دارید؟"
                        )
                    ) {
                        return;
                    }
  
  
                    try {
  
                        await apiRequest(
                            "/messages/" +
                            id,
                            {
                                method: "DELETE"
                            }
                        );
  
                        await renderAdminMessages();
                        await loadMessages();
  
                    } catch (error) {
  
                        console.error(error);
  
                        showToast(
                            "خطا در حذف پیام.",
                            "error"
                        );
  
                    }
  
                }
  
            }
        );
  
    }
  
  
    /* ==================================================
       GUEST MANAGEMENT
    ================================================== */
  
    const guestNameInput = document.getElementById("newGuestName");
    const createGuestBtn = document.getElementById("createGuestBtn");
    const guestsList = document.getElementById("guestsList");
  
  
    async function loadGuests() {
  
        if (!guestsList) {
            return;
        }
  
        try {
  
            const data =
                await apiRequest(
                    "/invitations"
                );
  
            allGuests =
                data.invitations || [];
  
            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        allGuests.length /
                        GUESTS_PAGE_SIZE
                    )
                );
  
            if (guestsPage >= totalPages) {
                guestsPage = totalPages - 1;
            }
  
            renderGuestsPage();
  
        } catch (error) {
  
            console.error(
                "خطا در دریافت مهمان‌ها:",
                error
            );
  
            guestsList.innerHTML =
                "<p style='color: var(--ink-soft);'>خطا در بارگیری مهمان‌ها.</p>";
  
        }
  
    }
  
  
    function formatExpiry(expiresAt, expired) {
  
        if (!expiresAt) {
            return "بدون انقضا";
        }
  
        try {
  
            const dateLabel =
                new Date(expiresAt)
                    .toLocaleDateString("fa-IR");
  
            return expired
                ? "منقضی شده (" + dateLabel + ")"
                : "انقضا: " + dateLabel;
  
        } catch (error) {
  
            return expired
                ? "منقضی شده"
                : "دارای انقضا";
  
        }
  
    }
  
  
    function renderGuestsPage() {
        if (!guestsList) {
            return;
        }
    
        const activeGuests = allGuests.filter(function (guest) {
            return !guest.expired;
        });
    
        if (!activeGuests.length) {
            guestsList.innerHTML =
                "<p style='color: var(--ink-soft); padding: 10px 0;'>هیچ لینک فعالی وجود ندارد.</p>";
            renderGuestsPagination();
            return;
        }
    
        const startIndex =
            guestsPage *
            GUESTS_PAGE_SIZE;
    
        const pageItems =
            activeGuests.slice(
                startIndex,
                startIndex +
                GUESTS_PAGE_SIZE
            );
    
        guestsList.innerHTML =
            pageItems
                .map(function (guest) {
                    const token =
                        guest.token ||
                        guest.id ||
                        "";
    
                    const link =
                        new URL(
                            window.location.href
                        );
                    link.search = "";
                    link.searchParams.set(
                        "guest",
                        token
                    );
    
                    return `
                  <div
                    class="guest-admin-row"
                    data-guest-id="${esc(guest.id)}"
                  >
                    <div>
                      <strong>
                        ${esc(
                                guest.guest_name ||
                                "مهمان"
                            )}
                      </strong>
                      <small>
                        ${guest.viewed ? "👁 مشاهده شده" : "○ مشاهده نشده"}
                        ·
                        <span>
                          ${esc(
                                formatExpiry(
                                    guest.expires_at,
                                    false
                                )
                            )}
                        </span>
                      </small>
                    </div>
                    <div>
                      <button
                        type="button"
                        class="share-guest"
                        data-link="${esc(link.href)}"
                      >
                        اشتراک‌گذاری
                      </button>
                      <button
                        type="button"
                        class="copy-guest"
                        data-link="${esc(link.href)}"
                      >
                        کپی لینک
                      </button>
                      <button
                        type="button"
                        class="expire-guest"
                        data-expire-id="${esc(guest.id)}"
                        style="background:#8a5a5a;"
                      >
                        حذف لینک
                      </button>
                    </div>
                  </div>
                `;
                })
                .join("");
    
        renderGuestsPagination();
    }
  
  
    function renderGuestsPagination() {
  
        const pagination =
            document.getElementById(
                "guestsPagination"
            );
  
        if (!pagination) {
            return;
        }
  
        const activeCount =
            allGuests.filter(function (guest) {
                return !guest.expired;
            }).length;
  
        const totalPages =
            Math.ceil(
                activeCount /
                GUESTS_PAGE_SIZE
            );
  
        if (totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }
  
        let html = "";
  
        html += `
      <button
        type="button"
        class="message-page-btn"
        data-page="prev"
        ${guestsPage === 0 ? "disabled" : ""}
      >
        ‹
      </button>
    `;
  
        for (let i = 0; i < totalPages; i++) {
            html += `
        <button
          type="button"
          class="message-page-btn ${i === guestsPage ? "active" : ""}"
          data-page="${i}"
        >
          ${faNumber(i + 1)}
        </button>
      `;
        }
  
        html += `
      <button
        type="button"
        class="message-page-btn"
        data-page="next"
        ${guestsPage >= totalPages - 1 ? "disabled" : ""}
      >
        ›
      </button>
    `;
  
        pagination.innerHTML = html;
  
        pagination
            .querySelectorAll(".message-page-btn")
            .forEach(function (button) {
  
                addTouchSupport(button, function () {
  
                    const page = this.dataset.page;
  
                    if (page === "prev") {
                        if (guestsPage > 0) {
                            guestsPage--;
                        }
                    } else if (page === "next") {
                        if (guestsPage < totalPages - 1) {
                            guestsPage++;
                        }
                    } else {
                        guestsPage = Number(page);
                    }
  
                    renderGuestsPage();
                });
  
            });
  
    }
  
  
    /* ==================================================
       CREATE GUEST LINK
    ================================================== */
  
    if (createGuestBtn) {
  
        addTouchSupport(createGuestBtn, async function() {
  
            const name =
                guestNameInput
                    ? guestNameInput.value.trim()
                    : "";
  
  
            if (!name) {
  
                showToast(
                    "لطفاً نام مهمان را وارد کنید.",
                    "error"
                );
  
                if (guestNameInput) {
                    guestNameInput.focus();
                }
  
                return;
            }
  
  
            this.disabled = true;
            this.textContent = "در حال ایجاد...";
  
  
            const expirySelect =
                document.getElementById(
                    "newGuestExpiry"
                );
  
            const expiresInDays =
                expirySelect
                    ? Number(expirySelect.value) || 0
                    : 0;
  
  
            try {
  
                const data =
                    await apiRequest(
                        "/invitations",
                        {
                            method: "POST",
  
                            body:
                                JSON.stringify({
                                    guest_name: name,
                                    expires_in_days: expiresInDays
                                })
                        }
                    );
  
  
                if (
                    guestNameInput
                ) {
                    guestNameInput.value = "";
                }
  
  
                await loadGuests();
  
  
                const invitation =
                    data.invitation ||
                    data;
  
                const token =
                    invitation.token ||
                    invitation.id ||
                    "";
  
                let correctLink = "";
  
                if (token) {
  
                    const linkUrl =
                        new URL(
                            window.location.href
                        );
  
                    linkUrl.search = "";
  
                    linkUrl.searchParams.set(
                        "guest",
                        token
                    );
  
                    correctLink = linkUrl.href;
  
                } else if (data.link) {
  
                    correctLink = data.link;
  
                }
  
  
                if (correctLink) {
  
                    showShareMenu(
                        correctLink,
                        name
                    );
  
                } else {
  
                    showToast(
                        "لینک اختصاصی ساخته شد."
                    );
  
                }
  
  
            } catch (error) {
  
                console.error(error);
  
                showToast(
                    error.message ||
                    "خطا در ایجاد لینک.",
                    "error"
                );
  
            } finally {
  
                this.disabled = false;
                this.textContent = "ایجاد لینک";
  
            }
  
        });
  
    }
  
  
    /* ==================================================
       SHARE
    ================================================== */
  
    async function shareLink(
        link,
        guestName
    ) {
  
        const shareData = {
            title:
                "دعوت‌نامه عروسی نازنین زهرا و محمد مهدی",
  
            text:
                "دعوت‌نامه اختصاصی برای " +
                guestName,
  
            url: link
        };
  
  
        if (
            navigator.share &&
            navigator.canShare
        ) {
  
            try {
  
                if (
                    navigator.canShare(
                        shareData
                    )
                ) {
  
                    await navigator.share(
                        shareData
                    );
  
                    return true;
  
                }
  
            } catch (error) {
  
                if (
                    error.name ===
                    "AbortError"
                ) {
                    return false;
                }
  
            }
  
        }
  
  
        return copyLink(link);
  
    }
  
  
    async function copyLink(link) {
  
        try {
  
            await navigator.clipboard.writeText(
                link
            );
  
            showToast(
                "لینک اختصاصی کپی شد."
            );
  
            return true;
  
        } catch (error) {
  
            const textarea =
                document.createElement(
                    "textarea"
                );
  
            textarea.value = link;
  
            textarea.style.position =
                "fixed";
  
            textarea.style.opacity = "0";
  
            document.body.appendChild(
                textarea
            );
  
            textarea.select();
  
            try {
  
                document.execCommand(
                    "copy"
                );
  
                showToast(
                    "لینک اختصاصی کپی شد."
                );
  
                return true;
  
            } catch (e) {
  
                showToast(
                    "امکان کپی لینک وجود ندارد.",
                    "error"
                );
  
                return false;
  
            } finally {
  
                textarea.remove();
  
            }
  
        }
  
    }
  
  
    function showShareMenu(
        link,
        guestName
    ) {
  
        shareLink(
            link,
            guestName
        );
  
    }
  
  
    /* ==================================================
       GUEST LIST BUTTONS
    ================================================== */
  
    if (guestsList) {
  
        guestsList.addEventListener(
            "click",
            async function (event) {
  
                const shareButton =
                    event.target.closest(
                        ".share-guest"
                    );
  
                const copyButton =
                    event.target.closest(
                        ".copy-guest"
                    );
  
                const expireButton =
                    event.target.closest(
                        ".expire-guest"
                    );
  
  
                if (shareButton) {
  
                    const link =
                        shareButton.dataset.link;
  
  
                    const row =
                        shareButton.closest(
                            ".guest-admin-row"
                        );
  
  
                    const name =
                        row
                            ? (
                                row.querySelector(
                                    "strong"
                                )?.textContent ||
                                "مهمان"
                            ).trim()
                            : "مهمان";
  
  
                    await shareLink(
                        link,
                        name
                    );
  
                    return;
                }
  
  
                if (copyButton) {
  
                    await copyLink(
                        copyButton.dataset.link
                    );
  
                    return;
                }
  
  
                if (expireButton) {
  
                    const id =
                        Number(
                            expireButton.dataset.expireId
                        );
  
                    if (!id) {
                        return;
                    }
  
                    if (
                        !confirm(
                            "آیا از حذف این لینک اطمینان دارید؟ لینک دیگر قابل استفاده نخواهد بود."
                        )
                    ) {
                        return;
                    }
  
                    try {
  
                        await apiRequest(
                            "/invitations/" +
                            id +
                            "/expire",
                            {
                                method: "PUT"
                            }
                        );
  
                        await loadGuests();
  
                        showToast(
                            "لینک حذف شد."
                        );
  
                    } catch (error) {
  
                        console.error(error);
  
                        showToast(
                            "خطا در حذف لینک.",
                            "error"
                        );
  
                    }
  
                }
  
            }
        );
  
    }
  
  
    /* ==================================================
       COUNTDOWN
    ================================================== */
  
    const wedding =
        new Date(
            "2026-09-12T19:00:00+03:30"
        );
  
  
    function updateCountdown() {
  
        const difference =
            wedding.getTime() -
            Date.now();
  
  
        const daysEl =
            document.getElementById(
                "days"
            );
  
        const hoursEl =
            document.getElementById(
                "hours"
            );
  
        const minutesEl =
            document.getElementById(
                "minutes"
            );
  
        const secondsEl =
            document.getElementById(
                "seconds"
            );
  
  
        if (
            !daysEl ||
            !hoursEl ||
            !minutesEl ||
            !secondsEl
        ) {
            return;
        }
  
  
        if (difference <= 0) {
  
            daysEl.textContent = "۰۰";
            hoursEl.textContent = "۰۰";
            minutesEl.textContent = "۰۰";
            secondsEl.textContent = "۰۰";
  
            const doneEl =
                document.getElementById(
                    "countdownDone"
                );
  
            if (doneEl) {
                doneEl.hidden = false;
            }
  
            return;
        }
  
  
        const totalSeconds =
            Math.floor(
                difference / 1000
            );
  
        const doneElActive =
            document.getElementById(
                "countdownDone"
            );
  
        if (doneElActive) {
            doneElActive.hidden = true;
        }
  
        const days =
            Math.floor(
                totalSeconds / 86400
            );
  
        const hours =
            Math.floor(
                (totalSeconds % 86400) /
                3600
            );
  
        const minutes =
            Math.floor(
                (totalSeconds % 3600) /
                60
            );
  
        const seconds =
            totalSeconds % 60;
  
  
        const daysStr =
            String(
                Math.min(days, 99)
            ).padStart(2, "0");
  
        const hoursStr =
            String(hours).padStart(
                2,
                "0"
            );
  
        const minutesStr =
            String(minutes).padStart(
                2,
                "0"
            );
  
        const secondsStr =
            String(seconds).padStart(
                2,
                "0"
            );
  
  
        daysEl.textContent =
            faNumber(daysStr);
  
        hoursEl.textContent =
            faNumber(hoursStr);
  
        minutesEl.textContent =
            faNumber(minutesStr);
  
        secondsEl.textContent =
            faNumber(secondsStr);
  
    }
  
  
    updateCountdown();
  
    setInterval(
        updateCountdown,
        1000
    );
  
  
    /* ==================================================
       INITIAL LOAD
    ================================================== */

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    if (slidesEl) {
        slidesEl.scrollTop = 0;
        setActiveDot(0);
    }

    window.addEventListener("load", function () {
        if (slidesEl) {
            slidesEl.scrollTop = 0;
            setActiveDot(0);
        }
    });
  
    displayGuestNames();
  
    // اول وضعیت لینک چک شود تا ویدیو برای لینک منقضی پخش نشود
    loadGuestInfo();
  
    loadMessages();
  
  
    setInterval(
        function () {
  
            loadMessages();
  
            if (
                adminPanel &&
                adminPanel.classList.contains(
                    "show"
                ) &&
                adminContent &&
                !adminContent.hidden
            ) {
  
                renderAdminMessages();
                loadGuests();
  
            }
  
        },
        10000
    );
  
  
  })();