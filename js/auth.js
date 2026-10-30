/* Alpine Ascents – account sign-in (front-end only)
 * Accounts live in the browser's localStorage. Passwords are salted + hashed
 * (SHA-256) so they are never stored as plain text. This is fine for an
 * eProject, but real sites must authenticate on a server.
 */
(function () {
  "use strict";

  const USERS_KEY = "sb_users";      // all registered accounts
  const SESSION_KEY = "sb_session";  // currently logged-in user

  /* ---------- storage helpers ---------- */
  function readJSON(store, key, fallback) {
    try { return JSON.parse(store.getItem(key)) ?? fallback; }
    catch (e) { return fallback; }
  }
  const getUsers = () => readJSON(localStorage, USERS_KEY, []);
  const saveUsers = (list) => localStorage.setItem(USERS_KEY, JSON.stringify(list));

  function getSession() {
    return readJSON(sessionStorage, SESSION_KEY, null) || readJSON(localStorage, SESSION_KEY, null);
  }
  function setSession(user, remember) {
    const data = JSON.stringify({ name: user.name, email: user.email });
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, data);
  }
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  /* ---------- hashing ---------- */
  function randomSalt() {
    const bytes = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashPassword(password, salt) {
    const text = salt + password;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback for very old browsers (simple, NOT cryptographically strong)
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return "fb" + h.toString(16);
  }

  /* ---------- validation ---------- */
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const passwordOk = (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

  function mark(input, valid) {
    input.classList.toggle("is-invalid", !valid);
    input.classList.toggle("is-valid", valid);
    return valid;
  }
  function showAlert(msg, type) {
    const box = document.getElementById("authAlert");
    if (!box) return;
    box.textContent = msg;
    box.className = "auth-alert show " + (type || "");
  }
  function hideAlert() {
    const box = document.getElementById("authAlert");
    if (box) box.className = "auth-alert";
  }

    /* ---------- navbar: Login  <->  [A] Logout ---------- */
  function renderNav() {
    const slot = document.getElementById("authNavItem");
    if (!slot) return;
    const session = getSession();
    slot.textContent = "";

    if (session) {
      const wrap = document.createElement("span");
      wrap.className = "nav-user";

      // Round badge showing the first letter of the user's name
      const avatar = document.createElement("span");
      avatar.className = "nav-avatar";
      avatar.textContent = session.name.trim().charAt(0).toUpperCase();
      avatar.title = session.name;                       // full name shows on hover
      avatar.setAttribute("aria-label", "Logged in as " + session.name);
      wrap.appendChild(avatar);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Logout";
      btn.addEventListener("click", () => { clearSession(); window.location.href = SITE_ROOT + "pages/login.html"; });
      wrap.appendChild(btn);
      slot.appendChild(wrap);
    } else {
      const a = document.createElement("a");
      a.className = "btn btn-accent nav-cta";
      a.href = SITE_ROOT + "pages/login.html";
      a.textContent = "Login";
      slot.appendChild(a);
    }
  }

  /* ---------- sign up ---------- */
  function initSignup() {
    const form = document.getElementById("signupForm");
    if (!form) return;
    const name = form.querySelector("#signupName");
    const email = form.querySelector("#signupEmail");
    const pw = form.querySelector("#signupPassword");
    const confirm = form.querySelector("#signupConfirm");
    const agree = form.querySelector("#agreeTerms");
    const bar = document.getElementById("pwBar");

    // live password strength meter
    pw.addEventListener("input", () => {
      let score = 0;
      if (pw.value.length >= 8) score++;
      if (/[A-Z]/.test(pw.value) && /[a-z]/.test(pw.value)) score++;
      if (/\d/.test(pw.value)) score++;
      if (/[^A-Za-z0-9]/.test(pw.value)) score++;
      const colors = ["#e07a6b", "#e0a86b", "#d9b77b", "#6fae85"];
      bar.style.width = (pw.value ? score * 25 : 0) + "%";
      bar.style.background = colors[Math.max(score - 1, 0)];
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const results = [
        mark(name, name.value.trim().length >= 2),
        mark(email, emailOk(email.value.trim())),
        mark(pw, passwordOk(pw.value)),
        mark(confirm, confirm.value === pw.value && confirm.value !== ""),
      ];
      agree.classList.toggle("is-invalid", !agree.checked);
      if (!agree.checked || results.includes(false)) return;

      const users = getUsers();
      const mail = email.value.trim().toLowerCase();
      if (users.some(u => u.email === mail)) {
        mark(email, false);
        showAlert("An account with this email already exists. Please login.", "error");
        return;
      }

      const salt = randomSalt();
      users.push({
        id: Date.now(),
        name: name.value.trim(),
        email: mail,
        salt: salt,
        hash: await hashPassword(pw.value, salt),
        created: new Date().toISOString(),
      });
      saveUsers(users);

      form.reset();
      form.querySelectorAll(".is-valid,.is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
      bar.style.width = "0";
      document.getElementById("login-tab").click();
      document.getElementById("loginEmail").value = mail;
      showAlert("Account created! Please login to continue.", "success");
    });
  }

  /* ---------- login ---------- */
  function initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    const email = form.querySelector("#loginEmail");
    const pw = form.querySelector("#loginPassword");
    const remember = form.querySelector("#rememberMe");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const ok = [mark(email, emailOk(email.value.trim())), mark(pw, pw.value !== "")];
      if (ok.includes(false)) return;

      const user = getUsers().find(u => u.email === email.value.trim().toLowerCase());
      const attempt = user ? await hashPassword(pw.value, user.salt) : null;

      // Same message for "no user" and "wrong password" so attackers can't tell which
      if (!user || attempt !== user.hash) {
        showAlert("Incorrect email or password.", "error");
        return;
      }

      setSession(user, remember.checked);
      showAlert("Login successful. Redirecting…", "success");
      setTimeout(() => { window.location.href = SITE_ROOT + "index.html"; }, 700);
    });
  }

  /* ---------- small UI helpers ---------- */
  function initUI() {
    // Show / hide password buttons
    document.querySelectorAll("[data-toggle-pw]").forEach(btn => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.togglePw);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Hide" : "Show";
      });
    });
    // "Create an account" / "Login" links that switch tabs
    document.querySelectorAll("[data-goto]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        hideAlert();
        document.getElementById(link.dataset.goto).click();
      });
    });
    // Tabs: keep the gold "active" look in sync and clear any old alert
    const tabBtns = document.querySelectorAll("#authTabs button");
    tabBtns.forEach(b => b.addEventListener("click", () => {
      hideAlert();
      tabBtns.forEach(t => t.classList.toggle("active", t === b));
    }));
    // Already logged in? No need to see the login form
    if (document.getElementById("loginForm") && getSession()) window.location.href = SITE_ROOT + "index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderNav();
    initUI();
    initSignup();
    initLogin();
  });

  // Exposed so other pages can protect content, e.g. if (!SBAuth.isLoggedIn()) ...
  window.SBAuth = { isLoggedIn: () => !!getSession(), getUser: getSession, logout: () => { clearSession(); renderNav(); } };
})();
