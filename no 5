"use strict";

const BUILT_IN_CONFIG = {
  GOOGLE_CLIENT_ID: "1003316566308-c54h3bdag8bf6jocsc6g17rgb4kj098n.apps.googleusercontent.com",
  CALENDAR_ID: "161afc2b39c63d9e0cb766d21e1b544e9c7d3d03fcdce363bf1f194a79ad034e@group.calendar.google.com",
  GOOGLE_SCOPE: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  AUTO_REFRESH_SECONDS: 60,
  HISTORY_START: "2026-01-01",
  HISTORY_END: "2051-01-01"
};

const RAW_CONFIG = window.KG_CONFIG || {};
const CONFIG = { ...BUILT_IN_CONFIG, ...RAW_CONFIG };

// Self-heal when an old cached config.js still contains the setup placeholder.
if (!String(CONFIG.GOOGLE_CLIENT_ID || "").trim() || String(CONFIG.GOOGLE_CLIENT_ID).includes("PASTE")) {
  CONFIG.GOOGLE_CLIENT_ID = BUILT_IN_CONFIG.GOOGLE_CLIENT_ID;
}
if (!String(CONFIG.CALENDAR_ID || "").trim() || String(CONFIG.CALENDAR_ID).includes("PASTE_KG_WORK") || CONFIG.CALENDAR_ID === "primary") {
  CONFIG.CALENDAR_ID = BUILT_IN_CONFIG.CALENDAR_ID;
}
if (!String(CONFIG.GOOGLE_SCOPE || "").trim()) CONFIG.GOOGLE_SCOPE = BUILT_IN_CONFIG.GOOGLE_SCOPE;
const API_BASE = "https://www.googleapis.com/calendar/v3";
const APP_MARKER = "#KGCEILING";
const DATA_HEADER = "[KG CEILING APP DATA / KG 天花应用资料]";

const FALLBACK_GOOGLE_EVENT_COLOURS = [
  { id: "1",  name: "Lavender / 淡紫",  background: "#a4bdfc", foreground: "#1d1d1d" },
  { id: "2",  name: "Sage / 鼠尾草绿", background: "#7ae7bf", foreground: "#1d1d1d" },
  { id: "3",  name: "Grape / 葡萄紫",   background: "#dbadff", foreground: "#1d1d1d" },
  { id: "4",  name: "Flamingo / 粉红",  background: "#ff887c", foreground: "#1d1d1d" },
  { id: "5",  name: "Banana / 香蕉黄",  background: "#fbd75b", foreground: "#1d1d1d" },
  { id: "6",  name: "Tangerine / 橙色", background: "#ffb878", foreground: "#1d1d1d" },
  { id: "7",  name: "Peacock / 蓝绿",   background: "#46d6db", foreground: "#1d1d1d" },
  { id: "8",  name: "Graphite / 灰色",  background: "#e1e1e1", foreground: "#1d1d1d" },
  { id: "9",  name: "Blueberry / 蓝色", background: "#5484ed", foreground: "#ffffff" },
  { id: "10", name: "Basil / 深绿色",   background: "#51b749", foreground: "#ffffff" },
  { id: "11", name: "Tomato / 红色",    background: "#dc2127", foreground: "#ffffff" }
];

const GOOGLE_COLOUR_NAMES = {
  "1": "Lavender / 淡紫",
  "2": "Sage / 鼠尾草绿",
  "3": "Grape / 葡萄紫",
  "4": "Flamingo / 粉红",
  "5": "Banana / 香蕉黄",
  "6": "Tangerine / 橙色",
  "7": "Peacock / 蓝绿",
  "8": "Graphite / 灰色",
  "9": "Blueberry / 蓝色",
  "10": "Basil / 深绿色",
  "11": "Tomato / 红色"
};

let googleEventColours = FALLBACK_GOOGLE_EVENT_COLOURS.map((colour) => ({ ...colour }));
let calendarDefaultColour = {
  id: "default",
  name: "Calendar default / 日历默认",
  background: "#0f766e",
  foreground: "#ffffff"
};

const el = {};
let tokenClient = null;
let accessToken = "";
let tokenExpiresAt = 0;
let events = [];
let monthAnchor = startOfMonth(new Date());
let selectedDate = dateKey(new Date());
let autoRefreshTimer = null;
let toastTimer = null;
let currentModalEvent = null;
let lastAddressSearch = "";
let searchRequestNumber = 0;
let lastFormStartDate = "";
let nativeDragData = null;
let touchDragState = null;
let touchDragGhost = null;
let touchDragTarget = null;
let suppressChipClickUntil = 0;

window.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  bindEvents();
  renderColourPicker("default");
  renderAll();
  loadCachedEvents();
  waitForGoogleIdentity();
  registerServiceWorker();
}

function cacheElements() {
  const ids = [
    "connectionBadge", "connectBtn", "refreshBtn", "welcomeCard", "prevMonthBtn",
    "todayBtn", "nextMonthBtn", "monthTitle", "openGoogleBtn", "settingsBtn",
    "calendarGrid", "selectedDateTitle", "addJobBtn", "whatsAppDayBtn", "syncMessage", "dayJobs",
    "floatingAddBtn", "addressSearchForm", "addressSearchInput", "addressSearchBtn",
    "jobModal", "jobModalTitle", "closeModalBtn", "jobForm", "eventId", "continueGroupId", "addressInput",
    "dateInput", "endDateInput", "startTimeInput", "endTimeInput", "allDayInput", "continueJobInput",
    "continuePeriodsWrap", "continuePeriodsList", "addContinuePeriodBtn", "contactInput",
    "lockInput", "idFirmInput", "idNameInput", "installerNameInput", "amendCeilingInput",
    "amendCeilingDetailInput", "amendPartitionInput", "amendPartitionDetailInput",
    "amendPelmetInput", "amendPelmetDetailInput", "amendTimberOtherInput", "amendTimberOtherDetailInput", "amendRemarkInput",
    "deliveryDateInput", "deliveryMaterialsInput", "deliveryRemarkInput", "billingNumberInput",
    "colourPicker", "deleteJobBtn", "cancelBtn",
    "saveJobBtn", "searchModal", "closeSearchBtn", "historySearchForm",
    "historySearchInput", "historySearchBtn", "historySearchStatus",
    "historySearchResults", "doneSearchBtn", "whatsAppPreviewModal", "whatsAppPreviewTitle",
    "closeWhatsAppPreviewBtn", "whatsAppPreviewText", "clearWhatsAppPreviewBtn",
    "cancelWhatsAppPreviewBtn", "copyWhatsAppPreviewBtn", "settingsModal", "closeSettingsBtn",
    "calendarIdText", "resetCacheBtn", "doneSettingsBtn", "toast"
  ];
  ids.forEach((id) => { el[id] = document.getElementById(id); });
}

function bindEvents() {
  el.connectBtn.addEventListener("click", connectGoogleCalendar);
  el.refreshBtn.addEventListener("click", () => refreshEvents(true));
  el.prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  el.nextMonthBtn.addEventListener("click", () => changeMonth(1));
  el.todayBtn.addEventListener("click", goToday);
  el.openGoogleBtn.addEventListener("click", () => window.open("https://calendar.google.com/calendar/u/0/r", "_blank", "noopener"));
  el.settingsBtn.addEventListener("click", openSettings);
  el.addressSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startAddressSearch(el.addressSearchInput.value);
  });
  el.historySearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startAddressSearch(el.historySearchInput.value);
  });
  el.closeSearchBtn.addEventListener("click", closeSearchModal);
  el.doneSearchBtn.addEventListener("click", closeSearchModal);
  el.searchModal.addEventListener("click", (event) => {
    if (event.target === el.searchModal) closeSearchModal();
  });
  el.addJobBtn.addEventListener("click", () => openJobModal());
  el.whatsAppDayBtn.addEventListener("click", shareSelectedDayToWhatsApp);
  el.floatingAddBtn.addEventListener("click", () => openJobModal());
  el.closeModalBtn.addEventListener("click", closeJobModal);
  el.cancelBtn.addEventListener("click", closeJobModal);
  el.jobForm.addEventListener("submit", saveJob);
  el.deleteJobBtn.addEventListener("click", deleteCurrentJob);
  el.allDayInput.addEventListener("change", updateTimeFieldState);
  el.continueJobInput.addEventListener("change", () => updateContinueJobState(true));
  el.addContinuePeriodBtn.addEventListener("click", () => addContinuePeriodRow());
  el.dateInput.addEventListener("change", handleStartDateChange);
  el.endDateInput.addEventListener("change", handleEndDateChange);
  document.addEventListener("pointermove", handleTouchDragMove, { passive: false });
  document.addEventListener("pointerup", handleTouchDragEnd, { passive: false });
  document.addEventListener("pointercancel", cancelTouchDrag, { passive: false });
  el.closeWhatsAppPreviewBtn.addEventListener("click", closeWhatsAppPreview);
  el.cancelWhatsAppPreviewBtn.addEventListener("click", closeWhatsAppPreview);
  el.clearWhatsAppPreviewBtn.addEventListener("click", () => {
    el.whatsAppPreviewText.value = "";
    el.whatsAppPreviewText.focus();
  });
  el.copyWhatsAppPreviewBtn.addEventListener("click", copyWhatsAppPreviewText);
  el.whatsAppPreviewModal.addEventListener("click", (event) => {
    if (event.target === el.whatsAppPreviewModal) closeWhatsAppPreview();
  });
  el.settingsModal.addEventListener("click", (event) => {
    if (event.target === el.settingsModal) closeSettings();
  });
  el.jobModal.addEventListener("click", (event) => {
    if (event.target === el.jobModal) closeJobModal();
  });
  el.closeSettingsBtn.addEventListener("click", closeSettings);
  el.doneSettingsBtn.addEventListener("click", closeSettings);
  el.resetCacheBtn.addEventListener("click", resetAppCache);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!el.jobModal.hidden) closeJobModal();
    else if (!el.searchModal.hidden) closeSearchModal();
    else if (!el.whatsAppPreviewModal.hidden) closeWhatsAppPreview();
    else if (!el.settingsModal.hidden) closeSettings();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isConnected()) refreshEvents(false);
  });
  window.addEventListener("focus", () => {
    if (isConnected()) refreshEvents(false);
  });
}

function waitForGoogleIdentity(attempt = 0) {
  if (window.google?.accounts?.oauth2) {
    initTokenClient();
    return;
  }
  if (attempt > 80) {
    setSyncMessage("Google sign-in could not load. Check your internet. / 谷歌登录无法加载，请检查网络。", true);
    return;
  }
  setTimeout(() => waitForGoogleIdentity(attempt + 1), 100);
}

function initTokenClient() {
  const clientId = String(CONFIG.GOOGLE_CLIENT_ID || "").trim();
  if (!clientId || clientId.includes("PASTE_")) {
    setSyncMessage("Google Client ID is missing in config.js. / config.js 缺少谷歌客户端 ID。", true);
    el.connectBtn.disabled = true;
    return;
  }

  const calendarId = String(CONFIG.CALENDAR_ID || "").trim();
  if (!calendarId || calendarId.includes("PASTE_KG_WORK")) {
    setSyncMessage("Paste the shared KG Work Calendar ID into config.js first. / 请先把共享 KG Work 日历 ID 粘贴到 config.js。", true);
    el.connectBtn.disabled = true;
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: CONFIG.GOOGLE_SCOPE || "https://www.googleapis.com/auth/calendar.events",
    callback: () => {}
  });
}

function connectGoogleCalendar() {
  if (!tokenClient) {
    showToast("Google sign-in is still loading. / 谷歌登录仍在加载。", true);
    return;
  }

  setConnectionState("busy");
  tokenClient.callback = async (response) => {
    if (response.error) {
      accessToken = "";
      tokenExpiresAt = 0;
      setConnectionState("off");
      setSyncMessage(`Connection failed: ${response.error}. / 连接失败：${response.error}`, true);
      return;
    }

    accessToken = response.access_token || "";
    tokenExpiresAt = Date.now() + (Number(response.expires_in || 3600) * 1000);
    setConnectionState("on");
    el.welcomeCard.hidden = true;
    showToast("Google Calendar connected. / 谷歌日历已连接。", false);
    startAutoRefresh();
    await loadGoogleColourSettings();
    await refreshEvents(true);
  };

  // Empty prompt means Google only asks for account/consent when necessary.
  // 空白 prompt 表示只在必要时要求选择账号或同意权限。
  tokenClient.requestAccessToken({ prompt: "" });
}

function isConnected() {
  return Boolean(accessToken) && Date.now() < tokenExpiresAt;
}

function setConnectionState(state) {
  const connected = state === "on";
  const busy = state === "busy";
  el.connectBtn.disabled = busy;
  el.refreshBtn.disabled = !connected;
  el.addJobBtn.disabled = !connected;
  el.whatsAppDayBtn.disabled = !connected;
  el.floatingAddBtn.disabled = !connected;
  el.addressSearchBtn.disabled = !connected;

  el.connectionBadge.className = "statusBadge";
  if (connected) {
    el.connectionBadge.classList.add("statusOn");
    el.connectionBadge.textContent = "Connected / 已连接";
    el.connectBtn.innerHTML = '<span class="btnIcon" aria-hidden="true">G</span><span>Reconnect if needed<br><small>需要时重新连接</small></span>';
  } else if (busy) {
    el.connectionBadge.classList.add("statusBusy");
    el.connectionBadge.textContent = "Connecting / 连接中";
  } else {
    el.connectionBadge.classList.add("statusOff");
    el.connectionBadge.textContent = "Not connected / 未连接";
    el.connectBtn.innerHTML = '<span class="btnIcon" aria-hidden="true">G</span><span>Connect Google Calendar<br><small>连接谷歌日历</small></span>';
  }
}

function disconnectForExpiredToken() {
  accessToken = "";
  tokenExpiresAt = 0;
  setConnectionState("off");
  stopAutoRefresh();
  setSyncMessage("Google session expired. Click Connect once. / 谷歌连接已过期，请点击连接一次。", true);
  showToast("Please reconnect Google Calendar. / 请重新连接谷歌日历。", true);
}

async function loadGoogleColourSettings() {
  try {
    const [colourData, calendarListData] = await Promise.all([
      apiFetch("/colors"),
      apiFetch("/users/me/calendarList?showHidden=true&minAccessRole=reader")
    ]);

    if (colourData?.event && typeof colourData.event === "object") {
      googleEventColours = Object.entries(colourData.event)
        .map(([id, definition]) => ({
          id: String(id),
          name: GOOGLE_COLOUR_NAMES[String(id)] || `Google colour ${id} / 谷歌颜色 ${id}`,
          background: definition?.background || "#e1e1e1",
          foreground: definition?.foreground || "#1d1d1d"
        }))
        .sort((a, b) => Number(a.id) - Number(b.id));
    }

    const items = Array.isArray(calendarListData?.items) ? calendarListData.items : [];
    const configuredId = String(CONFIG.CALENDAR_ID || "primary");
    const activeCalendar = configuredId === "primary"
      ? items.find((item) => item.primary)
      : items.find((item) => item.id === configuredId);

    if (activeCalendar) {
      const calendarPalette = colourData?.calendar?.[String(activeCalendar.colorId || "")];
      calendarDefaultColour = {
        id: "default",
        name: "Calendar default / 日历默认",
        background: activeCalendar.backgroundColor || calendarPalette?.background || calendarDefaultColour.background,
        foreground: activeCalendar.foregroundColor || calendarPalette?.foreground || calendarDefaultColour.foreground
      };
    }

    renderAll();
  } catch (error) {
    // Keep the official fallback palette if Google colour metadata cannot be loaded.
    console.warn("Google colour palette could not be loaded:", error);
  }
}

async function apiFetch(pathOrUrl, options = {}) {
  if (!isConnected()) {
    disconnectForExpiredToken();
    throw new Error("Google Calendar is not connected / 谷歌日历未连接");
  }

  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    disconnectForExpiredToken();
    throw new Error("Google session expired / 谷歌连接已过期");
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Google API error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function refreshEvents(showSuccess) {
  if (!isConnected()) return;
  setSyncMessage("Syncing with Google Calendar… / 正在与谷歌日历同步……", false);
  el.refreshBtn.disabled = true;

  try {
    const range = visibleCalendarRange();
    const params = new URLSearchParams({
      timeMin: range.start.toISOString(),
      timeMax: range.end.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      showDeleted: "false",
      maxResults: "2500"
    });
    const calendarId = encodeURIComponent(CONFIG.CALENDAR_ID || "primary");
    const data = await apiFetch(`/calendars/${calendarId}/events?${params.toString()}`);
    events = Array.isArray(data.items) ? data.items : [];
    saveCachedEvents();
    renderAll();
    const nowText = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSyncMessage(`Synced at ${nowText}. Changes from Google Calendar are shown here. / 已于 ${nowText} 同步，谷歌日历的更改会显示在这里。`, false);
    if (showSuccess) showToast("Calendar is up to date. / 日历已更新。", false);
  } catch (error) {
    setSyncMessage(`Sync failed: ${error.message} / 同步失败：${error.message}`, true);
  } finally {
    el.refreshBtn.disabled = !isConnected();
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  const seconds = Math.max(30, Number(CONFIG.AUTO_REFRESH_SECONDS || 60));
  autoRefreshTimer = window.setInterval(() => {
    if (!document.hidden && isConnected()) refreshEvents(false);
  }, seconds * 1000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) window.clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
}

function loadCachedEvents() {
  try {
    const cached = JSON.parse(localStorage.getItem("kgCeilingEventsCache") || "[]");
    if (Array.isArray(cached)) {
      events = cached;
      renderAll();
      if (events.length) {
        setSyncMessage("Showing the last saved view. Connect to update it. / 正在显示上次资料，请连接后更新。", false);
      }
    }
  } catch {
    // Ignore damaged local cache.
  }
}

function saveCachedEvents() {
  try {
    localStorage.setItem("kgCeilingEventsCache", JSON.stringify(events));
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

function setSyncMessage(message, isError) {
  el.syncMessage.textContent = message;
  el.syncMessage.classList.toggle("error", Boolean(isError));
}

function renderAll() {
  renderMonthTitle();
  renderCalendar();
  renderSelectedDateTitle();
  renderDayJobs();
}

function renderMonthTitle() {
  const en = monthAnchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const zh = `${monthAnchor.getFullYear()}年${monthAnchor.getMonth() + 1}月`;
  el.monthTitle.textContent = `${en} / ${zh}`;
}

function renderSelectedDateTitle() {
  const date = dateFromKey(selectedDate);
  const en = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const weekdayZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  const zh = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdayZh}`;
  el.selectedDateTitle.textContent = `${en} / ${zh}`;
}

function renderCalendar() {
  el.calendarGrid.innerHTML = "";
  const range = visibleCalendarRange();
  const cursor = new Date(range.start);
  const todayKey = dateKey(new Date());

  for (let i = 0; i < 42; i += 1) {
    const key = dateKey(cursor);
    const cell = document.createElement("div");
    cell.className = "dayCell";
    cell.dataset.date = key;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", cursor.toLocaleDateString());
    if (cursor.getMonth() !== monthAnchor.getMonth()) cell.classList.add("outsideMonth");
    if (key === selectedDate) cell.classList.add("selected");
    if (key === todayKey) cell.classList.add("today");

    const number = document.createElement("span");
    number.className = "dayNumber";
    number.textContent = String(cursor.getDate());
    cell.appendChild(number);

    const stack = document.createElement("div");
    stack.className = "eventStack";
    const dayEvents = eventsForDate(key);
    dayEvents.slice(0, 4).forEach((calendarEvent) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "eventChip";
      chip.dataset.eventId = calendarEvent.id || "";
      chip.dataset.sourceDate = key;
      chip.draggable = isConnected();
      const colour = eventColour(calendarEvent);
      chip.style.background = colour.background;
      chip.style.color = colour.foreground;
      chip.textContent = eventChipLabel(calendarEvent, key);
      chip.title = "Click to edit. Drag to move. / 点击编辑，拖动更改日期。";
      chip.addEventListener("click", (clickEvent) => {
        clickEvent.stopPropagation();
        if (Date.now() < suppressChipClickUntil) return;
        openJobModal(calendarEvent);
      });
      chip.addEventListener("dragstart", (dragEvent) => beginNativeDrag(dragEvent, calendarEvent.id, key));
      chip.addEventListener("dragend", finishNativeDrag);
      chip.addEventListener("pointerdown", (pointerEvent) => beginTouchDrag(pointerEvent, calendarEvent.id, key, chip));
      stack.appendChild(chip);
    });
    if (dayEvents.length > 4) {
      const more = document.createElement("span");
      more.className = "moreEvents";
      more.textContent = `+${dayEvents.length - 4} more / 还有`;
      stack.appendChild(more);
    }
    cell.appendChild(stack);
    cell.addEventListener("click", () => selectDate(key));
    cell.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        selectDate(key);
      }
    });
    cell.addEventListener("dragover", handleCalendarDragOver);
    cell.addEventListener("dragenter", handleCalendarDragEnter);
    cell.addEventListener("dragleave", handleCalendarDragLeave);
    cell.addEventListener("drop", handleCalendarDrop);
    el.calendarGrid.appendChild(cell);
    cursor.setDate(cursor.getDate() + 1);
  }
}

function beginNativeDrag(event, eventId, sourceDate) {
  if (!isConnected() || !eventId) {
    event.preventDefault();
    return;
  }
  nativeDragData = { eventId, sourceDate };
  event.currentTarget.classList.add("dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(nativeDragData));
  }
}

function finishNativeDrag(event) {
  event.currentTarget.classList.remove("dragging");
  nativeDragData = null;
  clearDragHighlights();
}

function handleCalendarDragOver(event) {
  if (!nativeDragData) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function handleCalendarDragEnter(event) {
  if (!nativeDragData) return;
  event.preventDefault();
  event.currentTarget.classList.add("dragOver");
}

function handleCalendarDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove("dragOver");
  }
}

function handleCalendarDrop(event) {
  event.preventDefault();
  const cell = event.currentTarget;
  cell.classList.remove("dragOver");
  let data = nativeDragData;
  if (!data && event.dataTransfer) {
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      data = null;
    }
  }
  if (!data?.eventId || !cell.dataset.date) return;
  moveEventByDrag(data.eventId, data.sourceDate, cell.dataset.date);
}

function beginTouchDrag(event, eventId, sourceDate, chip) {
  if (event.pointerType === "mouse" || !isConnected() || !eventId) return;
  cancelTouchDrag();
  touchDragState = {
    pointerId: event.pointerId,
    eventId,
    sourceDate,
    chip,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    timer: window.setTimeout(() => activateTouchDrag(event.clientX, event.clientY), 420)
  };
}

function activateTouchDrag(x, y) {
  if (!touchDragState) return;
  touchDragState.active = true;
  touchDragState.chip.classList.add("dragging");
  document.body.classList.add("touchDragging");
  touchDragGhost = touchDragState.chip.cloneNode(true);
  touchDragGhost.className = "eventChip touchDragGhost";
  touchDragGhost.removeAttribute("draggable");
  document.body.appendChild(touchDragGhost);
  positionTouchGhost(x, y);
  updateTouchDragTarget(x, y);
  if (navigator.vibrate) navigator.vibrate(35);
}

function handleTouchDragMove(event) {
  if (!touchDragState || event.pointerId !== touchDragState.pointerId) return;
  const distance = Math.hypot(event.clientX - touchDragState.startX, event.clientY - touchDragState.startY);
  if (!touchDragState.active) {
    if (distance > 12) cancelTouchDrag();
    return;
  }
  event.preventDefault();
  positionTouchGhost(event.clientX, event.clientY);
  updateTouchDragTarget(event.clientX, event.clientY);
}

function positionTouchGhost(x, y) {
  if (!touchDragGhost) return;
  touchDragGhost.style.left = `${x + 12}px`;
  touchDragGhost.style.top = `${y + 12}px`;
}

function updateTouchDragTarget(x, y) {
  const node = document.elementFromPoint(x, y);
  const nextTarget = node?.closest?.(".dayCell") || null;
  if (touchDragTarget === nextTarget) return;
  if (touchDragTarget) touchDragTarget.classList.remove("dragOver");
  touchDragTarget = nextTarget;
  if (touchDragTarget) touchDragTarget.classList.add("dragOver");
}

function handleTouchDragEnd(event) {
  if (!touchDragState || event.pointerId !== touchDragState.pointerId) return;
  if (!touchDragState.active) {
    cancelTouchDrag();
    return;
  }
  event.preventDefault();
  const { eventId, sourceDate } = touchDragState;
  const targetDate = touchDragTarget?.dataset?.date || "";
  suppressChipClickUntil = Date.now() + 700;
  cancelTouchDrag();
  if (targetDate) moveEventByDrag(eventId, sourceDate, targetDate);
}

function cancelTouchDrag() {
  if (touchDragState?.timer) window.clearTimeout(touchDragState.timer);
  if (touchDragState?.chip) touchDragState.chip.classList.remove("dragging");
  if (touchDragGhost) touchDragGhost.remove();
  if (touchDragTarget) touchDragTarget.classList.remove("dragOver");
  touchDragState = null;
  touchDragGhost = null;
  touchDragTarget = null;
  document.body.classList.remove("touchDragging");
}

function clearDragHighlights() {
  document.querySelectorAll(".dayCell.dragOver").forEach((cell) => cell.classList.remove("dragOver"));
}

async function moveEventByDrag(eventId, sourceDate, targetDate) {
  if (!isConnected()) {
    disconnectForExpiredToken();
    return;
  }
  const calendarEvent = events.find((item) => item.id === eventId);
  if (!calendarEvent) {
    showToast("Job could not be found. Refresh and try again. / 找不到工作，请刷新后再试。", true);
    return;
  }
  if (!targetDate || sourceDate === targetDate) {
    selectDate(targetDate || sourceDate);
    return;
  }

  const range = eventDateRange(calendarEvent);
  const grabbedOffset = Math.max(0, daysBetweenKeys(range.start, sourceDate));
  const newStartDate = addDaysKey(targetDate, -grabbedOffset);
  const shifted = shiftedEventTimes(calendarEvent, newStartDate);
  const calendarId = encodeURIComponent(CONFIG.CALENDAR_ID || "primary");

  setSyncMessage("Moving job in Google Calendar… / 正在谷歌日历移动工作……", false);
  try {
    await apiFetch(`/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shifted)
    });
    selectedDate = targetDate;
    monthAnchor = startOfMonth(dateFromKey(targetDate));
    showToast("Job moved to the new date. / 工作已移动到新日期。", false);
    await refreshEvents(false);
  } catch (error) {
    showToast(`Move failed: ${error.message} / 移动失败：${error.message}`, true);
    setSyncMessage("Move failed. Refresh and try again. / 移动失败，请刷新后再试。", true);
  }
}

function shiftedEventTimes(event, newStartDate) {
  const range = eventDateRange(event);
  const daySpan = Math.max(0, daysBetweenKeys(range.start, range.end));
  if (event.start?.date) {
    return {
      start: { date: newStartDate },
      end: { date: addDaysKey(newStartDate, daySpan + 1) }
    };
  }

  const originalStart = new Date(event.start?.dateTime);
  const originalEnd = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(originalStart.getTime() + 60 * 60 * 1000);
  const durationMs = Math.max(60 * 1000, originalEnd.getTime() - originalStart.getTime());
  const newStart = localDateTime(newStartDate, timeInputValue(originalStart));
  newStart.setSeconds(originalStart.getSeconds(), originalStart.getMilliseconds());
  const newEnd = new Date(newStart.getTime() + durationMs);
  const start = { dateTime: newStart.toISOString() };
  const end = { dateTime: newEnd.toISOString() };
  if (event.start?.timeZone) start.timeZone = event.start.timeZone;
  if (event.end?.timeZone) end.timeZone = event.end.timeZone;
  return { start, end };
}

function renderDayJobs() {
  el.dayJobs.innerHTML = "";
  const dayEvents = eventsForDate(selectedDate);
  el.whatsAppDayBtn.disabled = !isConnected() || dayEvents.length === 0;
  if (!dayEvents.length) {
    const empty = document.createElement("div");
    empty.className = "emptyState";
    empty.innerHTML = isConnected()
      ? "<strong>No job on this date / 此日期没有工作</strong>Press Add Job to create one. / 点击新增工作建立项目。"
      : "<strong>Connect Google Calendar / 连接谷歌日历</strong>Your jobs will appear here. / 工作会显示在这里。";
    el.dayJobs.appendChild(empty);
    return;
  }

  dayEvents.forEach((event) => {
    const data = parseEventData(event);
    const card = document.createElement("article");
    card.className = "jobCard jobCardAddressOnly";

    const strip = document.createElement("div");
    strip.className = "jobColour";
    strip.style.background = eventColour(event).background;

    const info = document.createElement("div");
    info.className = "jobInfo";
    const title = document.createElement("h3");
    title.textContent = data.address || event.summary || "Untitled job / 未命名工作";
    info.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "jobActions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "miniBtn";
    editBtn.title = "Edit / 编辑";
    editBtn.setAttribute("aria-label", "Edit / 编辑");
    editBtn.innerHTML = "✎ <span>Edit<br><small>编辑</small></span>";
    editBtn.disabled = !isConnected();
    editBtn.addEventListener("click", () => openJobModal(event));

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "miniBtn";
    copyBtn.title = "Copy / 复制";
    copyBtn.setAttribute("aria-label", "Copy / 复制");
    copyBtn.innerHTML = "⧉ <span>Copy<br><small>复制</small></span>";
    copyBtn.disabled = !isConnected();
    copyBtn.addEventListener("click", () => openJobModal(event, true));

    const whatsAppBtn = document.createElement("button");
    whatsAppBtn.type = "button";
    whatsAppBtn.className = "miniBtn miniWhatsAppBtn";
    whatsAppBtn.title = "WhatsApp Copy Site / 复制单个工地";
    whatsAppBtn.setAttribute("aria-label", "WhatsApp Copy Site / 复制单个工地");
    whatsAppBtn.innerHTML = "⧉ <span>WhatsApp Copy<br><small>复制单个工地</small></span>";
    whatsAppBtn.addEventListener("click", () => shareSiteToWhatsApp(event));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "miniBtn miniDeleteBtn";
    deleteBtn.title = "Delete / 删除";
    deleteBtn.setAttribute("aria-label", "Delete / 删除");
    deleteBtn.innerHTML = "🗑 <span>Delete<br><small>删除</small></span>";
    deleteBtn.disabled = !isConnected();
    deleteBtn.addEventListener("click", () => deleteEventFromCard(event));

    actions.append(editBtn, copyBtn, whatsAppBtn, deleteBtn);
    card.append(strip, info, actions);
    el.dayJobs.appendChild(card);
  });
}

function amendmentLabels(data) {
  const labels = [];
  const add = (enabled, label, detail) => {
    const cleanDetail = String(detail || "").trim();
    if (!enabled && !cleanDetail) return;
    labels.push(cleanDetail ? `${label}: ${cleanDetail}` : label);
  };
  add(data.amendCeiling, "Ceiling / 天花", data.amendCeilingDetail);
  add(data.amendPartition, "Partition / 隔墙", data.amendPartitionDetail);
  add(data.amendPelmet, "Pelmet / Box Up / L Box / 窗帘盒 / 包箱 / L Box", data.amendPelmetDetail);
  add(data.amendTimberOther, "Add Timber Support / Other / 加木支撑 / 其他", data.amendTimberOtherDetail);
  return labels;
}

function buildTrackingTags(data) {
  const wrap = document.createElement("div");
  wrap.className = "statusTags";
  const add = (text, className = "") => {
    const tag = document.createElement("span");
    tag.className = `statusTag ${className}`.trim();
    tag.textContent = text;
    wrap.appendChild(tag);
  };
  if (data.continueJob) add(`Continue job${data.continueSequence > 1 ? ` #${data.continueSequence}` : ""} / 继续工作`, "info");
  if (data.deliveryDate || data.deliveryMaterials) {
    add(`Delivery${data.deliveryDate ? `: ${formatDateShort(data.deliveryDate)}` : ""} / 送货`, "good");
  }
  if (data.billingNumber) add(`Billing #${data.billingNumber} / 开单号码`, "good");
  return wrap;
}

function shareSiteToWhatsApp(event) {
  if (!event) return;
  openWhatsAppPreview(buildWhatsAppSiteMessage(event), "Site message / 单个工地信息");
}

function shareSelectedDayToWhatsApp() {
  const dayEvents = eventsForDate(selectedDate);
  if (!dayEvents.length) {
    showToast("No jobs on this date. / 这个日期没有工作。", true);
    return;
  }

  const headingDate = formatDateLongBilingual(selectedDate);
  const blocks = dayEvents.map((event, index) => buildWhatsAppSiteMessage(event, index + 1, true));
  const text = [
    `*KG CEILING DAILY WORK / KG 天花每日工作*`,
    `*Date / 日期:* ${headingDate}`,
    `*Total sites / 工地数量:* ${dayEvents.length}`,
    "",
    blocks.join("\n\n------------------------------\n\n")
  ].join("\n");
  openWhatsAppPreview(text, "Daily message / 当天全部信息");
}

function buildWhatsAppSiteMessage(event, number = 0, compactHeading = false) {
  const data = parseEventData(event);
  const range = eventDateRange(event);
  const lines = [];
  const address = data.address || event.summary || event.location || "No address / 没有地址";

  if (number) lines.push(`*${number}. ${address}*`);
  else {
    lines.push(`*KG CEILING SITE DETAIL / KG 天花工地资料*`);
    lines.push(`*Address / 地址:* ${address}`);
  }

  const dateText = range.start === range.end
    ? formatDateLongBilingual(range.start)
    : `${formatDateLongBilingual(range.start)} → ${formatDateLongBilingual(range.end)}`;
  lines.push(`*Work date / 工作日期:* ${dateText}`);
  lines.push(`*Time / 时间:* ${eventTimeLabel(event)}`);

  if (data.continueJob) {
    lines.push(`*Continue job / 继续工作:* Yes / 是${data.continueSequence > 1 ? ` (#${data.continueSequence})` : ""}`);
  }
  if (data.contact) lines.push(`*ID Name / ID 联系人姓名:* ${data.contact}`);
  if (data.lock) lines.push(`*Lock / 门锁:* ${data.lock}`);
  if (data.idFirm) lines.push(`*ID Firm / ID 公司:* ${data.idFirm}`);
  if (data.idName) {
    lines.push(`*Sales Person / 销售人员:* ${data.idName}`);
    lines.push("");
  }
  if (data.installerName) lines.push(`*Installer / 安装人员:* ${data.installerName}`);

  const amendments = amendmentLabels(data);
  if (amendments.length) {
    lines.push(`*Job Scope / 工作范围:*`);
    amendments.forEach((item) => lines.push(`- ${item}`));
  }
  if (data.amendRemark) {
    lines.push(`*Remark / 备注:* ${data.amendRemark}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function formatDateLongBilingual(key) {
  if (!key) return "-";
  const date = dateFromKey(key);
  const en = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const zh = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  return `${en} / ${zh}`;
}

function openWhatsAppPreview(text, title = "WhatsApp Preview / WhatsApp 预览") {
  const clean = String(text || "").trim();
  if (!clean) return;
  el.whatsAppPreviewTitle.textContent = title;
  el.whatsAppPreviewText.value = clean;
  el.whatsAppPreviewModal.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => {
    el.whatsAppPreviewText.focus();
    el.whatsAppPreviewText.setSelectionRange(0, 0);
  }, 0);
}

function closeWhatsAppPreview() {
  el.whatsAppPreviewModal.hidden = true;
  document.body.style.overflow = "";
}

async function copyWhatsAppPreviewText() {
  const text = String(el.whatsAppPreviewText.value || "");
  if (!text.trim()) {
    showToast("Nothing to copy. / 没有内容可以复制。", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied. Paste it into WhatsApp yourself. / 已复制，请自己粘贴到 WhatsApp。", false);
  } catch {
    el.whatsAppPreviewText.focus();
    el.whatsAppPreviewText.select();
    const copied = document.execCommand && document.execCommand("copy");
    showToast(copied ? "Copied. / 已复制。" : "Select the text and copy it manually. / 请选择文字后手动复制。", !copied);
  }
}

function startAddressSearch(rawTerm) {
  const term = String(rawTerm || "").trim();
  if (!isConnected()) {
    showToast("Connect Google Calendar first. / 请先连接谷歌日历。", true);
    return;
  }
  if (term.length < 2) {
    showToast("Type at least 2 letters or numbers. / 请至少输入两个字或号码。", true);
    return;
  }
  lastAddressSearch = term;
  el.addressSearchInput.value = term;
  el.historySearchInput.value = term;
  openSearchModal();
  searchAddressHistory(term);
}

function openSearchModal() {
  el.searchModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSearchModal() {
  el.searchModal.hidden = true;
  if (el.jobModal.hidden && el.settingsModal.hidden) document.body.style.overflow = "";
}

async function searchAddressHistory(term) {
  const requestNumber = ++searchRequestNumber;
  el.historySearchBtn.disabled = true;
  el.historySearchStatus.classList.remove("error");
  el.historySearchStatus.textContent = `Searching KG Work for “${term}”… / 正在 KG Work 搜索“${term}”……`;
  el.historySearchResults.innerHTML = "";

  try {
    const foundEvents = await fetchAllAddressEvents(term);
    if (requestNumber !== searchRequestNumber) return;
    renderAddressHistory(foundEvents, term);
  } catch (error) {
    if (requestNumber !== searchRequestNumber) return;
    el.historySearchStatus.classList.add("error");
    el.historySearchStatus.textContent = `Search failed: ${error.message} / 搜索失败：${error.message}`;
  } finally {
    if (requestNumber === searchRequestNumber) el.historySearchBtn.disabled = false;
  }
}

async function fetchAllAddressEvents(term) {
  const calendarId = encodeURIComponent(CONFIG.CALENDAR_ID || "primary");
  const startDate = String(CONFIG.HISTORY_START || "2026-01-01");
  const endDate = String(CONFIG.HISTORY_END || "2051-01-01");
  const timeMin = new Date(`${startDate}T00:00:00`).toISOString();
  const timeMax = new Date(`${endDate}T00:00:00`).toISOString();
  const all = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      showDeleted: "false",
      maxResults: "2500",
      q: term
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await apiFetch(`/calendars/${calendarId}/events?${params.toString()}`);
    all.push(...(Array.isArray(data?.items) ? data.items : []));
    pageToken = data?.nextPageToken || "";
  } while (pageToken && all.length < 10000);

  const normalizedTerm = normalizeAddress(term);
  return all.filter((event) => {
    const data = parseEventData(event);
    const addressText = normalizeAddress(`${data.address} ${event.summary || ""} ${event.location || ""}`);
    return addressText.includes(normalizedTerm);
  });
}

function renderAddressHistory(foundEvents, term) {
  el.historySearchResults.innerHTML = "";
  if (!foundEvents.length) {
    el.historySearchStatus.textContent = `No matching address found for “${term}”. / 找不到“${term}”的地址记录。`;
    const empty = document.createElement("div");
    empty.className = "historyEmpty";
    empty.innerHTML = "<strong>No address history / 没有地址记录</strong><br>Try a shorter part of the address. / 请尝试输入较短的地址。";
    el.historySearchResults.appendChild(empty);
    return;
  }

  const groups = new Map();
  foundEvents.forEach((event) => {
    const data = parseEventData(event);
    const address = data.address || event.summary || event.location || "Untitled job / 未命名工作";
    const key = normalizeAddress(address);
    if (!groups.has(key)) groups.set(key, { address, events: [] });
    groups.get(key).events.push(event);
  });

  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    const newestA = Math.max(...a.events.map(eventStartMs));
    const newestB = Math.max(...b.events.map(eventStartMs));
    return newestB - newestA;
  });

  el.historySearchStatus.textContent = `${foundEvents.length} record(s), ${sortedGroups.length} address(es) found. / 找到 ${foundEvents.length} 条记录、${sortedGroups.length} 个地址。`;
  sortedGroups.forEach((group) => el.historySearchResults.appendChild(buildHistoryGroup(group)));
}

function buildHistoryGroup(group) {
  const sorted = [...group.events].sort((a, b) => eventStartMs(b) - eventStartMs(a));
  const records = sorted.map((event) => ({ event, data: parseEventData(event) }));
  const workDates = uniqueDateValues(records.flatMap(({ event }) => eventDateKeys(event)));
  const deliveries = records
    .filter(({ data }) => data.deliveryDate || data.deliveryMaterials)
    .map(({ data, event }) => ({ date: data.deliveryDate || eventDateKey(event), materials: data.deliveryMaterials, remark: data.deliveryRemark }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const billingNumbers = Array.from(new Set(records.map(({ data }) => data.billingNumber).filter(Boolean)));
  const latestId = records.find(({ data }) => data.idFirm || data.contact || data.idName)?.data || {};
  const installerNames = Array.from(new Set(records.map(({ data }) => data.installerName).filter(Boolean)));
  const amendments = Array.from(new Set(records.flatMap(({ data }) => amendmentLabels(data))));
  const continueRecords = records.filter(({ data }) => data.continueJob).length;

  const groupEl = document.createElement("section");
  groupEl.className = "historyGroup";

  const head = document.createElement("div");
  head.className = "historyGroupHead";
  const headText = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = group.address;
  const subtitle = document.createElement("p");
  subtitle.textContent = `${records.length} job record(s) / ${records.length} 条工作记录`;
  headText.append(title, subtitle);
  head.appendChild(headText);

  const deliveryText = deliveries.length
    ? deliveries.map((item) => `${item.date ? formatDateShort(item.date) : "No date / 无日期"}: ${item.materials || "Material not entered / 未填写材料"}${item.remark ? ` — ${item.remark}` : ""}`).join("\n")
    : "None / 无";

  const summary = document.createElement("div");
  summary.className = "historySummaryGrid";
  summary.append(
    makeHistorySummary("Work dates / 工作日期", formatDateList(workDates)),
    makeHistorySummary("Installer / 安装人员", installerNames.length ? installerNames.join(", ") : "None / 无"),
    makeHistorySummary("Job Scope / 工作范围", amendments.length ? amendments.join(", ") : "None / 无"),
    makeHistorySummary("Deliver / 送货", deliveryText),
    makeHistorySummary("Billing number / 开单号码", billingNumbers.length ? billingNumbers.join(", ") : "None / 无"),
    makeHistorySummary("ID details / ID 资料", [
      `Firm / 公司: ${latestId.idFirm || "None / 无"}`,
      `ID Name / ID 联系人姓名: ${latestId.contact || "None / 无"}`,
      `Sales Person / 销售人员: ${latestId.idName || "None / 无"}`
    ].join("\n")),
    makeHistorySummary("Continue job / 继续工作", continueRecords ? `${continueRecords} continuing period record(s) / ${continueRecords} 条继续工作记录` : "No / 否")
  );

  const list = document.createElement("div");
  list.className = "historyEventList";
  records.forEach(({ event, data }) => list.appendChild(buildHistoryEventRow(event, data)));

  groupEl.append(head, summary, list);
  return groupEl;
}

function makeHistorySummary(label, value) {
  const item = document.createElement("div");
  item.className = "historySummaryItem";
  const strong = document.createElement("strong");
  strong.textContent = label;
  const span = document.createElement("span");
  span.textContent = value || "None recorded / 没有记录";
  item.append(strong, span);
  return item;
}

function buildHistoryEventRow(event, data) {
  const row = document.createElement("div");
  row.className = "historyEventRow";

  const dateWrap = document.createElement("div");
  dateWrap.className = "historyEventDate";
  dateWrap.textContent = formatEventDateRangeBilingual(event);
  const time = document.createElement("small");
  time.textContent = eventTimeLabel(event);
  dateWrap.appendChild(time);

  const details = document.createElement("div");
  details.className = "historyEventDetails";
  const tags = buildTrackingTags(data);
  if (tags.childElementCount) details.appendChild(tags);
  const lines = [];
  if (data.installerName) lines.push(`Installer / 安装人员: ${data.installerName}`);
  const amendments = amendmentLabels(data);
  if (amendments.length) lines.push(`Job Scope / 工作范围: ${amendments.join(", ")}`);
  if (data.amendRemark) lines.push(`Remark / 备注: ${data.amendRemark}`);
  if (data.deliveryMaterials) lines.push(`Delivery material / 送货材料: ${data.deliveryMaterials}`);
  if (data.deliveryRemark) lines.push(`Delivery remark / 送货备注: ${data.deliveryRemark}`);
  if (data.billingNumber) lines.push(`Billing no. / 开单号码: ${data.billingNumber}`);
  if (data.idFirm) lines.push(`ID Firm / ID 公司: ${data.idFirm}`);
  if (data.contact) lines.push(`ID Name / ID 联系人姓名: ${data.contact}`);
  if (data.idName) lines.push(`Sales Person / 销售人员: ${data.idName}`);
  if (lines.length) {
    const p = document.createElement("p");
    p.textContent = lines.join(" • ");
    details.appendChild(p);
  }

  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "btn btnSecondary historyEditBtn";
  edit.textContent = "Edit / 编辑";
  edit.addEventListener("click", () => editEventFromHistory(event));

  row.append(dateWrap, details, edit);
  return row;
}

async function editEventFromHistory(event) {
  closeSearchModal();
  const key = eventDateKey(event);
  selectedDate = key;
  monthAnchor = startOfMonth(dateFromKey(key));
  renderAll();
  showToast("Loading this job date… / 正在加载此工作日期……", false);
  await refreshEvents(false);
  const freshEvent = events.find((item) => item.id === event.id) || event;
  openJobModal(freshEvent);
}

function normalizeAddress(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function uniqueDateValues(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)));
}

function formatDateList(values) {
  if (!values.length) return "None recorded / 没有记录";
  const shown = values.slice(0, 12).map(formatDateBilingual);
  if (values.length > 12) shown.push(`+${values.length - 12} more / 另外 ${values.length - 12} 条`);
  return shown.join(", ");
}

function formatDeliveryList(deliveries) {
  if (!deliveries.length) return "None recorded / 没有记录";
  const shown = deliveries.slice(0, 12).map((entry) => {
    const materials = entry.materials ? ` — ${entry.materials}` : "";
    return `${formatDateBilingual(entry.date)}${materials}`;
  });
  if (deliveries.length > 12) shown.push(`+${deliveries.length - 12} more / 另外 ${deliveries.length - 12} 条`);
  return shown.join("\n");
}

function formatDateShort(value) {
  const date = dateFromKey(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateBilingual(value) {
  if (!value) return "Not set / 未设置";
  const date = dateFromKey(value);
  if (Number.isNaN(date.getTime())) return value;
  const en = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const zh = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  return `${en} / ${zh}`;
}

function selectDate(key) {
  selectedDate = key;
  const chosen = dateFromKey(key);
  if (chosen.getMonth() !== monthAnchor.getMonth() || chosen.getFullYear() !== monthAnchor.getFullYear()) {
    monthAnchor = startOfMonth(chosen);
    if (isConnected()) refreshEvents(false);
  }
  renderAll();
}

function changeMonth(delta) {
  monthAnchor = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + delta, 1);
  selectedDate = dateKey(monthAnchor);
  renderAll();
  if (isConnected()) refreshEvents(false);
}

function goToday() {
  const today = new Date();
  monthAnchor = startOfMonth(today);
  selectedDate = dateKey(today);
  renderAll();
  if (isConnected()) refreshEvents(false);
}

function visibleCalendarRange() {
  const first = startOfMonth(monthAnchor);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 42);
  return { start, end };
}

function eventsForDate(key) {
  return events
    .filter((event) => eventIncludesDate(event, key))
    .sort(compareEvents);
}

function compareEvents(a, b) {
  const aAllDay = Boolean(a.start?.date);
  const bAllDay = Boolean(b.start?.date);
  if (aAllDay !== bAllDay) return aAllDay ? 1 : -1;
  return eventStartMs(a) - eventStartMs(b);
}

function eventStartMs(event) {
  if (event.start?.dateTime) return new Date(event.start.dateTime).getTime();
  if (event.start?.date) return dateFromKey(event.start.date).getTime();
  return Number.MAX_SAFE_INTEGER;
}

function eventDateRange(event) {
  if (event.start?.date) {
    const start = event.start.date;
    const exclusiveEnd = event.end?.date || addDaysKey(start, 1);
    let end = addDaysKey(exclusiveEnd, -1);
    if (end < start) end = start;
    return { start, end };
  }
  if (event.start?.dateTime) {
    const startDateTime = new Date(event.start.dateTime);
    const start = dateKey(startDateTime);
    let end = start;
    if (event.end?.dateTime) {
      const endDateTime = new Date(event.end.dateTime);
      end = dateKey(endDateTime);
      const endsAtMidnight = endDateTime.getHours() === 0
        && endDateTime.getMinutes() === 0
        && endDateTime.getSeconds() === 0
        && endDateTime.getMilliseconds() === 0;
      if (endsAtMidnight && endDateTime > startDateTime && end > start) end = addDaysKey(end, -1);
    }
    return { start, end: end < start ? start : end };
  }
  return { start: "", end: "" };
}

function eventDateKeys(event) {
  const range = eventDateRange(event);
  if (!range.start) return [];
  const keys = [];
  const maxDays = 3660;
  for (let key = range.start, count = 0; key <= range.end && count < maxDays; key = addDaysKey(key, 1), count += 1) {
    keys.push(key);
  }
  return keys;
}

function eventIncludesDate(event, key) {
  const range = eventDateRange(event);
  return Boolean(range.start) && key >= range.start && key <= range.end;
}

function eventDateKey(event) {
  return eventDateRange(event).start;
}

function eventChipLabel(event, shownDate = "") {
  const data = parseEventData(event);
  const title = data.address || event.summary || "Job / 工作";
  const range = eventDateRange(event);
  const multiDay = range.start && range.start !== range.end;
  if (event.start?.date) return multiDay ? `↔ ${title}` : title;
  const startDate = new Date(event.start.dateTime);
  const time = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  if (multiDay && shownDate && shownDate !== range.start) return `↔ ${title}`;
  return `${time} ${multiDay ? "↔ " : ""}${title}`;
}

function eventTimeLabel(event) {
  const range = eventDateRange(event);
  const multiDay = range.start && range.start !== range.end;
  if (event.start?.date) {
    return multiDay
      ? `${formatDateShort(range.start)}–${formatDateShort(range.end)} • All day / 全天`
      : "All day / 全天";
  }
  if (!event.start?.dateTime) return "Time not set / 未设时间";
  const startDateTime = new Date(event.start.dateTime);
  const start = startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const endDateTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
  const end = endDateTime
    ? endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";
  if (multiDay && endDateTime) {
    return `${formatDateShort(range.start)} ${start} – ${formatDateShort(range.end)} ${end}`;
  }
  return end ? `${start}–${end}` : start;
}

function formatEventDateRangeBilingual(event) {
  const range = eventDateRange(event);
  if (!range.start) return "Not set / 未设置";
  if (range.start === range.end) return formatDateBilingual(range.start);
  return `${formatDateBilingual(range.start)} → ${formatDateBilingual(range.end)}`;
}

function eventColour(event) {
  if (!event.colorId) return calendarDefaultColour;
  return googleEventColours.find((item) => item.id === String(event.colorId)) || calendarDefaultColour;
}

function openJobModal(event = null, asCopy = false) {
  if (!isConnected()) {
    showToast("Connect Google Calendar first. / 请先连接谷歌日历。", true);
    return;
  }

  currentModalEvent = event;
  resetJobForm();
  if (event) fillJobForm(event, asCopy);
  else {
    el.dateInput.value = selectedDate;
    el.endDateInput.value = selectedDate;
    lastFormStartDate = selectedDate;
      renderColourPicker("default");
  }

  el.eventId.value = event && !asCopy ? event.id : "";
  el.jobModalTitle.textContent = event
    ? (asCopy ? "Copy Job / 复制工作" : "Edit Job / 编辑工作")
    : "Add Job / 新增工作";
  el.deleteJobBtn.hidden = !(event && !asCopy);
  el.jobModal.hidden = false;
  document.body.style.overflow = "hidden";
  updateTimeFieldState();
  updateContinueJobState(false);
  setTimeout(() => el.addressInput.focus(), 80);
}

function closeJobModal() {
  el.jobModal.hidden = true;
  if (el.searchModal.hidden && el.settingsModal.hidden) document.body.style.overflow = "";
  currentModalEvent = null;
}

function resetJobForm() {
  el.jobForm.reset();
  el.eventId.value = "";
  el.continueGroupId.value = "";
  el.dateInput.value = selectedDate;
  el.endDateInput.value = selectedDate;
  lastFormStartDate = selectedDate;
  el.startTimeInput.value = "08:00";
  el.endTimeInput.value = "10:00";
  el.allDayInput.checked = false;
  el.continueJobInput.checked = false;
  el.continuePeriodsList.innerHTML = "";
  el.idFirmInput.value = "";
  el.idNameInput.value = "";
  el.installerNameInput.value = "";
  el.amendCeilingInput.checked = false;
  el.amendCeilingDetailInput.value = "";
  el.amendPartitionInput.checked = false;
  el.amendPartitionDetailInput.value = "";
  el.amendPelmetInput.checked = false;
  el.amendPelmetDetailInput.value = "";
  el.amendTimberOtherInput.checked = false;
  el.amendTimberOtherDetailInput.value = "";
  el.amendRemarkInput.value = "";
  el.deliveryDateInput.value = "";
  el.deliveryMaterialsInput.value = "";
  el.deliveryRemarkInput.value = "";
  el.billingNumberInput.value = "";
  renderColourPicker("default");
  el.saveJobBtn.disabled = false;
  el.saveJobBtn.innerHTML = "Save to Google Calendar<br><small>保存到谷歌日历</small>";
}

function fillJobForm(event, asCopy) {
  const data = parseEventData(event);
  el.addressInput.value = data.address || event.summary || "";
  el.contactInput.value = data.contact;
  el.lockInput.value = data.lock;
  el.idFirmInput.value = data.idFirm;
  el.idNameInput.value = data.idName;
  el.installerNameInput.value = data.installerName;
  el.amendCeilingInput.checked = data.amendCeiling;
  el.amendCeilingDetailInput.value = data.amendCeilingDetail || "";
  el.amendPartitionInput.checked = data.amendPartition;
  el.amendPartitionDetailInput.value = data.amendPartitionDetail || "";
  el.amendPelmetInput.checked = data.amendPelmet;
  el.amendPelmetDetailInput.value = data.amendPelmetDetail || "";
  el.amendTimberOtherInput.checked = data.amendTimberOther;
  el.amendTimberOtherDetailInput.value = data.amendTimberOtherDetail || "";
  el.amendRemarkInput.value = data.amendRemark;
  el.deliveryDateInput.value = data.deliveryDate;
  el.deliveryMaterialsInput.value = data.deliveryMaterials;
  el.deliveryRemarkInput.value = data.deliveryRemark;
  el.billingNumberInput.value = data.billingNumber;
  el.continueJobInput.checked = data.continueJob;
  el.continueGroupId.value = data.continueGroupId;
  el.continuePeriodsList.innerHTML = "";
  const originalRange = eventDateRange(event);
  const originalDaySpan = Math.max(0, daysBetweenKeys(originalRange.start, originalRange.end));
  const formStartDate = asCopy ? selectedDate : originalRange.start;
  el.dateInput.value = formStartDate;
  el.endDateInput.value = asCopy ? addDaysKey(formStartDate, originalDaySpan) : originalRange.end;
  lastFormStartDate = formStartDate;
  if (asCopy) {
    el.deliveryDateInput.value = "";
    el.deliveryMaterialsInput.value = "";
    el.deliveryRemarkInput.value = "";
    el.billingNumberInput.value = "";
    el.continueJobInput.checked = false;
    el.continueGroupId.value = "";
    el.continuePeriodsList.innerHTML = "";
  }

  const allDay = Boolean(event.start?.date);
  el.allDayInput.checked = allDay;
  if (!allDay && event.start?.dateTime) {
    el.startTimeInput.value = timeInputValue(new Date(event.start.dateTime));
    if (event.end?.dateTime) el.endTimeInput.value = timeInputValue(new Date(event.end.dateTime));
  }
  renderColourPicker(String(event.colorId || "default"));
}

function handleStartDateChange() {
  const nextStart = el.dateInput.value;
  if (!nextStart) return;
  const currentEnd = el.endDateInput.value || nextStart;
  if (lastFormStartDate && currentEnd >= lastFormStartDate) {
    const durationDays = Math.max(0, daysBetweenKeys(lastFormStartDate, currentEnd));
    el.endDateInput.value = addDaysKey(nextStart, durationDays);
  } else if (!el.endDateInput.value || el.endDateInput.value < nextStart) {
    el.endDateInput.value = nextStart;
  }
  lastFormStartDate = nextStart;
}

function handleEndDateChange() {
  const start = el.dateInput.value;
  const end = el.endDateInput.value;
  if (start && end && end < start) {
    el.endDateInput.value = start;
    showToast("End date cannot be before start date. / 结束日期不能早于开始日期。", true);
  }
}

function updateTimeFieldState() {
  const disabled = el.allDayInput.checked;
  el.startTimeInput.disabled = disabled;
  el.endTimeInput.disabled = disabled;
  document.querySelectorAll(".timeField").forEach((node) => node.style.opacity = disabled ? ".52" : "1");
}


function updateContinueJobState(addStarterRow) {
  const enabled = el.continueJobInput.checked;
  el.continuePeriodsWrap.hidden = !enabled;
  if (enabled && addStarterRow && !el.continuePeriodsList.children.length) addContinuePeriodRow();
  if (!enabled) el.continuePeriodsList.innerHTML = "";
}

function addContinuePeriodRow(startValue = "", endValue = "") {
  el.continueJobInput.checked = true;
  el.continuePeriodsWrap.hidden = false;

  const row = document.createElement("div");
  row.className = "continuePeriodRow";

  const startLabel = document.createElement("label");
  startLabel.className = "field";
  const startText = document.createElement("span");
  startText.textContent = "Continue start / 继续开始";
  const start = document.createElement("input");
  start.type = "date";
  start.className = "continueStart";
  start.required = true;
  start.value = startValue || suggestNextContinueDate();
  startLabel.append(startText, start);

  const endLabel = document.createElement("label");
  endLabel.className = "field";
  const endText = document.createElement("span");
  endText.textContent = "Continue end / 继续结束";
  const end = document.createElement("input");
  end.type = "date";
  end.className = "continueEnd";
  end.required = true;
  end.value = endValue || start.value;
  endLabel.append(endText, end);

  start.addEventListener("change", () => {
    if (!end.value || end.value < start.value) end.value = start.value;
    updateAssignmentWarnings();
  });
  end.addEventListener("change", () => {
    if (start.value && end.value < start.value) {
      end.value = start.value;
      showToast("Continue end date cannot be before start date. / 继续工作的结束日期不能早于开始日期。", true);
    }
    updateAssignmentWarnings();
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn btnDanger btnSmall continueRemoveBtn";
  remove.textContent = "Remove / 删除";
  remove.addEventListener("click", () => {
    row.remove();
    updateAssignmentWarnings();
  });

  row.append(startLabel, endLabel, remove);
  el.continuePeriodsList.appendChild(row);
  updateAssignmentWarnings();
}

function suggestNextContinueDate() {
  const rows = Array.from(el.continuePeriodsList.querySelectorAll(".continuePeriodRow"));
  if (rows.length) {
    const lastEnd = rows[rows.length - 1].querySelector(".continueEnd")?.value;
    if (lastEnd) return addDaysKey(lastEnd, 1);
  }
  const mainEnd = el.endDateInput.value || el.dateInput.value || selectedDate;
  return mainEnd ? addDaysKey(mainEnd, 1) : selectedDate;
}

function collectContinuePeriods() {
  if (!el.continueJobInput.checked) return [];
  return Array.from(el.continuePeriodsList.querySelectorAll(".continuePeriodRow")).map((row) => ({
    start: row.querySelector(".continueStart")?.value || "",
    end: row.querySelector(".continueEnd")?.value || ""
  })).filter((period) => period.start || period.end);
}

function createContinueGroupId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `kg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function continuationData(baseData, period, sequence) {
  return {
    ...baseData,
    date: period.start,
    endDate: period.end || period.start,
    continueJob: true,
    continueSequence: sequence,
    deliveryDate: "",
    deliveryMaterials: "",
    deliveryRemark: "",
    billingNumber: ""
  };
}

function renderPeopleLists() {
  // Installer is entered as free text in the simplified form.
}

function updateAssignmentWarnings() {
  // Worker/foreman assignment warnings were removed from the simplified form.
}

function renderColourPicker(selectedId) {
  el.colourPicker.innerHTML = "";
  const choices = [calendarDefaultColour, ...googleEventColours];
  choices.forEach((colour) => {
    const label = document.createElement("label");
    label.className = "colourChoice";
    if (colour.id === selectedId) label.classList.add("selected");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "jobColour";
    input.value = colour.id;
    input.checked = colour.id === selectedId;
    input.addEventListener("change", () => {
      el.colourPicker.querySelectorAll(".colourChoice").forEach((node) => node.classList.remove("selected"));
      label.classList.add("selected");
    });
    const dot = document.createElement("span");
    dot.className = "colourDot";
    dot.style.background = colour.background;
    dot.style.color = colour.foreground;
    const text = document.createElement("span");
    text.textContent = colour.name;
    label.append(input, dot, text);
    el.colourPicker.appendChild(label);
  });
}

async function saveJob(event) {
  event.preventDefault();
  if (!isConnected()) {
    disconnectForExpiredToken();
    return;
  }

  const formData = collectJobForm();
  if (!formData.address) {
    showToast("Please enter the address. / 请输入地址。", true);
    el.addressInput.focus();
    return;
  }

  try {
    validateContinuePeriods(formData);
    if (formData.continueJob && !formData.continueGroupId) formData.continueGroupId = createContinueGroupId();
    if (formData.continuePeriods.length) formData.continueJob = true;
  } catch (error) {
    showToast(error.message, true);
    return;
  }

  let calendarEvent;
  try {
    calendarEvent = buildCalendarEvent(formData);
  } catch (error) {
    showToast(error.message, true);
    return;
  }

  el.saveJobBtn.disabled = true;
  el.saveJobBtn.innerHTML = "Saving…<br><small>保存中……</small>";
  const calendarId = encodeURIComponent(CONFIG.CALENDAR_ID || "primary");
  const eventId = el.eventId.value;
  if (eventId && formData.colourId === "default") {
    calendarEvent.colorId = null;
  }

  let extraCreated = 0;
  try {
    if (eventId) {
      await apiFetch(`/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendarEvent)
      });
    } else {
      await apiFetch(`/calendars/${calendarId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendarEvent)
      });
    }

    if (formData.continueJob && formData.continuePeriods.length) {
      for (let index = 0; index < formData.continuePeriods.length; index += 1) {
        const continuation = continuationData(formData, formData.continuePeriods[index], index + 2);
        const continuationEvent = buildCalendarEvent(continuation);
        await apiFetch(`/calendars/${calendarId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(continuationEvent)
        });
        extraCreated += 1;
      }
    }

    const message = extraCreated
      ? `Saved with ${extraCreated} continuation period(s). / 已保存，并新增 ${extraCreated} 个继续工作时段。`
      : (eventId ? "Job updated in both calendars. / 工作已在两边更新。" : "Job saved to Google Calendar. / 工作已保存到谷歌日历。");
    showToast(message, false);
    selectedDate = formData.date;
    monthAnchor = startOfMonth(dateFromKey(formData.date));
    closeJobModal();
    await refreshEvents(false);
  } catch (error) {
    const partial = extraCreated ? ` Some continuation periods were already created (${extraCreated}). / 已建立 ${extraCreated} 个继续工作时段。` : "";
    showToast(`Save failed: ${error.message}.${partial} / 保存失败：${error.message}`, true);
  } finally {
    el.saveJobBtn.disabled = false;
    el.saveJobBtn.innerHTML = "Save to Google Calendar<br><small>保存到谷歌日历</small>";
  }
}

function validateContinuePeriods(data) {
  const periods = data.continuePeriods || [];
  let previousEnd = data.endDate || data.date;
  for (let index = 0; index < periods.length; index += 1) {
    const period = periods[index];
    if (!period.start || !period.end) {
      throw new Error("Please complete every continue-work date. / 请填写所有继续工作的日期。 ");
    }
    if (period.end < period.start) {
      throw new Error("A continue-work end date cannot be before its start date. / 继续工作的结束日期不能早于开始日期。 ");
    }
    if (period.start <= previousEnd) {
      throw new Error("Continue-work periods must start after the previous work period. / 继续工作时段必须在上一个工作时段结束后开始。 ");
    }
    previousEnd = period.end;
  }
}

function collectJobForm() {
  return {
    address: el.addressInput.value.trim(),
    date: el.dateInput.value,
    endDate: el.endDateInput.value || el.dateInput.value,
    startTime: el.startTimeInput.value,
    endTime: el.endTimeInput.value,
    allDay: el.allDayInput.checked,
    contact: el.contactInput.value.trim(),
    lock: el.lockInput.value.trim(),
    idFirm: el.idFirmInput.value.trim(),
    idName: el.idNameInput.value.trim(),
    installerName: el.installerNameInput.value.trim(),
    amendCeiling: el.amendCeilingInput.checked || Boolean(el.amendCeilingDetailInput.value.trim()),
    amendCeilingDetail: el.amendCeilingDetailInput.value.trim(),
    amendPartition: el.amendPartitionInput.checked || Boolean(el.amendPartitionDetailInput.value.trim()),
    amendPartitionDetail: el.amendPartitionDetailInput.value.trim(),
    amendPelmet: el.amendPelmetInput.checked || Boolean(el.amendPelmetDetailInput.value.trim()),
    amendPelmetDetail: el.amendPelmetDetailInput.value.trim(),
    amendTimberOther: el.amendTimberOtherInput.checked || Boolean(el.amendTimberOtherDetailInput.value.trim()),
    amendTimberOtherDetail: el.amendTimberOtherDetailInput.value.trim(),
    amendRemark: el.amendRemarkInput.value.trim(),
    deliveryDate: el.deliveryDateInput.value,
    deliveryMaterials: el.deliveryMaterialsInput.value.trim(),
    deliveryRemark: el.deliveryRemarkInput.value.trim(),
    billingNumber: el.billingNumberInput.value.trim(),
    continueJob: el.continueJobInput.checked,
    continueGroupId: el.continueGroupId.value.trim(),
    continueSequence: (el.eventId.value && currentModalEvent) ? parseEventData(currentModalEvent).continueSequence : 1,
    continuePeriods: collectContinuePeriods(),
    colourId: el.colourPicker.querySelector('input[name="jobColour"]:checked')?.value || "default"
  };
}

function checkedValues(container) {
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
}

function buildCalendarEvent(data) {
  if (!data.date) throw new Error("Please choose a date. / 请选择日期。");
  const resource = {
    summary: data.address,
    description: buildDescription(data),
    location: data.address,
    extendedProperties: {
      private: {
        kgCeilingApp: "1",
        kgCeilingVersion: "1.6.2",
        ...(data.continueJob && data.continueGroupId ? {
          kgContinueJob: "1",
          kgContinueGroup: data.continueGroupId,
          kgContinueSequence: String(data.continueSequence || 1)
        } : {})
      }
    }
  };

  if (data.colourId && data.colourId !== "default") {
    resource.colorId = data.colourId;
  }

  const endDate = data.endDate || data.date;
  if (endDate < data.date) throw new Error("End date cannot be before start date. / 结束日期不能早于开始日期。");

  if (data.allDay) {
    resource.start = { date: data.date };
    resource.end = { date: addDaysKey(endDate, 1) };
  } else {
    if (!data.startTime || !data.endTime) throw new Error("Please enter start and end time. / 请输入开始和结束时间。");
    const start = localDateTime(data.date, data.startTime);
    const end = localDateTime(endDate, data.endTime);
    if (end <= start) throw new Error("The ending date and time must be after the starting date and time. / 结束日期和时间必须迟于开始日期和时间。");
    resource.start = { dateTime: start.toISOString() };
    resource.end = { dateTime: end.toISOString() };
  }
  return resource;
}

function buildDescription(data) {
  const yesNo = (value) => value ? "Yes / 是" : "No / 否";
  const lines = [
    DATA_HEADER,
    `Address / 地址: ${encodeField(data.address)}`,
    `ID Name / ID 联系人姓名: ${encodeField(data.contact)}`,
    `Lock No / 门锁号码: ${encodeField(data.lock)}`,
    `ID Firm / ID 公司: ${encodeField(data.idFirm)}`,
    `Sales Person / 销售人员: ${encodeField(data.idName)}`,
    `Installer Name / 安装人员姓名: ${encodeField(data.installerName)}`,
    `Continue Job / 继续工作: ${yesNo(data.continueJob)}`,
    `Continue Group ID: ${data.continueGroupId || ""}`,
    `Continue Sequence / 继续工作时段: ${data.continueSequence || 1}`,
    `Amend Ceiling / 修改天花: ${yesNo(data.amendCeiling)}`,
    `Amend Ceiling Detail / 天花修改详情: ${encodeField(data.amendCeilingDetail)}`,
    `Amend Partition / 修改隔墙: ${yesNo(data.amendPartition)}`,
    `Amend Partition Detail / 隔墙修改详情: ${encodeField(data.amendPartitionDetail)}`,
    `Amend Pelmet Box LBox / 修改窗帘盒包箱LBox: ${yesNo(data.amendPelmet)}`,
    `Amend Pelmet Detail / 窗帘盒包箱LBox修改详情: ${encodeField(data.amendPelmetDetail)}`,
    `Amend Timber Other / 加木支撑其他: ${yesNo(data.amendTimberOther)}`,
    `Amend Timber Other Detail / 木支撑其他修改详情: ${encodeField(data.amendTimberOtherDetail)}`,
    `Amend Remark / 修改备注: ${encodeField(data.amendRemark)}`,
    `Delivery Date / 送货日期: ${data.deliveryDate || ""}`,
    `Delivery Materials / 送货材料: ${encodeField(data.deliveryMaterials)}`,
    `Delivery Remark / 送货备注: ${encodeField(data.deliveryRemark)}`,
    `Billing Number / 开单号码: ${encodeField(data.billingNumber)}`,
    APP_MARKER
  ];
  return lines.join("\n");
}

function encodeField(value) {
  return String(value || "").replace(/\r?\n/g, "\\n");
}

function decodeField(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

function parseEventData(event) {
  const description = String(event.description || "");
  const data = {
    address: event.summary || event.location || "",
    contact: "",
    lock: "",
    idFirm: "",
    idName: "",
    installerName: "",
    continueJob: false,
    continueGroupId: "",
    continueSequence: 1,
    amendCeiling: false,
    amendCeilingDetail: "",
    amendPartition: false,
    amendPartitionDetail: "",
    amendPelmet: false,
    amendPelmetDetail: "",
    amendTimberOther: false,
    amendTimberOtherDetail: "",
    amendRemark: "",
    deliveryDate: "",
    deliveryMaterials: "",
    deliveryRemark: "",
    billingNumber: "",
    // Legacy values are kept only so old calendar records still open safely.
    idPhone: "",
    scope: "",
    remove: "",
    keep: "",
    protect: "",
    disposal: "",
    hoardingDone: false,
    hoardingDoneDate: "",
    hoardingRemoveRequired: false,
    hoardingRemoveDate: "",
    deliverySent: false,
    billed: false,
    billedDate: "",
    foremen: [],
    workers: [],
    notes: ""
  };

  if (!description.includes(DATA_HEADER) && !description.includes(APP_MARKER)) {
    data.amendRemark = description.trim();
    return data;
  }

  const map = new Map();
  description.split(/\r?\n/).forEach((line) => {
    const index = line.indexOf(":");
    if (index < 0) return;
    map.set(line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim());
  });

  const get = (...keys) => {
    for (const key of keys) {
      const value = map.get(key.toLowerCase());
      if (value !== undefined) return value;
    }
    return "";
  };

  data.address = decodeField(get("Address / 地址", "Address")) || data.address;
  const hasSalesPersonField = map.has("sales person / 销售人员") || map.has("sales person");
  if (hasSalesPersonField) {
    data.contact = decodeField(get("ID Name / ID 联系人姓名", "ID Name"));
    data.idName = decodeField(get("Sales Person / 销售人员", "Sales Person"));
  } else {
    // Backward compatibility with jobs saved before v1.6.7.
    data.contact = decodeField(get("Contact / 联系", "Contact"));
    data.idName = decodeField(get("ID Name / ID 联系人姓名", "ID Name"));
  }
  data.lock = decodeField(get("Lock No / 门锁号码", "Lock No"));
  data.idFirm = decodeField(get("ID Firm / ID 公司", "ID Firm"));
  data.installerName = decodeField(get("Installer Name / 安装人员姓名", "Installer Name"));
  data.continueGroupId = get("Continue Group ID") || event.extendedProperties?.private?.kgContinueGroup || "";
  data.continueSequence = Number(get("Continue Sequence / 继续工作时段", "Continue Sequence") || event.extendedProperties?.private?.kgContinueSequence || 1) || 1;
  data.continueJob = parseYesNo(get("Continue Job / 继续工作", "Continue Job")) || event.extendedProperties?.private?.kgContinueJob === "1" || Boolean(data.continueGroupId);
  data.amendCeiling = parseYesNo(get("Amend Ceiling / 修改天花", "Amend Ceiling"));
  data.amendCeilingDetail = decodeField(get("Amend Ceiling Detail / 天花修改详情", "Amend Ceiling Detail"));
  data.amendPartition = parseYesNo(get("Amend Partition / 修改隔墙", "Amend Partition"));
  data.amendPartitionDetail = decodeField(get("Amend Partition Detail / 隔墙修改详情", "Amend Partition Detail"));
  data.amendPelmet = parseYesNo(get("Amend Pelmet Box LBox / 修改窗帘盒包箱LBox", "Amend Pelmet Box LBox"));
  data.amendPelmetDetail = decodeField(get("Amend Pelmet Detail / 窗帘盒包箱LBox修改详情", "Amend Pelmet Detail"));
  data.amendTimberOther = parseYesNo(get("Amend Timber Other / 加木支撑其他", "Amend Timber Other"));
  data.amendTimberOtherDetail = decodeField(get("Amend Timber Other Detail / 木支撑其他修改详情", "Amend Timber Other Detail"));
  data.amendRemark = decodeField(get("Amend Remark / 修改备注", "Amend Remark"));
  data.deliveryDate = get("Delivery Date / 送货日期", "Delivery Date");
  data.deliveryMaterials = decodeField(get("Delivery Materials / 送货材料", "Delivery Materials"));
  data.deliveryRemark = decodeField(get("Delivery Remark / 送货备注", "Delivery Remark"));
  data.billingNumber = decodeField(get("Billing Number / 开单号码", "Billing Number", "Invoice Number"));

  // Backward compatibility for older KG Ceiling Calendar records.
  data.idPhone = decodeField(get("ID Phone / ID 联系电话", "ID Phone", "ID Telephone"));
  data.scope = decodeField(get("Scope / 工作范围", "Scope", "SCOPE"));
  data.remove = decodeField(get("Remove / 拆除", "Remove"));
  data.keep = decodeField(get("Keep / 保留", "Keep"));
  data.protect = decodeField(get("Protect / 保护", "Protect"));
  data.disposal = decodeField(get("Disposal / 清理与丢弃", "Disposal"));
  data.hoardingDoneDate = get("Hoarding Done Date / 围板完成日期", "Hoarding Done Date");
  data.hoardingDone = parseYesNo(get("Hoarding Done / 围板已完成", "Hoarding Done")) || Boolean(data.hoardingDoneDate);
  data.hoardingRemoveDate = get("Hoarding Removal Date / 围板拆除日期", "Hoarding Removal Date", "Hoarding Remove Date");
  data.hoardingRemoveRequired = parseYesNo(get("Hoarding Remove Required / 围板需要拆除", "Hoarding Remove Required")) || Boolean(data.hoardingRemoveDate);
  data.deliverySent = parseYesNo(get("Delivery Sent / 已送货", "Delivery Sent")) || Boolean(data.deliveryDate || data.deliveryMaterials);
  data.billedDate = get("Billed Date / 开单日期", "Billed Date");
  data.billed = Boolean(data.billingNumber) || parseYesNo(get("Billed / 已开单", "Billed")) || Boolean(data.billedDate);
  data.foremen = splitPeople(get("Foremen / 头手", "Foremen"));
  data.workers = splitPeople(get("Workers / 工人", "Workers"));
  data.notes = decodeField(get("Notes / 备注", "Notes"));

  // Map useful legacy information into the new simple fields when possible.
  if (!data.installerName && data.foremen.length) data.installerName = data.foremen.join(", ");
  if (!data.amendRemark) data.amendRemark = data.scope || data.remove || data.notes || "";
  return data;
}

function splitPeople(value) {
  if (!value) return [];
  return value.split(/\s*\|\|\s*|\s*,\s*/).map((item) => item.trim()).filter(Boolean);
}


function parseYesNo(value) {
  return /^(yes|true|1|是|已|done|billed)/i.test(String(value || "").trim());
}

async function deleteEventFromCard(event) {
  if (!event?.id) return;
  const data = parseEventData(event);
  const address = data.address || event.summary || "this job / 此工作";
  const ok = window.confirm(`Delete ${address} from the app and Google Calendar?\n从应用和谷歌日历删除 ${address}？`);
  if (!ok) return;
  await deleteCalendarEvent(event.id, false);
}

async function deleteCurrentJob() {
  const eventId = el.eventId.value;
  if (!eventId) return;
  const ok = window.confirm("Delete this job from the app and Google Calendar?\n从应用和谷歌日历删除此工作？");
  if (!ok) return;
  el.deleteJobBtn.disabled = true;
  try {
    await deleteCalendarEvent(eventId, true);
  } finally {
    el.deleteJobBtn.disabled = false;
  }
}

async function deleteCalendarEvent(eventId, closeEditor) {
  if (!isConnected()) {
    disconnectForExpiredToken();
    return;
  }
  const calendarId = encodeURIComponent(CONFIG.CALENDAR_ID || "primary");
  try {
    await apiFetch(`/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
    if (closeEditor) closeJobModal();
    showToast("Job deleted from both calendars. / 工作已从两边删除。", false);
    await refreshEvents(false);
  } catch (error) {
    showToast(`Delete failed: ${error.message} / 删除失败：${error.message}`, true);
  }
}
function openSettings() {
  el.calendarIdText.textContent = CONFIG.CALENDAR_ID || "primary";
  el.settingsModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSettings() {
  el.settingsModal.hidden = true;
  if (el.jobModal.hidden && el.searchModal.hidden) document.body.style.overflow = "";
}

async function resetAppCache() {
  const ok = window.confirm("Reset cached app files and reload?\n重置应用缓存并重新加载？");
  if (!ok) return;
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    localStorage.removeItem("kgCeilingEventsCache");
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    if (registrations) await Promise.all(registrations.map((registration) => registration.unregister()));
  } finally {
    window.location.reload();
  }
}

function showToast(message, isError) {
  if (toastTimer) window.clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.toggle("error", Boolean(isError));
  el.toast.hidden = false;
  toastTimer = window.setTimeout(() => { el.toast.hidden = true; }, 3800);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function addDaysKey(key, days) {
  if (!key) return "";
  const date = dateFromKey(key);
  date.setDate(date.getDate() + Number(days || 0));
  return dateKey(date);
}

function daysBetweenKeys(startKey, endKey) {
  if (!startKey || !endKey) return 0;
  const start = dateFromKey(startKey);
  const end = dateFromKey(endKey);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function dateRangesOverlap(startA, endA, startB, endB) {
  if (!startA || !startB) return false;
  const safeEndA = endA || startA;
  const safeEndB = endB || startB;
  return startA <= safeEndB && startB <= safeEndA;
}

function localDateTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function timeInputValue(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
