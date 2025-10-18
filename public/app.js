console.log("app.js cargado ✔");
// Espera a que Firebase esté inicializado por init.js
function waitForFirebaseApp(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      try {
        if (window.firebase && firebase.apps && firebase.apps.length > 0) {
          return resolve(firebase.app());
        }
      } catch (_) {}
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("Firebase no se inicializó a tiempo."));
      }
      setTimeout(check, 50);
    })();
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const app = await waitForFirebaseApp();
    console.log("Firebase listo:", app.name);

    const auth = firebase.auth();

    // Elementos del DOM
    const emailEl       = document.getElementById("email");
    const passEl        = document.getElementById("password");
    const btnRegister   = document.getElementById("btn-register");
    const btnLogin      = document.getElementById("btn-login");
    const btnLogout     = document.getElementById("btn-logout");
    const btnReset      = document.getElementById("btn-reset");
    const authBox       = document.getElementById("auth-box");
    const userBox       = document.getElementById("user-box");
    const userEmail     = document.getElementById("user-email");
    const verifyWarning = document.getElementById("verify-warning");

    const normEmail = () => (emailEl.value || "").trim();
    const normPass  = () => passEl.value || "";
    const showAuth  = () => { authBox.style.display = "block"; userBox.style.display = "none"; };
    const showUser  = () => { authBox.style.display = "none"; userBox.style.display = "block"; };

    // ===== Registro =====
    btnRegister.addEventListener("click", async () => {
      try {
        const email = normEmail();
        const pass = normPass();
        if (!email || pass.length < 6) {
          alert("Correo y contraseña (mínimo 6) requeridos.");
          return;
        }
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await cred.user.sendEmailVerification();
        alert("Usuario registrado. Se envió un correo de verificación. Verifícalo antes de iniciar sesión.");
        logSecurityEvent("register_success", { user: email });
        await auth.signOut();
      } catch (e) {
        console.error(e);
        logSecurityEvent("register_failed", { user: normEmail(), error: e.message });
        alert("Error al registrar: " + e.message);
      }
    });

    // ===== Login =====
    btnLogin.addEventListener("click", async () => {
      try {
        await auth.signInWithEmailAndPassword(normEmail(), normPass());
        logSecurityEvent("login_success", { user: normEmail() });
      } catch (e) {
        console.error(e);
        logSecurityEvent("login_failed", { user: normEmail(), error: e.message });
        alert("Error al iniciar sesión: " + e.message);
      }
    });

    // ===== Reset de contraseña =====
    btnReset.addEventListener("click", async () => {
      try {
        const email = normEmail();
        if (!email) return alert("Escribe tu correo para enviarte el enlace de restablecimiento.");
        await auth.sendPasswordResetEmail(email);
        logSecurityEvent("password_reset", { user: email });
        alert("Correo para restablecer contraseña enviado.");
      } catch (e) {
        console.error(e);
        logSecurityEvent("password_reset_failed", { user: normEmail(), error: e.message });
        alert("Error al enviar el correo: " + e.message);
      }
    });

    // ===== Logout =====
    btnLogout.addEventListener("click", async () => {
      await auth.signOut();
      logSecurityEvent("logout", { user: normEmail() });
    });

    // ===== Control de sesión y verificación =====
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        showAuth();
        verifyWarning.style.display = "none";
        return;
      }

      await user.reload();
      if (!user.emailVerified) {
        showUser();
        userEmail.textContent = user.email || "";
        verifyWarning.style.display = "block";
        logSecurityEvent("unverified_access", { user: user.email });
        await auth.signOut();
        return;
      }

      userEmail.textContent = user.email || "";
      verifyWarning.style.display = "none";
      showUser();
      logSecurityEvent("verified_login", { user: user.email });
    });

  } catch (err) {
    console.error("Error al iniciar app:", err);
    alert("No se pudo inicializar Firebase. Revisa la consola.");
  }
});
