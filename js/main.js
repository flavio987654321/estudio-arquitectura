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

    const total = Array.isArray(p.unidades) ? p.unidades.length : 0;
    const disponibles = Array.isArray(p.unidades)
      ? p.unidades.filter(u => (u.estado || "").toLowerCase() === "disponible").length
      : 0;
    const info = document.createElement("div");
    info.className = "card-meta";
    info.textContent = `Unidades: ${total} · Disponibles: ${disponibles}`;
    card.appendChild(info);

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

  const wppFloat = document.getElementById("wppFloat");
  if (wppFloat && PROYECTOS_APP.length) {
    const p0 = PROYECTOS_APP[0];
    if (p0?.whatsapp) {
      const msg = encodeURIComponent(
        p0.mensajeWpp || `Hola! Quiero info sobre ${p0.nombre}.`
      );
      wppFloat.href = `https://wa.me/${p0.whatsapp}?text=${msg}`;
    } else {
      wppFloat.style.display = "none";
    }
  }

  if (!titulo && !ubic && !desc && !listaUnidades) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const proyectos = PROYECTOS_APP || [];
  const proyecto = proyectos.find(p => p.id === id) || proyectos[0];
  if (!proyecto) return;

  // Texto
  titulo.textContent = proyecto.nombre || "Proyecto";
  // Usamos una sola ubicación (dirección o ubicación) y la mostramos solo en la columna derecha
  const ubicacionFinal = proyecto.direccion || proyecto.ubicacion || "";
  if (ubic) {
    ubic.style.display = "none";
  }
  desc.textContent = proyecto.descripcion || "";

  // Descripción: truncar a 1 línea y permitir "Ver más / Ver menos"
  if (desc) {
    desc.classList.add("desc-proyecto");
    const btnToggle = document.createElement("button");
    btnToggle.type = "button";
    btnToggle.className = "desc-toggle";
    btnToggle.textContent = "Ver más";
    btnToggle.setAttribute("aria-expanded", "false");
    btnToggle.hidden = true;
    desc.insertAdjacentElement("afterend", btnToggle);

    const measureDesc = () => {
      const MAX_LINES = 2;
      const styles = window.getComputedStyle(desc);
      let lineHeight = parseFloat(styles.lineHeight);
      if (Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(styles.fontSize) || 16;
        lineHeight = fontSize * 1.2;
      }

      // Medimos altura real sin clamp
      desc.classList.remove("desc-collapsed");
      const fullHeight = desc.getBoundingClientRect().height;
      const lines = Math.round(fullHeight / lineHeight);
      const needsToggle = lines > MAX_LINES;

      if (!needsToggle) {
        btnToggle.hidden = true;
        desc.classList.remove("desc-collapsed");
        btnToggle.setAttribute("aria-expanded", "true");
        btnToggle.dataset.expanded = "true";
        return;
      }

      btnToggle.hidden = false;
      if (btnToggle.dataset.expanded === "true") {
        desc.classList.remove("desc-collapsed");
        btnToggle.textContent = "Ver menos";
        btnToggle.setAttribute("aria-expanded", "true");
      } else {
        desc.classList.add("desc-collapsed");
        btnToggle.textContent = "Ver más";
        btnToggle.setAttribute("aria-expanded", "false");
      }
    };

    btnToggle.addEventListener("click", () => {
      const isCollapsed = desc.classList.toggle("desc-collapsed");
      if (isCollapsed) {
        btnToggle.textContent = "Ver más";
        btnToggle.setAttribute("aria-expanded", "false");
        btnToggle.dataset.expanded = "false";
      } else {
        btnToggle.textContent = "Ver menos";
        btnToggle.setAttribute("aria-expanded", "true");
        btnToggle.dataset.expanded = "true";
      }
    });

    requestAnimationFrame(measureDesc);
    window.addEventListener("resize", measureDesc);
  }

  // CTA WhatsApp flotante (detalle)
  if (wppFloat && proyecto.whatsapp) {
    const msg = encodeURIComponent(
      proyecto.mensajeWpp || `Hola! Quiero info sobre ${proyecto.nombre}.`
    );
    wppFloat.href = `https://wa.me/${proyecto.whatsapp}?text=${msg}`;
  } else if (wppFloat) {
    wppFloat.style.display = "none";
  }

  // Ubicación: mapa + dirección + puntos clave (en este orden)
  const infoProyecto = document.querySelector(".info-proyecto");
  if (infoProyecto) {
    if (proyecto.mapaEmbed) {
      const mapa = document.createElement("div");
      mapa.className = "mapa";
      mapa.innerHTML = proyecto.mapaEmbed;
      infoProyecto.appendChild(mapa);
    }

    if (ubicacionFinal) {
      const dir = document.createElement("p");
      dir.className = "texto";
      dir.textContent = `📍 ${ubicacionFinal}`;
      infoProyecto.appendChild(dir);
    }

    if (Array.isArray(proyecto.puntosClave) && proyecto.puntosClave.length) {
      const lista = document.createElement("ul");
      lista.className = "puntos-clave";
      proyecto.puntosClave.forEach(t => {
        const li = document.createElement("li");
        li.textContent = t;
        lista.appendChild(li);
      });
      infoProyecto.appendChild(lista);
    }
  }

  // Botones (al final): Ver planos + WhatsApp
  const acciones = document.getElementById("accionesProyecto");
  if (acciones) {
    acciones.innerHTML = "";
    if (proyecto.planos && proyecto.planos.length) {
      const btnPlano = document.createElement("a");
      btnPlano.className = "btn";
      btnPlano.id = "btnPlano";
      btnPlano.href = "#";
      btnPlano.textContent = "📄 Ver planos";
      acciones.appendChild(btnPlano);
    }

    if (proyecto.whatsapp) {
      const btnWpp = document.createElement("a");
      btnWpp.className = "btn btn-wpp";
      btnWpp.id = "btnWpp";
      const msg = encodeURIComponent(
        proyecto.mensajeWpp || `Hola! Quiero info sobre ${proyecto.nombre}.`
      );
      btnWpp.href = `https://wa.me/${proyecto.whatsapp}?text=${msg}`;
      btnWpp.target = "_blank";
      btnWpp.rel = "noopener";
      btnWpp.textContent = "💬 Consultar por WhatsApp";
      acciones.appendChild(btnWpp);
    }
    // Forzar que los botones queden al final del bloque derecho
    infoProyecto?.appendChild(acciones);
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

      const estadoNorm = (u.estado || "disponible").toLowerCase();
      if (estadoNorm === "vendida") div.classList.add("vendida");
      div.dataset.piso = piso;
      div.dataset.estado = estadoNorm;

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
      const mostrarConsultar = wppHref && estadoNorm !== "vendida";

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
          <span class="estado ${estadoNorm}">
            ${estadoNorm}
          </span>
        </div>
        ${u.plano ? `<button class="btn-plano">📄 Ver plano</button>` : ""}
      `;

      bloque.appendChild(div);
    });

    listaUnidades.appendChild(bloque);
  });

  // Filtros por piso / estado
  const filtrosWrap = document.getElementById("filtrosUnidades");
  if (filtrosWrap) {
    filtrosWrap.innerHTML = "";
    const labelPiso = document.createElement("label");
    labelPiso.textContent = "Piso";
    const selectPiso = document.createElement("select");
    selectPiso.id = "filtroPiso";
    const optTodos = document.createElement("option");
    optTodos.value = "todos";
    optTodos.textContent = "Todos";
    selectPiso.appendChild(optTodos);

    Object.keys(grupos).sort(ordenarPisos).forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      selectPiso.appendChild(opt);
    });

    labelPiso.appendChild(selectPiso);

    const labelEstado = document.createElement("label");
    labelEstado.textContent = "Estado";
    const selectEstado = document.createElement("select");
    selectEstado.id = "filtroEstado";
    ["todos", "disponible", "reservada", "vendida"].forEach(e => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = e === "todos" ? "Todos" : e;
      selectEstado.appendChild(opt);
    });
    labelEstado.appendChild(selectEstado);

    filtrosWrap.appendChild(labelPiso);
    filtrosWrap.appendChild(labelEstado);

    const aplicarFiltros = () => {
      const pisoVal = selectPiso.value;
      const estadoVal = selectEstado.value;
      const bloques = listaUnidades.querySelectorAll(".unidades-piso");

      bloques.forEach(bloque => {
        let anyVisible = false;
        const unidades = bloque.querySelectorAll(".unidad");
        unidades.forEach(u => {
          const matchPiso = pisoVal === "todos" || u.dataset.piso === pisoVal;
          const matchEstado = estadoVal === "todos" || u.dataset.estado === estadoVal;
          const visible = matchPiso && matchEstado;
          u.style.display = visible ? "" : "none";
          if (visible) anyVisible = true;
        });
        bloque.style.display = anyVisible ? "" : "none";
      });
    };

    selectPiso.addEventListener("change", aplicarFiltros);
    selectEstado.addEventListener("change", aplicarFiltros);
  }
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
