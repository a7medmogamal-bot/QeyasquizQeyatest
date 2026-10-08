/* ============================================================
   QeyasQuiz — Full Application Logic
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, query, where, orderBy, limit, getDocs,
  serverTimestamp, runTransaction, Timestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* ============================================================
   FIREBASE INIT
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAIPCI0ZaBabAQQAvT1CSh_Bt3HMPtx_VU",
  authDomain: "qeyasquiz.firebaseapp.com",
  projectId: "qeyasquiz",
  storageBucket: "qeyasquiz.firebasestorage.app",
  messagingSenderId: "918583547137",
  appId: "1:918583547137:web:78cef6533e33cd7e8ab700"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ============================================================
   I18N
   ============================================================ */
const I18N = {
  en: {
    "login.title": "Welcome back",
    "login.subtitle": "Sign in to create exams, manage students, and publish results.",
    "login.google": "Continue with Google",
    "login.connecting": "Connecting…",
    "setup.title": "Complete your profile",
    "setup.subtitle": "This information appears on your exams and helps students identify you.",
    "setup.photo.title": "Profile picture",
    "setup.identity.title": "Identity",
    "setup.subjects.title": "Subjects",
    "setup.signout": "Sign out",
    "setup.cancel": "Cancel",
    "setup.submit": "Complete Setup",
    "dash.welcome.sub": "Here's what's happening with your exams.",
    "action.cancel": "Cancel",
    "action.submit": "Submit",
    "action.publish": "Publish",
    "status.draft": "Draft",
    "status.active": "Active",
    "status.scheduled": "Scheduled",
    "status.completed": "Completed",
    "status.submitted": "Submitted",
    "status.graded": "Graded",
    "status.in_progress": "In Progress",
    "exam.loading": "Loading exam…",
    "exam.connected": "Connected",
    "exam.entry.studentName": "Your full name",
    "exam.entry.accessCode": "Access code",
    "exam.entry.start": "Confirm & Start",
    "exam.entry.foot": "Make sure your name is correct.",
    "exam.resume.title": "Resume your exam?",
    "exam.resume.text": "You have an exam in progress. Your answers and remaining time have been preserved.",
    "exam.resume.continue": "Resume Exam",
    "exam.confirm.title": "Submit exam?",
    "exam.confirm.text": "Are you sure you want to submit your exam? You cannot make changes after submission.",
    "exam.update.title": "Exam Updated",
    "exam.update.text": "The teacher has updated this exam. Refresh to load the latest version. Your answers will be preserved.",
    "exam.update.refresh": "Refresh Exam",
    "result.loading": "Loading result…",
    "result.waiting": "Waiting for grading.",
    "result.feedback": "Teacher Feedback",
    "result.review": "Answer Review",
    "profile.subjects": "Subjects"
  },
  ar: {
    "login.title": "مرحبًا بك",
    "login.subtitle": "سجّل الدخول لإنشاء امتحاناتك وإدارة طلابك ونشر النتائج.",
    "login.google": "المتابعة بحساب Google",
    "login.connecting": "جارٍ الاتصال…",
    "setup.title": "أكمل ملفك الشخصي",
    "setup.subtitle": "هذه المعلومات تظهر في امتحاناتك وتساعد الطلاب على التعرف عليك.",
    "setup.photo.title": "الصورة الشخصية",
    "setup.identity.title": "الهوية",
    "setup.subjects.title": "المواد",
    "setup.signout": "تسجيل الخروج",
    "setup.cancel": "إلغاء",
    "setup.submit": "إكمال الإعداد",
    "dash.welcome.sub": "هذا ما يحدث في امتحاناتك.",
    "action.cancel": "إلغاء",
    "action.submit": "تسليم",
    "action.publish": "نشر",
    "status.draft": "مسودة",
    "status.active": "نشط",
    "status.scheduled": "مجدول",
    "status.completed": "مكتمل",
    "status.submitted": "تم التسليم",
    "status.graded": "تم التصحيح",
    "status.in_progress": "قيد الحل",
    "exam.loading": "جارٍ تحميل الامتحان…",
    "exam.connected": "متصل",
    "exam.entry.studentName": "اسمك الكامل",
    "exam.entry.accessCode": "كود الدخول",
    "exam.entry.start": "تأكيد وبدء",
    "exam.entry.foot": "تأكد من صحة اسمك.",
    "exam.resume.title": "استئناف الامتحان؟",
    "exam.resume.text": "لديك امتحان جارٍ. تم حفظ إجاباتك والوقت المتبقي.",
    "exam.resume.continue": "استئناف",
    "exam.confirm.title": "تسليم الامتحان؟",
    "exam.confirm.text": "هل أنت متأكد؟ لا يمكنك التعديل بعد التسليم.",
    "exam.update.title": "تم تحديث الامتحان",
    "exam.update.text": "قام المعلم بتحديث الامتحان. حدّث الصفحة لتحميل النسخة الأحدث. إجاباتك ستبقى.",
    "exam.update.refresh": "تحديث",
    "result.loading": "جارٍ تحميل النتيجة…",
    "result.waiting": "بانتظار التصحيح.",
    "result.feedback": "ملاحظات المعلم",
    "result.review": "مراجعة الإجابات",
    "profile.subjects": "المواد"
  }
};

const LANG_KEY = "qeyasquiz.lang";
const THEME_KEY = "qeyasquiz.theme";
let currentLang = localStorage.getItem(LANG_KEY) || "en";
let currentTheme = localStorage.getItem(THEME_KEY) || "light";

function t(key) { return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key; }

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  applyI18n();
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.lang === lang);
  });
}

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() { setTheme(currentTheme === "dark" ? "light" : "dark"); }

/* ============================================================
   UTILS
   ============================================================ */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  });
  (children || []).forEach((c) => {
    if (c === null || c === undefined || c === false) return;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return n;
}

function svgIcon(id, size = 18) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("class", "icon");
  s.setAttribute("width", size);
  s.setAttribute("height", size);
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", `#i-${id}`);
  s.appendChild(u);
  return s;
}

function debounce(fn, wait) {
  let tm;
  return (...args) => { clearTimeout(tm); tm = setTimeout(() => fn(...args), wait); };
}

function uid(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
  return s;
}

function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(currentLang === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function normalizeUsername(u) { return String(u || "").trim().toLowerCase(); }
function validUsername(u) { return /^[a-zA-Z0-9_]{3,24}$/.test(u); }

function toast(message, type = "info", timeout = 4000) {
  const stack = $("[data-toast-stack]");
  if (!stack) return;
  const iconMap = { success: "check-circle", error: "alert", warning: "alert", info: "info" };
  const node = el("div", { class: `toast toast-${type}`, role: "status" }, [
    (() => { const s = svgIcon(iconMap[type] || "info", 20); s.classList.add("toast-icon"); return s; })(),
    el("div", { class: "toast-body", text: message }),
    el("button", { class: "toast-close", type: "button", "aria-label": "Close" }, [svgIcon("x", 14)])
  ]);
  const close = () => { node.classList.add("is-out"); setTimeout(() => node.remove(), 220); };
  node.querySelector(".toast-close").addEventListener("click", close);
  stack.appendChild(node);
  if (timeout) setTimeout(close, timeout);
}

function openModal({ title, body, actions = [], className = "", onClose }) {
  const host = $("[data-modal-host]") || document.body;
  const overlay = el("div", { class: "modal-overlay" });
  const box = el("div", { class: `modal ${className}`, role: "dialog", "aria-modal": "true" });
  const close = () => { overlay.remove(); if (onClose) onClose(); };
  if (title) box.appendChild(el("h2", { class: "modal-title", text: title }));
  if (body) {
    if (typeof body === "string") box.appendChild(el("p", { class: "modal-body mt-3", text: body }));
    else box.appendChild(body);
  }
  if (actions.length) {
    const foot = el("div", { class: "modal-foot" });
    actions.forEach((a) => {
      const b = el("button", {
        type: "button", class: `btn ${a.class || "btn-ghost"}`, text: a.label,
        onclick: async () => {
          if (a.onClick) { const r = await a.onClick(); if (r === false) return; }
          if (a.keepOpen !== true) close();
        }
      });
      foot.appendChild(b);
    });
    box.appendChild(foot);
  }
  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });
  host.appendChild(overlay);
  return { close, box };
}

/* ============================================================
   FIREBASE HELPERS
   ============================================================ */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
let currentProfile = null;

async function signInWithGoogle() {
  try {
    return (await signInWithPopup(auth, googleProvider)).user;
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      throw new Error(currentLang === "ar" ? "تم إلغاء تسجيل الدخول." : "Sign in was cancelled.");
    }
    throw new Error(currentLang === "ar" ? "تعذّر تسجيل الدخول. حاول مرة أخرى." : "Could not sign in. Please try again.");
  }
}

async function signOutUser() {
  await fbSignOut(auth);
  currentUser = null;
  currentProfile = null;
  location.hash = "#/login";
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

async function checkUsernameAvailability(username) {
  const snap = await getDoc(doc(db, "usernames", normalizeUsername(username)));
  return !snap.exists();
}

async function claimUsername(uid, username, profileData) {
  const normalized = normalizeUsername(username);
  const userRef = doc(db, "users", uid);
  const unameRef = doc(db, "usernames", normalized);
  await runTransaction(db, async (tx) => {
    const us = await tx.get(unameRef);
    if (us.exists() && us.data().uid !== uid) throw new Error("USERNAME_TAKEN");
    tx.set(unameRef, { uid, createdAt: serverTimestamp() });
    tx.set(userRef, {
      uid, username, normalizedUsername: normalized,
      fullName: profileData.fullName,
      photoURL: profileData.photoURL || "",
      mainSubject: profileData.mainSubject,
      customMainSubject: profileData.customMainSubject || "",
      role: "teacher",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
}

async function uploadProfileImage(uid, file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("INVALID_TYPE");
  if (file.size > 2 * 1024 * 1024) throw new Error("TOO_LARGE");
  const path = `avatars/${uid}/${Date.now()}_${file.name}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file, { contentType: file.type });
  return await getDownloadURL(sref);
}

async function listExams(uid, limitN = 100) {
  try {
    const snap = await getDocs(query(
      collection(db, "exams"),
      where("ownerId", "==", uid),
      orderBy("updatedAt", "desc"),
      limit(limitN)
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("[listExams]", err);
    try {
      const snap = await getDocs(query(collection(db, "exams"), where("ownerId", "==", uid)));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  }
}

async function getExam(id) {
  const snap = await getDoc(doc(db, "exams", id));
  return snap.exists() ? { id, ...snap.data() } : null;
}

async function listAttempts(examId) {
  try {
    const snap = await getDocs(query(collection(db, "attempts"), where("examId", "==", examId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

function computeStatus(exam) {
  if (!exam) return "draft";
  if (exam.status === "draft") return "draft";
  const now = Date.now();
  const start = exam.startAt?.toMillis ? exam.startAt.toMillis() : null;
  const end = exam.endAt?.toMillis ? exam.endAt.toMillis() : null;
  if (end && now > end) return "completed";
  if (start && now < start) return "scheduled";
  if (start && end && now >= start && now <= end) return "active";
  if (exam.status === "scheduled") return "active";
  return exam.status || "draft";
}

/* ============================================================
   ROUTER
   ============================================================ */
const ROUTES = {
  "/": { page: "landing" },
  "/login": { page: "login" },
  "/setup": { page: "setup" },
  "/app/dashboard": { page: "app", view: "dashboard" },
  "/app/exams": { page: "app", view: "exams" },
  "/app/builder": { page: "app", view: "builder" },
  "/app/exam": { page: "app", view: "exam-details" },
  "/app/grading": { page: "app", view: "grading" },
  "/app/bank": { page: "app", view: "bank" },
  "/app/profile": { page: "app", view: "profile" },
  "/app/settings": { page: "app", view: "settings" },
  "/app/packages": { page: "app", view: "packages" },
  "/exam": { page: "exam" },
  "/result": { page: "result" }
};

let currentRoute = null;

function navigate(path) {
  const target = "#" + path;
  if (location.hash === target) handleRoute();
  else location.hash = target;
}

function handleRoute() {
  const raw = (location.hash.replace(/^#/, "")) || "/";
  const [path, qs] = raw.split("?");
  const params = new URLSearchParams(qs || "");
  const route = ROUTES[path] || ROUTES["/"];
  const targetPage = route.page;

  $$("[data-page]").forEach((p) => { p.hidden = p.dataset.page !== targetPage; });

  if (route.view) {
    $$("[data-view]").forEach((v) => {
      const match = v.dataset.view === route.view;
      v.hidden = !match;
    });
    $$(".side-link").forEach((l) => l.classList.toggle("is-active", l.dataset.route === route.view));
    const titleMap = {
      dashboard: "Dashboard", exams: "My Exams", builder: "Exam Builder",
      "exam-details": "Exam", grading: "Grading", bank: "Question Bank",
      profile: "Profile", settings: "Settings", packages: "Packages"
    };
    const titleEl = $("[data-page-title]");
    if (titleEl) titleEl.textContent = titleMap[route.view] || "";
  }

  currentRoute = path;

  // Route dispatch
  if (targetPage === "landing") initLanding();
  else if (targetPage === "login") initLogin();
  else if (targetPage === "setup") initSetup();
  else if (targetPage === "app") {
    if (route.view === "dashboard") renderDashboard();
    else if (route.view === "exams") renderMyExams();
    else if (route.view === "builder") renderBuilder(params);
    else if (route.view === "exam-details") renderExamDetails(params);
    else if (route.view === "grading") renderGrading(params);
    else if (route.view === "profile") renderProfile();
    else if (route.view === "settings") renderSettings();
  } else if (targetPage === "exam") renderExam(params);
  else if (targetPage === "result") renderResult();

  window.scrollTo(0, 0);
}

/* ============================================================
   AUTH STATE
   ============================================================ */
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    currentProfile = null;
    if (!["/", "/login", "/exam", "/result"].includes(currentRoute)) {
      navigate("/login");
    }
    return;
  }
  try { currentProfile = await loadProfile(user.uid); }
  catch { currentProfile = null; }

  const hasProfile = currentProfile && currentProfile.username;

  if (!hasProfile && currentRoute !== "/setup" && currentRoute !== "/" && currentRoute !== "/exam" && currentRoute !== "/result") {
    navigate("/setup");
    return;
  }
  if (hasProfile && (currentRoute === "/setup" || currentRoute === "/login")) {
    navigate("/app/dashboard");
    return;
  }

  // Update sidebar user info
  $$("[data-user-name]").forEach((e) => (e.textContent = currentProfile?.fullName || user.displayName || ""));
  $$("[data-user-handle]").forEach((e) => (e.textContent = "@" + (currentProfile?.username || "")));
  $$("[data-user-avatar]").forEach((e) => (e.src = currentProfile?.photoURL || user.photoURL || ""));

  handleRoute();
});

/* ============================================================
   LANDING
   ============================================================ */
function initLanding() {
  document.querySelectorAll("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
}

/* ============================================================
   LOGIN
   ============================================================ */
function initLogin() {
  const btn = $("[data-google-signin]");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  const status = $("[data-auth-status]");
  const errBox = $("[data-auth-error]");
  const errText = $("[data-auth-error-text]");

  btn.addEventListener("click", async () => {
    errBox.hidden = true;
    status.hidden = false;
    btn.classList.add("is-loading");
    try {
      await signInWithGoogle();
    } catch (err) {
      status.hidden = true;
      btn.classList.remove("is-loading");
      errBox.hidden = false;
      errText.textContent = err.message;
    }
  });
}

/* ============================================================
   SETUP
   ============================================================ */
let setupState = { photoFile: null };

function initSetup() {
  const form = $("[data-setup-form]");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";

  const usernameInput = $("[data-username-input]");
  const usernameStatus = $("[data-username-status]");
  const usernameError = $("[data-username-error]");
  const fullNameInput = $("[data-fullname-input]");
  const avatarPreview = $("[data-avatar-preview]");
  const avatarInput = $("[data-avatar-input]");
  const avatarPick = $("[data-avatar-pick]");
  const avatarReset = $("[data-avatar-reset]");
  const mainSubjectSelect = $("[data-main-subject]");
  const customSubjectField = $("[data-custom-subject-field]");
  const customSubjectInput = $("[data-custom-subject]");

  if (currentUser) {
    if (currentUser.displayName) fullNameInput.value = currentUser.displayName;
    if (currentUser.photoURL) avatarPreview.src = currentUser.photoURL;
    const base = (currentUser.email || "").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    if (base.length >= 3) usernameInput.value = base;
  }

  const checkUname = debounce(async () => {
    const val = usernameInput.value.trim();
    usernameError.hidden = true;
    usernameStatus.textContent = "";
    usernameStatus.className = "input-status";
    if (!val) return;
    if (!validUsername(val)) {
      usernameError.hidden = false;
      usernameError.textContent = "3–24 characters. Letters, numbers, and underscore only.";
      return;
    }
    usernameStatus.textContent = "Checking…";
    usernameStatus.classList.add("is-checking");
    try {
      const ok = await checkUsernameAvailability(val);
      usernameStatus.classList.remove("is-checking");
      if (ok) { usernameStatus.textContent = currentLang === "ar" ? "متاح" : "Available"; usernameStatus.classList.add("is-available"); }
      else { usernameStatus.textContent = currentLang === "ar" ? "مأخوذ" : "Taken"; usernameStatus.classList.add("is-taken"); }
    } catch { usernameStatus.textContent = ""; }
  }, 400);

  usernameInput.addEventListener("input", checkUname);

  avatarPick.addEventListener("click", () => avatarInput.click());
  avatarInput.addEventListener("change", () => {
    const f = avatarInput.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast("Max 2 MB", "warning"); return; }
    setupState.photoFile = f;
    avatarPreview.src = URL.createObjectURL(f);
  });
  avatarReset.addEventListener("click", () => {
    setupState.photoFile = null;
    avatarPreview.src = currentUser?.photoURL || "";
    avatarInput.value = "";
  });

  mainSubjectSelect.addEventListener("change", () => {
    customSubjectField.hidden = mainSubjectSelect.value !== "custom";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let ok = true;
    const uname = usernameInput.value.trim();
    if (!validUsername(uname)) {
      usernameError.hidden = false;
      usernameError.textContent = "3–24 characters. Letters, numbers, and underscore only.";
      ok = false;
    }
    const fullName = fullNameInput.value.trim();
    if (fullName.length < 3) { toast("Enter your full name", "warning"); ok = false; }
    const mainSub = mainSubjectSelect.value;
    if (!mainSub) { toast(currentLang === "ar" ? "اختر مادة" : "Select a subject", "warning"); ok = false; }
    if (!ok) return;

    const submitBtn = $("[data-submit]");
    submitBtn.classList.add("is-loading");
    try {
      let photoURL = currentUser?.photoURL || "";
      if (setupState.photoFile) photoURL = await uploadProfileImage(currentUser.uid, setupState.photoFile);
      const customMain = mainSub === "custom" ? customSubjectInput.value.trim() : "";
      if (mainSub === "custom" && !customMain) { toast("Enter subject name", "warning"); submitBtn.classList.remove("is-loading"); return; }
      await claimUsername(currentUser.uid, uname, { fullName, photoURL, mainSubject: mainSub, customMainSubject: customMain });
      currentProfile = await loadProfile(currentUser.uid);
      toast("Profile saved", "success");
      navigate("/app/dashboard");
    } catch (err) {
      submitBtn.classList.remove("is-loading");
      if (err.message === "USERNAME_TAKEN") {
        usernameError.hidden = false;
        usernameError.textContent = "Username already taken.";
        usernameStatus.textContent = currentLang === "ar" ? "مأخوذ" : "Taken";
        usernameStatus.className = "input-status is-taken";
      } else {
        console.error(err);
        toast(currentLang === "ar" ? "تعذّر حفظ البيانات." : "Could not save profile.", "error");
      }
    }
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard() {
  if (!currentProfile) return;

  const welcomeTitle = $("[data-welcome-title]");
  if (welcomeTitle) {
    const hour = new Date().getHours();
    const greeting = hour < 12
      ? (currentLang === "ar" ? "صباح الخير" : "Good morning")
      : (hour < 18 ? (currentLang === "ar" ? "مساء الخير" : "Good afternoon") : (currentLang === "ar" ? "مساء الخير" : "Good evening"));
    welcomeTitle.textContent = `${greeting}, ${(currentProfile.fullName || "").split(" ")[0]}`;
  }

  const exams = await listExams(currentProfile.uid);
  const stats = {
    totalExams: exams.length,
    activeExams: exams.filter((e) => computeStatus(e) === "active").length,
    submittedStudents: 0,
    waitingGrading: 0
  };

  try {
    for (const exam of exams.slice(0, 20)) {
      const atts = await listAttempts(exam.id);
      stats.submittedStudents += atts.filter((a) => a.status === "submitted" || a.status === "graded").length;
      stats.waitingGrading += atts.filter((a) => a.status === "submitted" && !a.gradedAt).length;
    }
  } catch {}

  $$("[data-stat]").forEach((e) => {
    e.textContent = String(stats[e.dataset.stat] ?? 0);
  });

  const recentHost = $("[data-recent-exams]");
  if (recentHost) {
    recentHost.innerHTML = "";
    if (!exams.length) {
      recentHost.appendChild(el("div", { class: "empty" }, [
        el("h3", { text: currentLang === "ar" ? "لا توجد امتحانات بعد" : "No exams yet" }),
        el("p", { text: currentLang === "ar" ? "أنشئ أول امتحان للبدء." : "Create your first exam to get started." }),
        el("button", { class: "btn btn-primary", type: "button", text: "Create Exam", onclick: () => navigate("/app/builder") })
      ]));
    } else {
      exams.slice(0, 6).forEach((exam) => recentHost.appendChild(buildExamCard(exam)));
    }
  }
}

function buildExamCard(exam) {
  const status = computeStatus(exam);
  const card = el("article", { class: "card-brutal tint-1 exam-card", style: "cursor:pointer" });
  card.appendChild(el("div", { class: "exam-card-head" }, [
    el("div", {}, [
      el("div", { class: "exam-card-title", text: exam.title || "Untitled" }),
      el("div", { class: "exam-card-sub", text: `${exam.subject || "—"} · ${exam.grade || "—"}` })
    ]),
    el("span", { class: `badge badge-${status}`, text: t("status." + status) })
  ]));
  const meta = el("div", { class: "exam-card-meta" });
  meta.appendChild(el("span", {}, [svgIcon("file-text", 14), document.createTextNode(`${exam.questions?.length || 0} Q`)]));
  meta.appendChild(el("span", {}, [svgIcon("timer", 14), document.createTextNode(`${exam.duration || 0} min`)]));
  card.appendChild(meta);
  card.appendChild(el("div", { class: "exam-card-foot" }, [
    el("button", { class: "btn btn-primary btn-sm", type: "button", text: "Open" })
  ]));
  card.addEventListener("click", () => navigate(`/app/exam?id=${exam.id}`));
  return card;
}

/* ============================================================
   MY EXAMS
   ============================================================ */
let examsState = { all: [], filtered: [], status: "", search: "" };

async function renderMyExams() {
  const list = $("[data-exams-list]");
  const empty = $("[data-exams-empty]");
  if (!list) return;

  list.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    list.appendChild(el("div", { class: "sk-card" }, [
      el("div", { class: "skeleton sk-line sk-lg" }),
      el("div", { class: "skeleton sk-line sk-sm" }),
      el("div", { class: "skeleton sk-line" })
    ]));
  }

  examsState.all = await listExams(currentProfile.uid);
  applyExamFilters();
}

function applyExamFilters() {
  const list = $("[data-exams-list]");
  const empty = $("[data-exams-empty]");
  if (!list) return;
  let arr = examsState.all.slice();
  if (examsState.status) arr = arr.filter((e) => computeStatus(e) === examsState.status);
  if (examsState.search) {
    const q = examsState.search.toLowerCase();
    arr = arr.filter((e) => (e.title || "").toLowerCase().includes(q) || (e.subject || "").toLowerCase().includes(q));
  }
  arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  examsState.filtered = arr;

  list.innerHTML = "";
  if (!arr.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  arr.forEach((exam) => list.appendChild(buildExamCard(exam)));
}

function initMyExamsFilters() {
  const search = $("[data-exam-search]");
  const statusSel = $("[data-exam-filter-status]");
  if (search && !search.dataset.bound) {
    search.dataset.bound = "1";
    search.addEventListener("input", debounce(() => {
      examsState.search = search.value.trim();
      applyExamFilters();
    }, 250));
  }
  if (statusSel && !statusSel.dataset.bound) {
    statusSel.dataset.bound = "1";
    statusSel.addEventListener("change", () => {
      examsState.status = statusSel.value;
      applyExamFilters();
    });
  }
}

/* ============================================================
   EXAM BUILDER
   ============================================================ */
let builderState = {
  examId: null,
  currentStep: "info",
  data: {
    title: "", subject: "", grade: "", duration: 60,
    shuffleQuestions: false, requireAccessCode: false, accessCode: "",
    requireFullscreen: false, questions: []
  }
};

async function renderBuilder(params) {
  const examId = params?.get("id");
  if (examId) {
    const exam = await getExam(examId);
    if (exam && exam.ownerId === currentProfile.uid) {
      builderState.examId = examId;
      builderState.data = { ...builderState.data, ...exam };
      if (!builderState.data.questions) builderState.data.questions = [];
    }
  } else {
    builderState.examId = null;
    builderState.data = {
      title: "", subject: "", grade: "", duration: 60,
      shuffleQuestions: false, requireAccessCode: false, accessCode: "",
      requireFullscreen: false, questions: []
    };
  }
  renderBuilderUI();
  initBuilderEvents();
}

function renderBuilderUI() {
  const d = builderState.data;
  const set = (sel, v) => { const e = $(sel); if (e) e.value = v ?? ""; };
  set("#examTitle", d.title);
  set("#examSubject", d.subject);
  set("#examGrade", d.grade);
  set("#examDuration", d.duration || 60);
  set("#examAccessCode", d.accessCode);
  const s1 = $('[data-field="shuffleQuestions"]'); if (s1) s1.checked = !!d.shuffleQuestions;
  const s2 = $('[data-field="requireAccessCode"]'); if (s2) s2.checked = !!d.requireAccessCode;
  const s3 = $('[data-field="requireFullscreen"]'); if (s3) s3.checked = !!d.requireFullscreen;
  const title = $("[data-builder-title]"); if (title) title.textContent = d.title || (currentLang === "ar" ? "امتحان جديد" : "New Exam");
  renderQuestionsList();
  updateTotalScore();
  switchBuilderStep(builderState.currentStep);
}

function switchBuilderStep(step) {
  builderState.currentStep = step;
  $$(".builder-step").forEach((b) => b.classList.toggle("is-active", b.dataset.step === step));
  $$(".builder-panel").forEach((p) => { p.hidden = p.dataset.panel !== step; });
}

function updateTotalScore() {
  const total = builderState.data.questions.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const el = $("[data-total-score]");
  if (el) el.textContent = String(total);
}

function renderQuestionsList() {
  const host = $("[data-questions-list]");
  if (!host) return;
  host.innerHTML = "";
  const list = builderState.data.questions;
  if (!list.length) {
    host.appendChild(el("div", { class: "empty", style: "padding:var(--sp-8)" }, [
      el("p", { class: "text-muted", text: currentLang === "ar" ? "لا توجد أسئلة بعد." : "No questions yet." })
    ]));
    return;
  }
  list.forEach((q, idx) => host.appendChild(buildQuestionCard(q, idx)));
}

function buildQuestionCard(q, idx) {
  const card = el("div", { class: "question-card" });

  const head = el("div", { class: "question-card-head" }, [
    el("div", { class: "question-card-num" }, [
      el("span", { text: String(idx + 1) }),
      el("span", { class: "question-type-badge", text: qTypeLabel(q.type) })
    ]),
    el("div", { class: "question-card-actions" }, [
      el("button", { class: "icon-btn", type: "button", title: "Duplicate", onclick: () => duplicateQuestion(q.id) }, [svgIcon("duplicate", 16)]),
      el("button", { class: "icon-btn", type: "button", title: "Delete", onclick: () => deleteQuestion(q.id) }, [svgIcon("trash", 16)])
    ])
  ]);
  card.appendChild(head);

  const body = el("div", { class: "question-body" });

  const ta = el("textarea", { class: "textarea", placeholder: currentLang === "ar" ? "نص السؤال…" : "Question text…" });
  ta.value = q.text || "";
  ta.addEventListener("input", () => { q.text = ta.value; markDirty(); });
  body.appendChild(ta);

  if (q.type === "mcq" || q.type === "mcq_just") {
    const opts = el("div", { class: "question-options" });
    (q.options || []).forEach((opt, i) => {
      const row = el("div", { class: "option-row" });
      const radio = el("input", { type: "radio", name: "correct_" + q.id });
      radio.checked = q.correctIndex === i;
      radio.addEventListener("change", () => { q.correctIndex = i; markDirty(); });
      const lbl = el("span", { class: "option-label", text: String.fromCharCode(65 + i) });
      const inp = el("input", { type: "text", class: "input", value: opt || "", placeholder: "Option " + String.fromCharCode(65 + i) });
      inp.addEventListener("input", () => { q.options[i] = inp.value; markDirty(); });
      const del = el("button", { class: "icon-btn", type: "button", onclick: () => {
        q.options.splice(i, 1);
        if (q.correctIndex === i) q.correctIndex = 0;
        else if (q.correctIndex > i) q.correctIndex--;
        markDirty(); renderQuestionsList();
      } }, [svgIcon("x", 14)]);
      row.appendChild(radio); row.appendChild(lbl); row.appendChild(inp); row.appendChild(del);
      opts.appendChild(row);
    });
    if (q.options.length < 8) {
      opts.appendChild(el("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => {
        q.options.push(""); markDirty(); renderQuestionsList();
      } }, [svgIcon("plus", 14), document.createTextNode("Add option")]));
    }
    body.appendChild(opts);
  }

  if (q.type === "tf" || q.type === "tf_just") {
    const wrap = el("div", { class: "question-options" });
    [{ v: true, l: "True" }, { v: false, l: "False" }].forEach(({ v, l }) => {
      const row = el("div", { class: "option-row" });
      const radio = el("input", { type: "radio", name: "tf_" + q.id });
      radio.checked = q.correctBool === v;
      radio.addEventListener("change", () => { q.correctBool = v; markDirty(); });
      row.appendChild(radio);
      row.appendChild(el("span", { text: l }));
      wrap.appendChild(row);
    });
    body.appendChild(wrap);
  }

  if (q.type === "complete") {
    const f = el("div", { class: "field" }, [
      el("label", { class: "field-label", text: currentLang === "ar" ? "الإجابة الصحيحة" : "Correct answer" })
    ]);
    const inp = el("input", { type: "text", class: "input", value: q.correctText || "" });
    inp.addEventListener("input", () => { q.correctText = inp.value; markDirty(); });
    f.appendChild(inp);
    body.appendChild(f);
  }

  if (q.type === "essay") {
    const f = el("div", { class: "field" }, [
      el("label", { class: "field-label", text: currentLang === "ar" ? "الإجابة النموذجية" : "Model answer" })
    ]);
    const txt = el("textarea", { class: "textarea" });
    txt.value = q.modelAnswer || "";
    txt.addEventListener("input", () => { q.modelAnswer = txt.value; markDirty(); });
    f.appendChild(txt);
    body.appendChild(f);
  }

  const f = el("div", { class: "field" }, [
    el("label", { class: "field-label", text: currentLang === "ar" ? "الدرجة" : "Score" })
  ]);
  const scoreInp = el("input", { type: "number", class: "input", min: "0.5", step: "0.5", value: q.score || 1, style: "max-width:120px" });
  scoreInp.addEventListener("input", () => { q.score = Number(scoreInp.value) || 0; markDirty(); updateTotalScore(); });
  f.appendChild(scoreInp);
  body.appendChild(f);

  card.appendChild(body);
  return card;
}

function qTypeLabel(type) {
  return { mcq: "MCQ", mcq_just: "MCQ + J", tf: "T/F", tf_just: "T/F + J", complete: "Complete", essay: "Essay" }[type] || type;
}

function addQuestion(type) {
  const q = {
    id: uid(10), type, text: "",
    options: (type === "mcq" || type === "mcq_just") ? ["", "", "", ""] : [],
    correctIndex: 0, correctBool: null, correctText: "", modelAnswer: "", score: 1
  };
  builderState.data.questions.push(q);
  markDirty();
  renderQuestionsList();
  updateTotalScore();
}

function duplicateQuestion(qid) {
  const orig = builderState.data.questions.find((q) => q.id === qid);
  if (!orig) return;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = uid(10);
  const i = builderState.data.questions.findIndex((q) => q.id === qid);
  builderState.data.questions.splice(i + 1, 0, copy);
  markDirty(); renderQuestionsList(); updateTotalScore();
}

function deleteQuestion(qid) {
  builderState.data.questions = builderState.data.questions.filter((q) => q.id !== qid);
  markDirty(); renderQuestionsList(); updateTotalScore();
}

function initBuilderEvents() {
  const container = $('[data-page="app"]');
  if (!container || container.dataset.builderBound) return;
  container.dataset.builderBound = "1";

  container.addEventListener("click", (e) => {
    const stepBtn = e.target.closest(".builder-step");
    if (stepBtn) { switchBuilderStep(stepBtn.dataset.step); return; }

    if (e.target.closest("[data-add-question]")) { showQuestionTypeModal(); return; }
    if (e.target.closest("[data-builder-publish]")) { publishExam(); return; }
    if (e.target.closest("[data-builder-cancel]")) { navigate("/app/exams"); return; }
    if (e.target.closest("[data-builder-preview]")) {
      if (!builderState.examId) { toast(currentLang === "ar" ? "احفظ أولاً" : "Save first", "warning"); return; }
      window.open(location.pathname + `#/exam?id=${builderState.examId}&preview=1`, "_blank");
      return;
    }
  });

  container.addEventListener("input", (e) => {
    const f = e.target.dataset?.field;
    if (!f) return;
    const d = builderState.data;
    if (f === "title" || f === "subject" || f === "grade" || f === "accessCode") d[f] = e.target.value;
    else if (f === "duration") d[f] = Number(e.target.value) || 60;
    if (f === "title") { const t = $("[data-builder-title]"); if (t) t.textContent = d.title || "New Exam"; }
    markDirty();
  });

  container.addEventListener("change", (e) => {
    const f = e.target.dataset?.field;
    if (!f) return;
    if (e.target.type === "checkbox") builderState.data[f] = e.target.checked;
    markDirty();
  });
}

function showQuestionTypeModal() {
  const types = [
    { type: "mcq", title: "Multiple Choice", hint: "One correct answer" },
    { type: "mcq_just", title: "MCQ + Justification", hint: "Choice + written reasoning" },
    { type: "tf", title: "True / False", hint: "Boolean answer" },
    { type: "tf_just", title: "True / False + Justification", hint: "Boolean + reasoning" },
    { type: "complete", title: "Complete", hint: "Fill in the blank" },
    { type: "essay", title: "Essay", hint: "Long-form manual graded" }
  ];
  openModal({
    title: currentLang === "ar" ? "اختر نوع السؤال" : "Choose question type",
    body: el("div", { class: "stack-sm" }, types.map((tt) =>
      el("button", { type: "button", class: "card", style: "text-align:left;cursor:pointer;padding:var(--sp-4)", onclick: () => {
        addQuestion(tt.type);
        document.querySelectorAll(".modal-overlay").forEach((m) => m.remove());
      } }, [
        el("div", { class: "fw-semibold", text: tt.title }),
        el("div", { class: "text-sm text-muted mt-1", text: tt.hint })
      ])
    )),
    actions: [{ label: t("action.cancel"), class: "btn-ghost" }]
  });
}

function markDirty() {
  const state = $("[data-builder-save-state]");
  if (state) state.textContent = currentLang === "ar" ? "جارٍ الحفظ…" : "Saving…";
  autosaveBuilder();
}

const autosaveBuilder = debounce(async () => {
  if (!currentProfile) return;
  const d = builderState.data;
  if (!d.title.trim()) return;
  const payload = {
    ownerId: currentProfile.uid,
    title: d.title, subject: d.subject, grade: d.grade,
    duration: Number(d.duration) || 60,
    shuffleQuestions: !!d.shuffleQuestions,
    requireAccessCode: !!d.requireAccessCode,
    accessCode: d.requireAccessCode ? (d.accessCode || "") : "",
    requireFullscreen: !!d.requireFullscreen,
    questions: d.questions,
    totalQuestions: d.questions.length,
    status: d.status || "draft",
    teacherName: currentProfile.fullName || "",
    updatedAt: serverTimestamp()
  };
  try {
    if (builderState.examId) {
      await updateDoc(doc(db, "exams", builderState.examId), payload);
    } else {
      payload.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db, "exams"), payload);
      builderState.examId = ref.id;
      history.replaceState(null, "", `#/app/builder?id=${ref.id}`);
    }
    const state = $("[data-builder-save-state]");
    if (state) state.textContent = currentLang === "ar" ? "تم الحفظ" : "Saved";
  } catch (err) {
    console.error(err);
    const state = $("[data-builder-save-state]");
    if (state) state.textContent = currentLang === "ar" ? "فشل الحفظ" : "Save failed";
  }
}, 1200);

async function publishExam() {
  const d = builderState.data;
  const errors = [];
  if (!d.title.trim()) errors.push("Exam name required");
  if (!d.subject) errors.push("Subject required");
  if (!d.grade) errors.push("Grade required");
  if (!d.questions.length) errors.push("At least one question required");
  if (errors.length) {
    openModal({
      title: `${errors.length} issue${errors.length > 1 ? "s" : ""}`,
      body: el("ul", { style: "padding-left:20px;line-height:1.9" }, errors.map((e) => el("li", { text: e }))),
      actions: [{ label: "OK", class: "btn-primary" }]
    });
    return;
  }

  openModal({
    title: currentLang === "ar" ? "نشر الامتحان؟" : "Publish exam?",
    body: el("div", { class: "stack-sm" }, [
      el("div", { class: "row-between" }, [el("span", { text: "Title" }), el("strong", { text: d.title })]),
      el("div", { class: "row-between" }, [el("span", { text: "Questions" }), el("strong", { text: String(d.questions.length) })]),
      el("div", { class: "row-between" }, [el("span", { text: "Duration" }), el("strong", { text: d.duration + " min" })])
    ]),
    actions: [
      { label: t("action.cancel"), class: "btn-ghost" },
      { label: t("action.publish"), class: "btn-primary", onClick: async () => {
        try {
          await autosaveBuilder();
          await new Promise((r) => setTimeout(r, 100));
          if (!builderState.examId) throw new Error("no exam");
          await updateDoc(doc(db, "exams", builderState.examId), {
            status: "scheduled",
            publishedAt: serverTimestamp()
          });
          toast(currentLang === "ar" ? "تم نشر الامتحان" : "Exam published", "success");
          navigate(`/app/exam?id=${builderState.examId}`);
        } catch (err) {
          console.error(err);
          toast(currentLang === "ar" ? "فشل النشر" : "Publish failed", "error");
        }
      }}
    ]
  });
}

/* ============================================================
   EXAM DETAILS (Teacher)
   ============================================================ */
async function renderExamDetails(params) {
  const examId = params?.get("id");
  const host = $("[data-exam-details]");
  if (!host) return;
  if (!examId) { navigate("/app/exams"); return; }
  host.innerHTML = "";
  host.appendChild(el("div", { class: "sk-card" }, [el("div", { class: "skeleton sk-line sk-lg" })]));

  const exam = await getExam(examId);
  if (!exam || exam.ownerId !== currentProfile.uid) {
    host.innerHTML = "";
    host.appendChild(el("div", { class: "empty" }, [el("p", { text: "Exam not found." })]));
    return;
  }

  const attempts = await listAttempts(examId);
  const status = computeStatus(exam);

  host.innerHTML = "";

  host.appendChild(el("div", { class: "exam-details-head" }, [
    el("div", {}, [
      el("h2", { class: "exam-details-title", text: exam.title || "Untitled" }),
      el("div", { class: "exam-details-meta", text: `${exam.subject || ""} · ${exam.grade || ""} · ${exam.questions?.length || 0} Q · ${exam.duration || 0} min` })
    ]),
    el("div", { class: "row" }, [
      el("span", { class: `badge badge-${status}`, text: t("status." + status) }),
      el("button", { class: "btn btn-outline btn-sm", type: "button", text: "Edit", onclick: () => navigate(`/app/builder?id=${examId}`) }),
      el("button", { class: "btn btn-outline btn-sm", type: "button", text: "Share", onclick: () => shareExam(exam) })
    ])
  ]));

  const tabs = el("div", { class: "exam-tabs" });
  ["students", "questions", "grading"].forEach((n) =>
    tabs.appendChild(el("button", { class: "exam-tab", type: "button", "data-tab": n, text: n === "grading" ? "Grading" : n }))
  );
  host.appendChild(tabs);
  const content = el("div", {});
  host.appendChild(content);

  const showTab = (name) => {
    $$(".exam-tab", tabs).forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
    content.innerHTML = "";
    if (name === "students") renderStudentsTab(content, exam, attempts);
    else if (name === "questions") renderQuestionsTab(content, exam);
    else if (name === "grading") renderGradingList(content, exam, attempts);
  };
  tabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".exam-tab");
    if (tab) showTab(tab.dataset.tab);
  });
  showTab("students");
}

function renderStudentsTab(host, exam, attempts) {
  if (!attempts.length) {
    host.appendChild(el("div", { class: "empty" }, [
      el("h3", { text: currentLang === "ar" ? "لا يوجد طلاب بعد" : "No submissions yet" }),
      el("p", { text: currentLang === "ar" ? "شارك رابط الامتحان للبدء." : "Share the exam link to get started." })
    ]));
    return;
  }
  const wrap = el("div", { class: "card" });
  const table = el("table", { class: "students-table" });
  table.innerHTML = `<thead><tr><th>Student</th><th>Status</th><th>Started</th><th>Submitted</th><th>Score</th></tr></thead>`;
  const tbody = el("tbody");
  const totalPossible = exam.questions?.reduce((s, q) => s + (Number(q.score) || 0), 0) || 0;
  attempts.forEach((a) => {
    const tr = el("tr", { style: "cursor:pointer" }, [
      el("td", { text: a.studentName || "—" }),
      el("td", {}, [el("span", { class: `badge badge-${a.status || "draft"}`, text: t("status." + (a.status || "draft")) })]),
      el("td", { text: fmtDate(a.startedAt) }),
      el("td", { text: a.submittedAt ? fmtDate(a.submittedAt) : "—" }),
      el("td", { text: a.score != null ? `${a.score} / ${totalPossible}` : "—" })
    ]);
    tr.addEventListener("click", () => navigate(`/app/grading?exam=${exam.id}&attempt=${a.id}`));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  host.appendChild(wrap);
}

function renderQuestionsTab(host, exam) {
  const list = exam.questions || [];
  if (!list.length) {
    host.appendChild(el("div", { class: "empty" }, [el("p", { text: "No questions." })]));
    return;
  }
  const wrap = el("div", { class: "stack" });
  list.forEach((q, i) => {
    wrap.appendChild(el("div", { class: "card" }, [
      el("div", { class: "row-between mb-2" }, [
        el("span", { class: "fw-semibold", text: `Q${i + 1} · ${qTypeLabel(q.type)}` }),
        el("span", { class: "badge badge-draft", text: `${q.score} pts` })
      ]),
      el("p", { text: q.text || "—" })
    ]));
  });
  host.appendChild(wrap);
}

function renderGradingList(host, exam, attempts) {
  const pending = attempts.filter((a) => a.status === "submitted" || (a.status === "graded" && exam.questions?.some((q) => ["essay", "mcq_just", "tf_just"].includes(q.type))));
  if (!pending.length) {
    host.appendChild(el("div", { class: "empty" }, [el("p", { text: currentLang === "ar" ? "لا يوجد ما ينتظر التصحيح." : "Nothing waiting for grading." })]));
    return;
  }
  const wrap = el("div", { class: "stack" });
  pending.forEach((a) => {
    wrap.appendChild(el("div", { class: "card row-between" }, [
      el("div", {}, [
        el("div", { class: "fw-semibold", text: a.studentName }),
        el("div", { class: "text-sm text-muted", text: fmtDate(a.submittedAt) })
      ]),
      el("button", { class: "btn btn-primary btn-sm", type: "button", text: "Grade", onclick: () => navigate(`/app/grading?exam=${exam.id}&attempt=${a.id}`) })
    ]));
  });
  host.appendChild(wrap);
}

function shareExam(exam) {
  const url = `${location.origin}${location.pathname}#/exam?id=${exam.id}`;
  openModal({
    title: currentLang === "ar" ? "شارك الامتحان" : "Share exam",
    body: el("div", { class: "stack" }, [
      el("div", { class: "field" }, [
        el("label", { class: "field-label", text: "Exam link" }),
        el("div", { class: "row" }, [
          el("input", { class: "input flex-1", type: "text", readonly: "readonly", value: url }),
          el("button", { class: "btn btn-outline btn-sm", type: "button", text: "Copy", onclick: () => {
            navigator.clipboard.writeText(url);
            toast("Copied", "success");
          }})
        ])
      ])
    ]),
    actions: [{ label: "Close", class: "btn-primary" }]
  });
}

/* ============================================================
   GRADING
   ============================================================ */
async function renderGrading(params) {
  const examId = params?.get("exam");
  const attemptId = params?.get("attempt");
  const host = $("[data-grading-host]");
  if (!host) return;
  host.innerHTML = "";
  if (!examId || !attemptId) { host.appendChild(el("div", { class: "empty" }, [el("p", { text: "Missing info." })])); return; }

  const exam = await getExam(examId);
  const snap = await getDoc(doc(db, "attempts", attemptId));
  if (!exam || !snap.exists()) { host.appendChild(el("div", { class: "empty" }, [el("p", { text: "Not found." })])); return; }
  const attempt = { id: attemptId, ...snap.data() };
  const questions = exam.questions || [];
  const answers = attempt.answers || {};
  const manualScores = { ...(attempt.manualScores || {}) };
  const feedback = { ...(attempt.feedback || {}) };
  const totalPossible = questions.reduce((s, q) => s + (Number(q.score) || 0), 0);

  host.appendChild(el("div", { class: "card grading-student-head" }, [
    el("div", {}, [
      el("h2", { text: attempt.studentName || "Student" }),
      el("p", { class: "text-muted text-sm", text: fmtDate(attempt.submittedAt) })
    ]),
    el("div", { class: "row" }, [
      el("span", { class: `badge badge-${attempt.status || "draft"}`, text: t("status." + (attempt.status || "draft")) }),
      el("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Back", onclick: () => navigate(`/app/exam?id=${examId}`) })
    ])
  ]));

  const list = el("div", { class: "grading-answers" });
  host.appendChild(list);

  questions.forEach((q, i) => {
    const a = answers[q.id] || {};
    const isManual = ["essay", "mcq_just", "tf_just"].includes(q.type);
    const card = el("div", { class: "grading-card" });
    card.appendChild(el("div", { class: "grading-question", text: `Q${i + 1} · ${q.text}` }));

    const ansBlock = el("div", { class: "grading-answer-block" }, [
      el("strong", { text: currentLang === "ar" ? "إجابة الطالب" : "Student answer" })
    ]);
    if (q.type === "mcq" || q.type === "mcq_just") ansBlock.appendChild(el("div", { text: q.options?.[a.selectedIndex] || "—" }));
    else if (q.type === "tf" || q.type === "tf_just") ansBlock.appendChild(el("div", { text: a.boolValue === true ? "True" : a.boolValue === false ? "False" : "—" }));
    else if (q.type === "complete") ansBlock.appendChild(el("div", { text: a.textValue || "—" }));
    else if (q.type === "essay") ansBlock.appendChild(el("div", { text: a.essayText || "—", style: "white-space:pre-wrap" }));

    if (a.justification) {
      ansBlock.appendChild(el("div", { class: "mt-2", style: "white-space:pre-wrap" }, [
        el("strong", { text: currentLang === "ar" ? "التبرير" : "Justification" }),
        el("div", { text: a.justification })
      ]));
    }
    card.appendChild(ansBlock);

    // Show correct answer
    if (q.type !== "essay") {
      const corBlock = el("div", { class: "grading-answer-block" }, [
        el("strong", { text: currentLang === "ar" ? "الإجابة الصحيحة" : "Correct answer" })
      ]);
      let correctText = "—";
      if (q.type === "mcq" || q.type === "mcq_just") correctText = q.options?.[q.correctIndex] || "—";
      else if (q.type === "tf" || q.type === "tf_just") correctText = q.correctBool ? "True" : "False";
      else if (q.type === "complete") correctText = q.correctText || "—";
      corBlock.appendChild(el("div", { class: "grading-correct-answer", text: correctText }));
      card.appendChild(corBlock);
    }

    if (isManual) {
      const row = el("div", { class: "grading-score-row" }, [
        el("span", { class: "text-sm fw-semibold", text: currentLang === "ar" ? "الدرجة:" : "Score:" })
      ]);
      const num = el("input", { type: "number", class: "input", min: "0", max: String(q.score || 1), step: "0.5" });
      num.value = manualScores[q.id] ?? 0;
      num.addEventListener("input", () => { manualScores[q.id] = Number(num.value) || 0; });
      row.appendChild(num);
      row.appendChild(el("span", { class: "text-sm text-muted", text: `/ ${q.score || 1}` }));
      card.appendChild(row);

      const fbField = el("div", { class: "field mt-3" }, [
        el("label", { class: "field-label", text: currentLang === "ar" ? "ملاحظة" : "Feedback" })
      ]);
      const fbInput = el("input", { type: "text", class: "input", value: feedback[q.id] || "" });
      fbInput.addEventListener("input", () => { feedback[q.id] = fbInput.value; });
      fbField.appendChild(fbInput);
      card.appendChild(fbField);
    } else {
      card.appendChild(el("div", { class: "text-sm mt-2" }, [
        el("span", { class: "text-muted", text: "Auto-score: " }),
        el("strong", { text: `${a.autoScore || 0} / ${q.score || 1}` })
      ]));
    }

    list.appendChild(card);
  });

  // Overall feedback
  const examFbCard = el("div", { class: "card" }, [
    el("label", { class: "field-label mb-2", text: currentLang === "ar" ? "ملاحظات عامة" : "Overall feedback" })
  ]);
  const examFbTa = el("textarea", { class: "textarea" });
  examFbTa.value = attempt.examFeedback || "";
  examFbCard.appendChild(examFbTa);
  host.appendChild(examFbCard);

  function computeFinalScore() {
    let total = 0;
    questions.forEach((q) => {
      const a = answers[q.id] || {};
      if (["essay", "mcq_just", "tf_just"].includes(q.type)) total += Number(manualScores[q.id] || 0);
      else total += Number(a.autoScore || 0);
    });
    return total;
  }

  async function saveGrading() {
    const finalScore = computeFinalScore();
    await updateDoc(doc(db, "attempts", attemptId), {
      manualScores, feedback, examFeedback: examFbTa.value,
      score: finalScore,
      percentage: totalPossible ? Math.round((finalScore / totalPossible) * 100) : 0,
      gradedAt: serverTimestamp(),
      gradedBy: currentProfile.uid,
      status: "graded"
    });
  }

  const actions = el("div", { class: "card row-between" }, [
    el("div", {}, [
      el("div", { class: "text-sm text-muted", text: currentLang === "ar" ? "الدرجة الكلية" : "Total possible" }),
      el("div", { class: "fw-bold text-lg", text: String(totalPossible) })
    ]),
    el("div", { class: "row" }, [
      el("button", { class: "btn btn-outline", type: "button", text: currentLang === "ar" ? "حفظ التصحيح" : "Save grading", onclick: async () => {
        try { await saveGrading(); toast("Saved", "success"); }
        catch (err) { console.error(err); toast("Save failed", "error"); }
      }}),
      el("button", { class: "btn btn-primary", type: "button", text: currentLang === "ar" ? "نشر النتيجة" : "Publish result", onclick: async () => {
        try {
          await saveGrading();
          await updateDoc(doc(db, "exams", examId), { resultPublishedAt: serverTimestamp() });
          toast(currentLang === "ar" ? "تم نشر النتيجة" : "Result published", "success");
          navigate(`/app/exam?id=${examId}`);
        } catch (err) { console.error(err); toast("Publish failed", "error"); }
      }})
    ])
  ]);
  host.appendChild(actions);
}

/* ============================================================
   PROFILE / SETTINGS
   ============================================================ */
function renderProfile() {
  if (!currentProfile) return;
  $$("[data-profile-avatar]").forEach((e) => (e.src = currentProfile.photoURL || ""));
  $$("[data-profile-name]").forEach((e) => (e.textContent = currentProfile.fullName || ""));
  $$("[data-profile-handle]").forEach((e) => (e.textContent = "@" + (currentProfile.username || "")));
  $$("[data-profile-subject]").forEach((e) => (e.textContent = currentProfile.mainSubject || ""));
}

function renderSettings() {
  $$("[data-setting-theme]").forEach((r) => {
    r.checked = r.value === currentTheme;
    if (!r.dataset.bound) {
      r.dataset.bound = "1";
      r.addEventListener("change", () => { if (r.checked) setTheme(r.value); });
    }
  });
  $$("[data-setting-lang]").forEach((r) => {
    r.checked = r.value === currentLang;
    if (!r.dataset.bound) {
      r.dataset.bound = "1";
      r.addEventListener("change", () => { if (r.checked) setLang(r.value); });
    }
  });
}

/* ============================================================
   STUDENT EXAM
   ============================================================ */
const EXAM_STATE_KEY = (id) => `qeyasquiz.attempt.${id}`;
let examRuntime = null;

async function renderExam(params) {
  const examId = params?.get("id");
  const preview = params?.get("preview") === "1";

  const loading = $("[data-exam-loading]");
  const shell = $("[data-exam-shell]");
  const errorBox = $("[data-exam-error]");
  const entryModal = $("[data-entry-modal]");

  loading.hidden = false;
  shell.hidden = true;
  errorBox.hidden = true;
  entryModal.hidden = true;

  if (!examId) {
    loading.hidden = true;
    errorBox.hidden = false;
    $("[data-exam-error-title]").textContent = "Missing exam";
    $("[data-exam-error-message]").textContent = "No exam ID provided.";
    return;
  }

  let exam;
  try { exam = await getExam(examId); } catch (err) { console.error(err); }

  if (!exam) {
    loading.hidden = true;
    errorBox.hidden = false;
    $("[data-exam-error-title]").textContent = "Exam not found";
    $("[data-exam-error-message]").textContent = "This exam is unavailable.";
    return;
  }

  if (preview && currentUser && currentProfile?.uid === exam.ownerId) {
    loading.hidden = true;
    shell.hidden = false;
    startExamRuntime(exam, { preview: true });
    return;
  }

  const now = Date.now();
  const start = exam.startAt?.toMillis ? exam.startAt.toMillis() : null;
  const end = exam.endAt?.toMillis ? exam.endAt.toMillis() : null;
  if (start && now < start) {
    loading.hidden = true; errorBox.hidden = false;
    $("[data-exam-error-title]").textContent = "Exam not started";
    $("[data-exam-error-message]").textContent = `Opens at ${fmtDate(exam.startAt)}.`;
    return;
  }
  if (end && now > end) {
    loading.hidden = true; errorBox.hidden = false;
    $("[data-exam-error-title]").textContent = "Exam closed";
    $("[data-exam-error-message]").textContent = "This exam has ended.";
    return;
  }

  const existing = JSON.parse(localStorage.getItem(EXAM_STATE_KEY(examId)) || "null");
  if (existing && existing.attemptId) {
    try {
      const snap = await getDoc(doc(db, "attempts", existing.attemptId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === "submitted" || data.status === "graded") {
          sessionStorage.setItem("qeyasquiz.lastAttempt", existing.attemptId);
          loading.hidden = true;
          navigate("/result");
          return;
        }
        loading.hidden = true;
        showResumeModal(exam, existing);
        return;
      }
    } catch {}
    localStorage.removeItem(EXAM_STATE_KEY(examId));
  }

  loading.hidden = true;
  showEntryModal(exam);
}

function showEntryModal(exam) {
  const modal = $("[data-entry-modal]");
  const title = $("[data-entry-title]");
  const meta = $("[data-entry-meta]");
  const nameInput = $("[data-entry-name]");
  const nameError = $("[data-entry-name-error]");
  const codeField = $("[data-entry-code-field]");
  const codeInput = $("[data-entry-code]");
  const codeError = $("[data-entry-code-error]");
  const form = $("[data-entry-form]");
  const submit = $("[data-entry-submit]");

  title.textContent = exam.title || "Exam";
  meta.innerHTML = "";
  [["Teacher", exam.teacherName || "—"], ["Subject", exam.subject || "—"], ["Grade", exam.grade || "—"], ["Duration", `${exam.duration || 0} min`]]
    .forEach(([k, v]) => meta.appendChild(el("div", { class: "row-between" }, [el("span", { text: k }), el("span", { text: v })])));
  codeField.hidden = !exam.requireAccessCode;

  modal.hidden = false;

  form.onsubmit = async (e) => {
    e.preventDefault();
    let ok = true;
    const name = nameInput.value.trim();
    if (name.length < 3) { nameError.hidden = false; nameError.textContent = "Please enter your full name."; ok = false; }
    else nameError.hidden = true;
    if (exam.requireAccessCode) {
      if (codeInput.value.trim() !== (exam.accessCode || "")) {
        codeError.hidden = false; codeError.textContent = "Invalid access code."; ok = false;
      } else codeError.hidden = true;
    }
    if (!ok) return;

    submit.classList.add("is-loading");
    try {
      const attempt = await createAttempt(exam, name);
      modal.hidden = true;
      $("[data-exam-shell]").hidden = false;
      startExamRuntime(exam, { attempt });
    } catch (err) {
      console.error(err);
      submit.classList.remove("is-loading");
      toast("Could not start exam", "error");
    }
  };
}

async function createAttempt(exam, studentName) {
  const questions = exam.questions || [];
  let order = questions.map((q) => q.id);
  if (exam.shuffleQuestions) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  const nowMs = Date.now();
  const durationMs = (Number(exam.duration) || 60) * 60 * 1000;
  const endLimit = exam.endAt?.toMillis ? exam.endAt.toMillis() : Infinity;
  const deadlineMs = Math.min(nowMs + durationMs, endLimit);

  const payload = {
    examId: exam.id,
    studentName,
    questionOrder: order,
    answers: {},
    manualScores: {},
    feedback: {},
    status: "in_progress",
    startedAt: serverTimestamp(),
    startedAtMs: nowMs,
    deadlineMs,
    anticheatEvents: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, "attempts"), payload);
  localStorage.setItem(EXAM_STATE_KEY(exam.id), JSON.stringify({ attemptId: ref.id, examId: exam.id }));
  return { id: ref.id, ...payload, startedAtMs: nowMs, deadlineMs };
}

function showResumeModal(exam, existing) {
  const modal = $("[data-resume-modal]");
  modal.hidden = false;
  const btn = $("[data-resume-continue]");
  btn.onclick = async () => {
    modal.hidden = true;
    $("[data-exam-shell]").hidden = false;
    const snap = await getDoc(doc(db, "attempts", existing.attemptId));
    if (!snap.exists()) { navigate("/exam?id=" + exam.id); return; }
    startExamRuntime(exam, { attempt: { id: existing.attemptId, ...snap.data() } });
  };
}

/* ============================================================
   EXAM RUNTIME
   ============================================================ */
function startExamRuntime(exam, opts) {
  const { attempt, preview = false } = opts;
  const questions = exam.questions || [];
  const byId = {};
  questions.forEach((q) => (byId[q.id] = q));
  const orderedIds = preview ? questions.map((q) => q.id) : (attempt.questionOrder || questions.map((q) => q.id));
  const initialUpdatedAtMs = exam.updatedAt?.toMillis?.() || (exam.updatedAt?.seconds * 1000) || 0;

  const state = {
    exam, attempt, preview, questions, byId, orderedIds,
    index: 0,
    answers: preview ? {} : (attempt.answers || {}),
    deadlineMs: preview ? Date.now() + (exam.duration || 60) * 60000 : attempt.deadlineMs,
    timerInterval: null, autosaveInterval: null, heartbeatInterval: null,
    watcherUnsub: null,
    dirty: false, submitted: false, pendingExam: null,
    initialUpdatedAtMs
  };
  examRuntime = state;

  $("[data-watermark-teacher]").textContent = exam.teacherName || "";
  $("[data-exam-title]").textContent = exam.title || "Exam";
  $("[data-exam-meta]").textContent = `${exam.subject || ""} · ${exam.grade || ""}`;

  renderNav();
  showQuestion(0);
  startTimer();

  if (!preview) {
    startHeartbeat();
    startAnticheat();
    startAutosave();
    state.watcherUnsub = startExamRealtimeWatcher(exam.id, initialUpdatedAtMs);
  }

  $("[data-prev]").onclick = () => { if (state.index > 0) showQuestion(state.index - 1); };
  $("[data-next]").onclick = () => { if (state.index < state.orderedIds.length - 1) showQuestion(state.index + 1); };
  $("[data-submit-exam]").onclick = () => confirmSubmit();
  $("[data-exam-fullscreen]").onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  };
}

function renderNav() {
  const s = examRuntime;
  if (!s) return;
  const list = $("[data-nav-list]");
  if (!list) return;
  list.innerHTML = "";
  s.orderedIds.forEach((qid, i) => {
    const ans = isAnswered(s.answers[qid], s.byId[qid]);
    const li = el("button", {
      type: "button",
      class: `exam-nav-item ${ans ? "is-answered" : ""} ${i === s.index ? "is-current" : ""}`,
      text: String(i + 1),
      onclick: () => showQuestion(i)
    });
    list.appendChild(li);
  });
  const progress = $("[data-nav-progress]");
  if (progress) {
    const answered = s.orderedIds.filter((qid) => isAnswered(s.answers[qid], s.byId[qid])).length;
    progress.textContent = `${answered} / ${s.orderedIds.length}`;
  }
}

function isAnswered(a, q) {
  if (!a || !q) return false;
  if (q.type === "mcq" || q.type === "mcq_just") return a.selectedIndex != null;
  if (q.type === "tf" || q.type === "tf_just") return a.boolValue != null;
  if (q.type === "complete") return !!a.textValue;
  if (q.type === "essay") return !!a.essayText;
  return false;
}

function showQuestion(idx) {
  const s = examRuntime;
  if (!s) return;
  s.index = Math.max(0, Math.min(idx, s.orderedIds.length - 1));
  const qid = s.orderedIds[s.index];
  const q = s.byId[qid];
  const a = s.answers[qid] || {};
  const answers = { ...a };

  const host = $("[data-question-host]");
  host.innerHTML = "";

  host.appendChild(el("div", { class: "q-header" }, [
    el("div", { class: "q-number" }, [
      el("span", { class: "q-number-badge", text: String(s.index + 1) }),
      el("span", { text: `/ ${s.orderedIds.length}` })
    ]),
    el("span", { class: "q-score", text: `${q.score || 1} pts` })
  ]));
  host.appendChild(el("div", { class: "q-text", text: q.text || "" }));
  if (q.imageUrl) host.appendChild(el("img", { class: "q-image", src: q.imageUrl, alt: "" }));

  if (q.type === "mcq" || q.type === "mcq_just") {
    const optsWrap = el("div", { class: "q-options" });
    (q.options || []).forEach((opt, i) => {
      const isSel = answers.selectedIndex === i;
      const optEl = el("label", { class: `q-option ${isSel ? "is-selected" : ""}` });
      const inp = el("input", { type: "radio", name: "opt_" + q.id });
      inp.checked = isSel;
      inp.addEventListener("change", () => {
        answers.selectedIndex = i;
        saveAnswer(q.id, answers);
        renderNav();
        $$(".q-option", optsWrap).forEach((o) => o.classList.remove("is-selected"));
        optEl.classList.add("is-selected");
      });
      optEl.appendChild(inp);
      optEl.appendChild(el("span", { class: "q-option-mark", text: String.fromCharCode(65 + i) }));
      optEl.appendChild(el("span", { class: "q-option-text", text: opt }));
      optsWrap.appendChild(optEl);
    });
    host.appendChild(optsWrap);
    if (q.type === "mcq_just") host.appendChild(buildJustification(q, answers));
  } else if (q.type === "tf" || q.type === "tf_just") {
    const wrap = el("div", { class: "q-truefalse" });
    [{ v: true, l: "True" }, { v: false, l: "False" }].forEach(({ v, l }) => {
      const isSel = answers.boolValue === v;
      const optEl = el("label", { class: `q-option ${isSel ? "is-selected" : ""}` });
      const inp = el("input", { type: "radio", name: "tf_" + q.id });
      inp.checked = isSel;
      inp.addEventListener("change", () => {
        answers.boolValue = v;
        saveAnswer(q.id, answers);
        renderNav();
        $$(".q-option", wrap).forEach((o) => o.classList.remove("is-selected"));
        optEl.classList.add("is-selected");
      });
      optEl.appendChild(inp);
      optEl.appendChild(el("span", { class: "q-option-text", text: l }));
      wrap.appendChild(optEl);
    });
    host.appendChild(wrap);
    if (q.type === "tf_just") host.appendChild(buildJustification(q, answers));
  } else if (q.type === "complete") {
    const input = el("input", { class: "q-complete-input", type: "text", placeholder: "Type your answer…" });
    input.value = answers.textValue || "";
    input.addEventListener("input", debounce(() => {
      answers.textValue = input.value;
      saveAnswer(q.id, answers);
      renderNav();
    }, 400));
    host.appendChild(input);
  } else if (q.type === "essay") {
    const ta = el("textarea", { class: "q-essay-textarea", placeholder: "Write your answer…" });
    ta.value = answers.essayText || "";
    ta.addEventListener("input", debounce(() => {
      answers.essayText = ta.value;
      saveAnswer(q.id, answers);
      renderNav();
    }, 500));
    host.appendChild(ta);
  }

  updateProgress();
  renderNav();
  $("[data-prev]").disabled = s.index === 0;
  $("[data-next]").disabled = s.index === s.orderedIds.length - 1;
}

function buildJustification(q, answers) {
  const box = el("div", { class: "q-justification" }, [
    el("div", { class: "q-justification-label" }, [
      svgIcon("check-square", 14),
      document.createTextNode(currentLang === "ar" ? "التبرير (تصحيح يدوي)" : "Justification (manual grading)")
    ])
  ]);
  const ta = el("textarea", { class: "q-justification-textarea" });
  ta.value = answers.justification || "";
  ta.addEventListener("input", debounce(() => {
    answers.justification = ta.value;
    saveAnswer(q.id, answers);
  }, 500));
  box.appendChild(ta);
  box.appendChild(el("p", { class: "q-justification-hint", text: currentLang === "ar" ? "سيتم تصحيح هذا يدويًا." : "This will be manually graded." }));
  return box;
}

function saveAnswer(qid, answers) {
  const s = examRuntime;
  if (!s || s.preview) return;
  s.answers[qid] = answers;
  s.dirty = true;
}

function updateProgress() {
  const s = examRuntime;
  if (!s) return;
  const answered = s.orderedIds.filter((qid) => isAnswered(s.answers[qid], s.byId[qid])).length;
  const pct = s.orderedIds.length ? Math.round((answered / s.orderedIds.length) * 100) : 0;
  const bar = $("[data-progress-bar]");
  const text = $("[data-progress-text]");
  if (bar) bar.style.width = pct + "%";
  if (text) text.textContent = pct + "%";
}

function startTimer() {
  const s = examRuntime;
  const elVal = $("[data-timer-value]");
  const elBox = $("[data-timer]");
  function tick() {
    const remaining = s.deadlineMs - Date.now();
    if (remaining <= 0) {
      elVal.textContent = "00:00:00";
      elBox.classList.add("is-critical");
      clearInterval(s.timerInterval);
      if (!s.preview) autoSubmit("time_up");
      return;
    }
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    elVal.textContent = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    elBox.classList.remove("is-warning", "is-critical");
    if (remaining < 60000) elBox.classList.add("is-critical");
    else if (remaining < 5 * 60000) elBox.classList.add("is-warning");
  }
  tick();
  s.timerInterval = setInterval(tick, 1000);
}

function startAutosave() {
  const s = examRuntime;
  s.autosaveInterval = setInterval(async () => {
    if (!s.dirty || s.submitted) return;
    if (!navigator.onLine) return;
    try {
      await updateDoc(doc(db, "attempts", s.attempt.id), {
        answers: s.answers, updatedAt: serverTimestamp()
      });
      s.dirty = false;
    } catch (err) { console.warn("autosave", err); }
  }, 5000);
}

function startHeartbeat() {
  const s = examRuntime;
  s.heartbeatInterval = setInterval(async () => {
    if (s.submitted || !navigator.onLine) return;
    try {
      await updateDoc(doc(db, "attempts", s.attempt.id), {
        lastActiveAt: serverTimestamp()
      });
    } catch {}
  }, 15000);
}

function startAnticheat() {
  const s = examRuntime;
  const log = (type) => {
    if (s.submitted) return;
    s.attempt.anticheatEvents = s.attempt.anticheatEvents || [];
    s.attempt.anticheatEvents.push({ type, at: Date.now() });
    updateDoc(doc(db, "attempts", s.attempt.id), { anticheatEvents: s.attempt.anticheatEvents }).catch(() => {});
  };
  document.addEventListener("visibilitychange", () => log(document.hidden ? "tab_hidden" : "tab_visible"));
  window.addEventListener("blur", () => log("blur"));
  window.addEventListener("focus", () => log("focus"));
  window.addEventListener("offline", () => {
    log("offline");
    const b = $("[data-offline-banner]"); if (b) b.hidden = false;
    const i = $("[data-connection-indicator]"); if (i) i.classList.add("is-offline");
  });
  window.addEventListener("online", () => {
    log("online");
    const b = $("[data-offline-banner]"); if (b) b.hidden = true;
    const i = $("[data-connection-indicator]"); if (i) i.classList.remove("is-offline");
  });
}

function confirmSubmit() {
  const s = examRuntime;
  const answered = s.orderedIds.filter((qid) => isAnswered(s.answers[qid], s.byId[qid])).length;
  const total = s.orderedIds.length;
  const unanswered = total - answered;

  const summary = $("[data-confirm-summary]");
  summary.innerHTML = "";
  summary.appendChild(el("div", { class: "row-between" }, [
    el("span", { text: currentLang === "ar" ? "تمت الإجابة" : "Answered" }),
    el("span", { text: `${answered} / ${total}` })
  ]));
  if (unanswered > 0) {
    summary.appendChild(el("div", { class: "row-between" }, [
      el("span", { text: currentLang === "ar" ? "بدون إجابة" : "Unanswered" }),
      el("span", { text: String(unanswered), style: "color:var(--warning-500)" })
    ]));
  }
  const modal = $("[data-confirm-submit-modal]");
  modal.hidden = false;
  $("[data-confirm-cancel]").onclick = () => { modal.hidden = true; };
  $("[data-confirm-submit]").onclick = () => { modal.hidden = true; performSubmit("manual"); };
}

async function autoSubmit(reason) {
  const s = examRuntime;
  if (!s || s.submitted) return;
  toast(currentLang === "ar" ? "تم تسليم الامتحان تلقائيًا" : "Auto-submitted", "warning");
  await performSubmit("auto", reason);
}

async function performSubmit(kind = "manual", reason = null) {
  const s = examRuntime;
  if (!s || s.submitted) return;
  s.submitted = true;

  clearInterval(s.timerInterval);
  clearInterval(s.autosaveInterval);
  clearInterval(s.heartbeatInterval);
  if (s.watcherUnsub) { try { s.watcherUnsub(); } catch {} s.watcherUnsub = null; }

  // Compute auto scores
  let total = 0;
  s.questions.forEach((q) => {
    const a = s.answers[q.id] || {};
    let sc = 0;
    if (q.type === "mcq") { if (a.selectedIndex === q.correctIndex) sc = Number(q.score) || 0; }
    else if (q.type === "tf") { if (a.boolValue === q.correctBool) sc = Number(q.score) || 0; }
    else if (q.type === "complete") {
      const norm = (v) => String(v || "").trim().toLowerCase();
      if (norm(a.textValue) === norm(q.correctText)) sc = Number(q.score) || 0;
    }
    a.autoScore = sc;
    s.answers[q.id] = a;
    total += sc;
  });

  const totalPossible = s.questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
  const percentage = totalPossible ? Math.round((total / totalPossible) * 100) : 0;

  try {
    await updateDoc(doc(db, "attempts", s.attempt.id), {
      answers: s.answers,
      autoScore: total,
      score: total,
      percentage,
      totalPossible,
      status: "submitted",
      submitKind: kind,
      submitReason: reason,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    sessionStorage.setItem("qeyasquiz.lastAttempt", s.attempt.id);
    localStorage.removeItem(EXAM_STATE_KEY(s.exam.id));
    navigate("/result");
  } catch (err) {
    console.error(err);
    s.submitted = false;
    toast("Submission failed. Please retry.", "error");
  }
}

/* ============================================================
   REALTIME WATCHER
   ============================================================ */
function startExamRealtimeWatcher(examId, initialUpdatedAtMs) {
  const unsub = onSnapshot(doc(db, "exams", examId), (snap) => {
    if (!snap.exists()) {
      const s = examRuntime;
      if (s && !s.submitted) { s.pendingExam = null; showExamDeletedModal(); }
      return;
    }
    const newExam = { id: snap.id, ...snap.data() };
    const newUpdatedAtMs = newExam.updatedAt?.toMillis?.() || (newExam.updatedAt?.seconds * 1000) || 0;
    const s = examRuntime;
    if (!s || s.submitted || s.preview) return;
    if (newUpdatedAtMs > initialUpdatedAtMs) {
      const structural = JSON.stringify(newExam.questions || []) !== JSON.stringify(s.exam.questions || []);
      if (structural) { s.pendingExam = newExam; showExamUpdateModal(); }
      else s.exam = { ...s.exam, ...newExam };
    }
  }, (err) => console.warn("[realtime]", err));
  return unsub;
}

function showExamUpdateModal() {
  const modal = $("[data-update-modal]");
  if (!modal || !modal.hidden) return;
  modal.hidden = false;
  const btn = $("[data-update-refresh]");
  btn.onclick = () => { modal.hidden = true; applyExamUpdate(); };
}

function showExamDeletedModal() {
  openModal({
    title: currentLang === "ar" ? "تم حذف الامتحان" : "Exam Deleted",
    body: currentLang === "ar" ? "قام المعلم بحذف هذا الامتحان. سيتم تسليم إجاباتك تلقائيًا." : "The teacher has deleted this exam. Your answers will be submitted automatically.",
    actions: [{ label: "Submit now", class: "btn-primary", onClick: async () => {
      const s = examRuntime;
      if (s && !s.submitted) await performSubmit("auto", "exam_deleted");
    }}]
  });
}

async function applyExamUpdate() {
  const s = examRuntime;
  if (!s || !s.pendingExam || s.submitted) return;
  const newExam = s.pendingExam;
  s.pendingExam = null;
  const preserved = { ...s.answers };
  s.exam = newExam;
  s.questions = newExam.questions || [];
  s.byId = {};
  s.questions.forEach((q) => { s.byId[q.id] = q; });

  const existingIds = new Set(s.questions.map((q) => q.id));
  const oldOrder = s.orderedIds || [];
  const kept = oldOrder.filter((id) => existingIds.has(id));
  const newIds = s.questions.map((q) => q.id).filter((id) => !kept.includes(id));
  s.orderedIds = [...kept, ...newIds];

  const visible = {};
  s.orderedIds.forEach((qid) => { if (preserved[qid]) visible[qid] = preserved[qid]; });
  s.answers = visible;
  if (s.index >= s.orderedIds.length) s.index = Math.max(0, s.orderedIds.length - 1);

  $("[data-exam-title]").textContent = newExam.title || "Exam";
  $("[data-exam-meta]").textContent = `${newExam.subject || ""} · ${newExam.grade || ""}`;

  renderNav();
  showQuestion(s.index);
  updateProgress();

  try {
    await updateDoc(doc(db, "attempts", s.attempt.id), {
      answers: s.answers,
      orderedIds: s.orderedIds,
      updatedAt: serverTimestamp()
    });
  } catch {}
  s.dirty = false;
  toast(currentLang === "ar" ? "تم تحديث الامتحان" : "Exam updated", "info");
}

/* ============================================================
   RESULT
   ============================================================ */
async function renderResult() {
  const loading = $("[data-result-loading]");
  const main = $("[data-result-main]");
  const attemptId = sessionStorage.getItem("qeyasquiz.lastAttempt");

  if (!attemptId) {
    loading.hidden = true;
    main.hidden = false;
    $("[data-result-exam-title]").textContent = currentLang === "ar" ? "لا يوجد امتحان" : "No exam";
    return;
  }

  let attempt, exam;
  try {
    const aSnap = await getDoc(doc(db, "attempts", attemptId));
    if (!aSnap.exists()) throw new Error("no attempt");
    attempt = { id: attemptId, ...aSnap.data() };
    exam = await getExam(attempt.examId);
  } catch {
    loading.hidden = true; main.hidden = false;
    $("[data-result-exam-title]").textContent = "Not found";
    return;
  }

  loading.hidden = true;
  main.hidden = false;

  const resultPublished = exam?.resultPublishedAt != null;
  $("[data-result-status]").textContent = t("status." + (attempt.status || "submitted"));
  $("[data-result-exam-title]").textContent = exam?.title || "Exam";
  $("[data-result-meta]").textContent = `${exam?.subject || ""} · ${exam?.grade || ""} · ${attempt.studentName || ""}`;

  const scoreBlock = $("[data-score-block]");
  const waitingBlock = $("[data-waiting-block]");
  const feedbackBlock = $("[data-feedback-block]");
  const reviewHead = $("[data-review-head]");
  const reviewHost = $("[data-result-review]");
  const totalPossible = attempt.totalPossible || (exam?.questions?.reduce((s, q) => s + (Number(q.score) || 0), 0)) || 0;

  if (resultPublished && attempt.score != null) {
    scoreBlock.hidden = false;
    waitingBlock.hidden = true;
    $("[data-score-value]").textContent = String(attempt.score);
    $("[data-score-total]").textContent = `/ ${totalPossible}`;
    $("[data-score-percentage]").textContent = `${attempt.percentage || 0}%`;
    if (attempt.examFeedback) {
      feedbackBlock.hidden = false;
      $("[data-feedback-text]").textContent = attempt.examFeedback;
    }
  } else {
    scoreBlock.hidden = true;
    waitingBlock.hidden = false;
  }

  if (resultPublished && exam?.questions) {
    reviewHead.hidden = false;
    reviewHost.innerHTML = "";
    exam.questions.forEach((q, i) => {
      const a = attempt.answers?.[q.id] || {};
      const autoSc = Number(a.autoScore || 0);
      const manSc = Number((attempt.manualScores || {})[q.id] || 0);
      const got = ["essay", "mcq_just", "tf_just"].includes(q.type) ? manSc : autoSc;
      const max = Number(q.score) || 1;
      let cls = "";
      if (got >= max) cls = "is-correct";
      else if (got === 0) cls = "is-wrong";
      else cls = "is-partial";

      const card = el("div", { class: `review-card ${cls}` });
      card.appendChild(el("div", { class: "review-head" }, [
        el("div", { class: "review-num" }, [
          el("span", { class: "q-number-badge", text: String(i + 1) }),
          el("span", { text: qTypeLabel(q.type) })
        ]),
        el("span", { class: `review-score ${cls}`, text: `${got} / ${max}` })
      ]));
      card.appendChild(el("div", { class: "review-question", text: q.text || "" }));

      const answersWrap = el("div", { class: "review-answers" });
      let studentText = "—";
      let correctText = "—";
      if (q.type === "mcq" || q.type === "mcq_just") {
        studentText = a.selectedIndex != null ? q.options?.[a.selectedIndex] : "—";
        correctText = q.options?.[q.correctIndex] || "—";
      } else if (q.type === "tf" || q.type === "tf_just") {
        studentText = a.boolValue === true ? "True" : a.boolValue === false ? "False" : "—";
        correctText = q.correctBool ? "True" : "False";
      } else if (q.type === "complete") {
        studentText = a.textValue || "—";
        correctText = q.correctText || "—";
      } else if (q.type === "essay") {
        studentText = a.essayText || "—";
        correctText = q.modelAnswer || "—";
      }

      answersWrap.appendChild(el("div", { class: "review-answer is-wrong" }, [
        el("strong", { text: currentLang === "ar" ? "إجابتك" : "Your answer" }),
        el("div", { text: studentText, style: "white-space:pre-wrap" })
      ]));
      if (q.type !== "essay" && correctText !== "—") {
        answersWrap.appendChild(el("div", { class: "review-answer is-correct" }, [
          el("strong", { text: currentLang === "ar" ? "الإجابة الصحيحة" : "Correct answer" }),
          el("div", { text: correctText, style: "white-space:pre-wrap" })
        ]));
      }
      if (q.type === "essay" && q.modelAnswer) {
        answersWrap.appendChild(el("div", { class: "review-answer is-correct" }, [
          el("strong", { text: currentLang === "ar" ? "الإجابة النموذجية" : "Model answer" }),
          el("div", { text: q.modelAnswer, style: "white-space:pre-wrap" })
        ]));
      }
      if (a.justification) {
        answersWrap.appendChild(el("div", { class: "review-answer" }, [
          el("strong", { text: currentLang === "ar" ? "تبريرك" : "Your justification" }),
          el("div", { text: a.justification, style: "white-space:pre-wrap" })
        ]));
      }
      card.appendChild(answersWrap);
      reviewHost.appendChild(card);
    });
  }
}

/* ============================================================
   GLOBAL EVENTS
   ============================================================ */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-theme-toggle]")) { toggleTheme(); return; }
  const langBtn = e.target.closest("[data-lang]");
  if (langBtn) { setLang(langBtn.dataset.lang); return; }
  if (e.target.closest("[data-signout]")) { signOutUser(); return; }
  if (e.target.closest("[data-create-exam]")) { navigate("/app/builder"); return; }
  const sideToggle = e.target.closest("[data-sidebar-toggle]");
  if (sideToggle) {
    const sidebar = $("[data-sidebar]");
    const scrim = $("[data-sidebar-scrim]");
    sidebar.classList.add("is-open");
    scrim.classList.add("is-open");
    return;
  }
  if (e.target.closest("[data-sidebar-scrim]")) {
    $("[data-sidebar]").classList.remove("is-open");
    $("[data-sidebar-scrim]").classList.remove("is-open");
    return;
  }
});

window.addEventListener("hashchange", handleRoute);

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  setTheme(currentTheme);
  setLang(currentLang);
  initMyExamsFilters();
  handleRoute();
})();
