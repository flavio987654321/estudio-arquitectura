// js/auth.js (Firebase Auth real)
import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

function getEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  // Soporta IDs viejos y nuevos
  const form = getEl("formLogin", "loginForm");
  const user = getEl("loginUser", "usuario"); // ahora será EMAIL
  const pass = getEl("loginPass", "clave");
  const err  = getEl("loginError", "loginMsg");

  if (!form || !user || !pass) {
    console.warn("auth.js: No encuentro elementos del login. Revisá IDs en login.html");
    return;
  }

  // Si ya está logueado en Firebase, directo al panel
  onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) window.location.href = "panel.html";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (err) err.textContent = "";

    const email = (user.value || "").trim();
    const password = (pass.value || "").trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged redirige, pero dejamos esto por seguridad:
      window.location.href = "panel.html";
    } catch (error) {
      console.error(error);
      if (err) err.textContent = "Email o contraseña incorrectos.";
    }
  });
});
