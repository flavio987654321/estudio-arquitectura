import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  // ==================================================
  // 0) Cargar proyectos desde PANEL (localStorage) o data.js
  // ==================================================
let PROYECTOS_APP = [];

async function cargarProyectosDesdeFirestore() {
  const snap = await getDocs(collection(db, "proyectos"));
  PROYECTOS_APP = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

await cargarProyectosDesdeFirestore();

  // ==================================================
  // 1) INDEX.HTML -> Render listado
  // ==================================================
const grid = document.getElementById("gridProyectos");

if (grid && PROYECTOS_APP.length) {

  grid.innerHTML = "";

  PROYECTOS_APP.forEach(p => {
    const card = document.createElement("article");
    card.className = "card-proyecto";

    const portada = Array.isArray(p.fotos) && p.fotos.length ? p.fotos[0] : "";

    const imgDiv = document.createElement("div");
    imgDiv.className = "img-proyecto";

    if (portada) {
    imgDiv.classList.add("con-foto");
    imgDiv.style.backgroundImage = `url("${portada}")`;
  }

    card.appendChild(imgDiv);

    const h4 = document.createElement("h4");
    h4.textContent = p.nombre || "Proyecto";
    card.appendChild(h4);

    const pDesc = document.createElement("p");
    pDesc.textContent = p.descripcion || "Ver detalles del proyecto.";
    card.appendChild(pDesc);

    const a = document.createElement("a");
    a.className = "btn";
    a.href = `proyecto.html?id=${p.id}`;
    a.textContent = "Ver proyecto";
    card.appendChild(a);

    grid.appendChild(card);
  });
}

  // ==================================================
  // 2) PROYECTO.HTML
  // ==================================================
  const titulo = document.getElementById("tituloProyecto");
  const ubic = document.getElementById("ubicacionProyecto");
  const desc = document.getElementById("descProyecto");
  const listaUnidades = document.getElementById("listaUnidades");

  if (!titulo && !ubic && !desc && !listaUnidades) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const proyectos = PROYECTOS_APP || [];
  const proyecto = proyectos.find(p => p.id === id) || proyectos[0];
  if (!proyecto) return;

  // Texto
  titulo.textContent = proyecto.nombre || "Proyecto";
  ubic.textContent = `📍 ${proyecto.ubicacion || ""}`;
  desc.textContent = proyecto.descripcion || "";

  // WhatsApp
  const btnWpp = document.getElementById("btnWpp");
  if (btnWpp && proyecto.whatsapp) {
    const msg = encodeURIComponent(
      proyecto.mensajeWpp || `Hola! Quiero info sobre ${proyecto.nombre}.`
    );
    btnWpp.href = `https://wa.me/${proyecto.whatsapp}?text=${msg}`;
  }

  // Unidades
listaUnidades.innerHTML = "";

if (!proyecto.unidades || !proyecto.unidades.length) {
  listaUnidades.innerHTML = "<p>No hay unidades cargadas.</p>";
} else {
  const grupos = {};
  proyecto.unidades.forEach(u => {
    const key = (u.piso || "Sin piso").trim() || "Sin piso";
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(u);
  });

  const ordenPisos = [
    "Planta baja",
    "1° piso",
    "2° piso",
    "3° piso",
    "4° piso",
    "5° piso",
    "6° piso",
    "7° piso",
    "8° piso",
    "9° piso",
    "10° piso",
    "Cocheras",
    "Terraza",
    "Otro",
    "Sin piso"
  ];

  const ordenarPisos = (a, b) => {
    const ia = ordenPisos.indexOf(a);
    const ib = ordenPisos.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, "es");
  };

  Object.keys(grupos).sort(ordenarPisos).forEach(piso => {
    const bloque = document.createElement("div");
    bloque.className = "unidades-piso";
    bloque.innerHTML = `<h4 class="piso-title">${piso}</h4>`;

    grupos[piso].forEach(u => {
      const div = document.createElement("div");
      div.className = "unidad";

      const moneda = (u.moneda || "USD").toUpperCase();
      const precioTxt = u.precio ? `${moneda} ${u.precio}` : "Consultar";
      const wpp = proyecto.whatsapp || "";
      const baseMsg = proyecto.mensajeWpp || `Hola! Quiero info sobre ${proyecto.nombre}.`;
      const extra = [
        `Unidad: ${u.nombre || "-"}`,
        `Piso: ${u.piso || "-"}`,
        `Ambientes: ${u.ambientes || "-"}`,
        `Metros: ${u.metros || "-"} m²`,
        `Precio: ${precioTxt}`
      ].join(" | ");
      const wppMsg = encodeURIComponent(`${baseMsg} (${extra})`);
      const wppHref = wpp ? `https://wa.me/${wpp}?text=${wppMsg}` : "";
      const mostrarConsultar = wppHref && (u.estado || "").toLowerCase() !== "vendida";

      div.innerHTML = `
        <div class="unidad-header">
          <strong>${u.nombre || "Unidad"}</strong>
        </div>

        <div class="unidad-info">
          <span>🛏️ ${u.ambientes || "-"} amb</span>
          <span>📐 ${u.metros || "-"} m²</span>
          <span>💰 ${precioTxt}</span>
        </div>

        <div class="unidad-actions">
          ${mostrarConsultar ? `<a class="btn btn-consultar" href="${wppHref}" target="_blank" rel="noopener">💬 Consultar</a>` : ""}
          <span class="estado ${u.estado || "disponible"}">
            ${u.estado || "disponible"}
          </span>
        </div>
        ${u.plano ? `<button class="btn-plano">📄 Ver plano</button>` : ""}
      `;

      bloque.appendChild(div);
    });

    listaUnidades.appendChild(bloque);
  });
}

  // ==================================================
  // 3) Galería de fotos
  // ==================================================
  const img = document.getElementById("galeriaImg");

  const galeria = document.querySelector(".galeria");
  if (galeria) galeria.style.display = "block";

  const thumbsContainer = document.querySelector(".galeria-thumbs");

  const fotos = (proyecto.fotos && proyecto.fotos.length)
    ? proyecto.fotos
    : [img.src];

  img.src = fotos[0];
  thumbsContainer.innerHTML = "";

  fotos.forEach((src, i) => {
    const t = document.createElement("img");
    t.className = "thumb-img" + (i === 0 ? " active" : "");
    t.src = src;
    thumbsContainer.appendChild(t);
  });

  const thumbs = Array.from(document.querySelectorAll(".thumb-img"));
  let index = 0;

  function show(i) {
    index = (i + fotos.length) % fotos.length;
    img.src = fotos[index];
    thumbs.forEach(t => t.classList.remove("active"));
    thumbs[index].classList.add("active");
  }

  thumbs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  document.querySelector(".nav.prev")?.addEventListener("click", () => show(index - 1));
  document.querySelector(".nav.next")?.addEventListener("click", () => show(index + 1));

  // Lightbox fotos
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightbox.classList.add("open");
  });
  lightboxClose?.addEventListener("click", () => lightbox.classList.remove("open"));
  lightbox?.addEventListener("click", e => e.target === lightbox && lightbox.classList.remove("open"));
  lightboxPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    show(index - 1);
    lightboxImg.src = img.src;
  });
  lightboxNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    show(index + 1);
    lightboxImg.src = img.src;
  });

  // ==================================================
  // 4) PLANOS (modal)
  // ==================================================
  const btnPlano = document.getElementById("btnPlano");
  const panelPlanos = document.getElementById("panelPlanos");
  const planosImg = document.getElementById("planosImg");
  const planosThumbs = document.getElementById("planosThumbs");
  const planosClose = document.getElementById("planosClose");
  const planosPrev = document.getElementById("planosPrev");
  const planosNext = document.getElementById("planosNext");

  const planos = Array.isArray(proyecto.planos) ? proyecto.planos : [];
  let planoIndex = 0;

  if (!planos.length && btnPlano) {
    btnPlano.style.display = "none";
  }

  function mostrarPlano(i) {
    planoIndex = (i + planos.length) % planos.length;
    planosImg.src = planos[planoIndex];
    [...planosThumbs.children].forEach(t => t.classList.remove("active"));
    planosThumbs.children[planoIndex]?.classList.add("active");
  }

  btnPlano?.addEventListener("click", e => {
    e.preventDefault();
    planosThumbs.innerHTML = "";
    planos.forEach((src, i) => {
      const t = document.createElement("img");
      t.className = "thumb-img" + (i === 0 ? " active" : "");
      t.src = src;
      t.onclick = () => mostrarPlano(i);
      planosThumbs.appendChild(t);
    });
    mostrarPlano(0);
    panelPlanos.classList.add("open");
  });

  planosClose?.addEventListener("click", () => panelPlanos.classList.remove("open"));
  panelPlanos?.addEventListener("click", e => e.target === panelPlanos && panelPlanos.classList.remove("open"));
  planosPrev?.addEventListener("click", () => mostrarPlano(planoIndex - 1));
  planosNext?.addEventListener("click", () => mostrarPlano(planoIndex + 1));

  document.addEventListener("keydown", (e) => {
    const lightboxOpen = lightbox?.classList.contains("open");
    const planosOpen = panelPlanos?.classList.contains("open");
    if (!lightboxOpen && !planosOpen) return;

    if (e.key === "Escape") {
      if (lightboxOpen) lightbox.classList.remove("open");
      if (planosOpen) panelPlanos.classList.remove("open");
      return;
    }

    if (e.key === "ArrowLeft") {
      if (lightboxOpen) {
        show(index - 1);
        lightboxImg.src = img.src;
      }
      if (planosOpen && planos.length) {
        mostrarPlano(planoIndex - 1);
      }
    }

    if (e.key === "ArrowRight") {
      if (lightboxOpen) {
        show(index + 1);
        lightboxImg.src = img.src;
      }
      if (planosOpen && planos.length) {
        mostrarPlano(planoIndex + 1);
      }
    }
  });

  // Swipe (móvil) para fotos y planos
  const SWIPE_MIN = 40;
  let startX = 0;
  let startY = 0;

  function onTouchStart(e) {
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }

  function onTouchEnd(e, tipo) {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;

    if (tipo === "lightbox") {
      if (dx > 0) {
        show(index - 1);
      } else {
        show(index + 1);
      }
      lightboxImg.src = img.src;
    } else if (tipo === "planos") {
      if (!planos.length) return;
      if (dx > 0) {
        mostrarPlano(planoIndex - 1);
      } else {
        mostrarPlano(planoIndex + 1);
      }
    }
  }

  lightbox?.addEventListener("touchstart", onTouchStart, { passive: true });
  lightbox?.addEventListener("touchend", (e) => onTouchEnd(e, "lightbox"), { passive: true });
  panelPlanos?.addEventListener("touchstart", onTouchStart, { passive: true });
  panelPlanos?.addEventListener("touchend", (e) => onTouchEnd(e, "planos"), { passive: true });

});

// ==================================================
// Slider hero (INDEX) - autoplay + flechas
// ==================================================
const heroSlider = document.getElementById("heroSlider");
const heroImg = document.getElementById("heroSliderImg");

if (heroSlider && heroImg) {
  const imgs = [
    "assets/orbis-logo.png",
    "assets/hero2.jpg",
    "assets/hero3.jpg",
    "assets/hero4.jpg"
  ];

  let hi = 0;
  heroImg.src = imgs[0];

  const prev = heroSlider.querySelector(".hero-nav.prev");
  const next = heroSlider.querySelector(".hero-nav.next");

  const showHero = (i) => {
    hi = (i + imgs.length) % imgs.length;
    heroImg.src = imgs[hi];
  };

  prev?.addEventListener("click", () => showHero(hi - 1));
  next?.addEventListener("click", () => showHero(hi + 1));

  // autoplay
  let t = setInterval(() => showHero(hi + 1), 3500);

  // pausa cuando pasás el mouse
  heroSlider.addEventListener("mouseenter", () => clearInterval(t));
  heroSlider.addEventListener("mouseleave", () => {
    t = setInterval(() => showHero(hi + 1), 3500);
  });
}
