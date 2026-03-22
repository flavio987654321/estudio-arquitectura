import { db, functions } from "./firebase.js";
import { collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

document.addEventListener("DOMContentLoaded", async () => {

  // ==================================================
  // 0) Menú hamburguesa (index)
  // ==================================================
  const menuToggle = document.getElementById("menuToggle");
  const menuDrawer = document.getElementById("menuDrawer");
  const menuBackdrop = document.getElementById("menuBackdrop");
  const menuClose = document.getElementById("menuClose");

  const openMenu = () => {
    if (!menuToggle || !menuDrawer || !menuBackdrop) return;
    document.body.classList.add("menu-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuDrawer.setAttribute("aria-hidden", "false");
    menuBackdrop.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    if (!menuToggle || !menuDrawer || !menuBackdrop) return;
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuDrawer.setAttribute("aria-hidden", "true");
    menuBackdrop.setAttribute("aria-hidden", "true");
  };

  menuToggle?.addEventListener("click", () => {
    document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
  });
  menuBackdrop?.addEventListener("click", closeMenu);
  menuClose?.addEventListener("click", closeMenu);
  menuDrawer?.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // ==================================================
  // 0.1) Panel Nosotros (index)
  // ==================================================
  const btnNosotros = document.getElementById("btnNosotros");
  const btnNosotrosMobile = document.getElementById("btnNosotrosMobile");
  const panelNosotros = document.getElementById("nosotrosPanel");
  const btnContacto = document.getElementById("btnContacto");
  const btnContactoMobile = document.getElementById("btnContactoMobile");
  const contactoPanel = document.getElementById("contactoPanel");
  const anioContacto = document.getElementById("anioContacto");
  const anioNosotros = document.getElementById("anioNosotros");
  const topbar = document.querySelector(".topbar");

  if (topbar) {
    const setTopbarH = () => {
      const h = topbar.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--topbar-h", `${h}px`);
    };
    setTopbarH();
    window.addEventListener("resize", setTopbarH);
  }

  const openNosotros = () => {
    if (!panelNosotros) return;
    closeContactoPanel();
    document.body.classList.add("nosotros-open");
    panelNosotros.setAttribute("aria-hidden", "false");
    panelNosotros.scrollTop = 0;
    setActiveNav("nosotros");
  };

  const closeNosotrosPanel = () => {
    if (!panelNosotros) return;
    document.body.classList.remove("nosotros-open");
    panelNosotros.setAttribute("aria-hidden", "true");
  };

  const openContacto = () => {
    if (!contactoPanel) return;
    closeNosotrosPanel();
    document.body.classList.add("contacto-open");
    contactoPanel.setAttribute("aria-hidden", "false");
    contactoPanel.scrollTop = 0;
    setActiveNav("contacto");
  };

  const closeContactoPanel = () => {
    if (!contactoPanel) return;
    document.body.classList.remove("contacto-open");
    contactoPanel.setAttribute("aria-hidden", "true");
  };

  btnNosotros?.addEventListener("click", () => {
    openNosotros();
  });

  btnNosotrosMobile?.addEventListener("click", () => {
    closeMenu();
    openNosotros();
  });

  btnContacto?.addEventListener("click", () => {
    openContacto();
  });

  btnContactoMobile?.addEventListener("click", () => {
    closeMenu();
    openContacto();
  });

  panelNosotros?.addEventListener("click", (e) => {
    if (e.target === panelNosotros) closeNosotrosPanel();
  });

  contactoPanel?.addEventListener("click", (e) => {
    if (e.target === contactoPanel) closeContactoPanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeNosotrosPanel();
      closeContactoPanel();
    }
  });

  // Si estoy en Nosotros y navego a otra sección, cerrar panel
  const navLinks = document.querySelectorAll(
    '.topnav a[href^="#"], .menu-nav a[href^="#"]'
  );
  const sections = [
    document.getElementById("beneficios"),
    document.getElementById("proyectos")
  ].filter(Boolean);

  const setActiveNav = (id) => {
    document.querySelectorAll(".topnav a, .topnav button").forEach(el => {
      const isNos = el.id === "btnNosotros" && id === "nosotros";
      const isCon = el.id === "btnContacto" && id === "contacto";
      const isHref = el.getAttribute("href") === `#${id}`;
      el.classList.toggle("nav-active", isNos || isCon || isHref);
    });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const topbar = document.querySelector(".topbar");
    const offset = (topbar?.getBoundingClientRect().height || 72) + (id === "proyectos" ? 80 : 24);
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  navLinks.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      closeNosotrosPanel();
      closeContactoPanel();
      const id = a.getAttribute("href")?.replace("#", "");
      if (!id) return;
      scrollToSection(id);
      setActiveNav(id);
      history.replaceState(null, "", `#${id}`);
    });
  });

  // active por scroll
  window.addEventListener("scroll", () => {
    const topbar = document.querySelector(".topbar");
    const offset = (topbar?.getBoundingClientRect().height || 72) + 40;
    let current = "";
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top - offset;
      if (top <= 0) current = sec.id;
    });
    if (current) setActiveNav(current);
  });

  // Reveal on scroll (Nosotros)
  const revealEls = panelNosotros?.querySelectorAll(
    ".nosotros-head, .nosotros-card, .nosotros-mv, .nosotros-steps"
  ) || [];
  revealEls.forEach(el => el.classList.add("reveal"));

  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { root: panelNosotros, threshold: 0.2 });

    revealEls.forEach(el => io.observe(el));
  }

  // Reveal en index (scroll en el body)
  const revealIndex = document.querySelectorAll("[data-reveal]");
  revealIndex.forEach(el => el.classList.add("reveal"));
  if (revealIndex.length) {
    const ioIndex = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { root: null, threshold: 0.2 });

    revealIndex.forEach(el => ioIndex.observe(el));
  }

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
const metricProyectos = document.getElementById("metricProyectos");
if (metricProyectos) {
  metricProyectos.textContent = `+${PROYECTOS_APP.length || 0}`;
}

  // ==================================================
  // 0.2) Cargar contenido Nosotros (general)
  // ==================================================
  async function cargarNosotrosDesdeFirestore() {
    try {
      const snap = await getDoc(doc(db, "site", "nosotros"));
      if (!snap.exists()) return;
      const data = snap.data() || {};

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
      };

      setText("nosotrosTitle", data.titulo);
      setText("nosotrosSub", data.subtitulo);
      setText("persona1Name", data.personas?.[0]?.nombre);
      setText("persona2Name", data.personas?.[1]?.nombre);
      setText("misionText", data.mision);
      setText("visionText", data.vision);
      setText("nosotrosStepsTitle", data.stepsTitle);
      setText("nosotrosStepsSub", data.stepsSub);

      const p1Img = document.getElementById("persona1Img");
      const p2Img = document.getElementById("persona2Img");
      if (p1Img && data.personas?.[0]?.fotoUrl) p1Img.src = data.personas[0].fotoUrl;
      if (p2Img && data.personas?.[1]?.fotoUrl) p2Img.src = data.personas[1].fotoUrl;

      const renderList = (id, items) => {
        const ul = document.getElementById(id);
        if (!ul || !Array.isArray(items) || !items.length) return;
        ul.innerHTML = "";
        items.forEach(t => {
          const li = document.createElement("li");
          li.textContent = t;
          ul.appendChild(li);
        });
      };

      renderList("persona1List", data.personas?.[0]?.items || []);
      renderList("persona2List", data.personas?.[1]?.items || []);

      const stepCards = document.querySelectorAll(".step-card[data-step]");
      if (Array.isArray(data.steps)) {
        stepCards.forEach((card, i) => {
          const h4 = card.querySelector("h4");
          const p = card.querySelector("p");
          if (h4 && data.steps[i]?.titulo) h4.textContent = data.steps[i].titulo;
          if (p && data.steps[i]?.texto) p.textContent = data.steps[i].texto;
        });
      }
    } catch (err) {
      console.error("Error cargando Nosotros:", err);
    }
  }

  await cargarNosotrosDesdeFirestore();

  // ==================================================
  // 1) INDEX.HTML -> Render listado
  // ==================================================
const grid = document.getElementById("gridProyectos");

if (grid && PROYECTOS_APP.length) {

  grid.innerHTML = "";

  PROYECTOS_APP
    .slice()
    .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))
    .forEach(p => {
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

    if (p.destacado) {
      const badge = document.createElement("div");
      badge.className = "badge-destacado";
      badge.textContent = "Destacado";
      card.appendChild(badge);
    }

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
  const calidadWrap = document.getElementById("calidadProyecto");
  const calidadSeccion = document.getElementById("calidadSeccion");

  const wppFloat = document.getElementById("wppFloat");
  const contactoForm = document.getElementById("contactoForm");
  const contactoNombre = document.getElementById("contactoNombre");
  const contactoEmail = document.getElementById("contactoEmail");
  const contactoTelefono = document.getElementById("contactoTelefono");
  const contactoMensaje = document.getElementById("contactoMensaje");
  const contactoStatus = document.getElementById("contactoStatus");
  if (wppFloat && PROYECTOS_APP.length) {
    const p0 = PROYECTOS_APP[0];
    if (p0?.whatsapp) {
      const msg = encodeURIComponent(
        p0.mensajeWpp || `Hola! Quiero info sobre ${p0.nombre}.`
      );
      const href = `https://wa.me/${p0.whatsapp}?text=${msg}`;
      wppFloat.href = href;
    } else {
      wppFloat.style.display = "none";
    }
  }
  // Contacto: enviar email con Firebase Functions
  if (contactoForm) {
    const setStatus = (msg, state = "") => {
      if (!contactoStatus) return;
      contactoStatus.textContent = msg;
      if (state) contactoStatus.setAttribute("data-state", state);
      else contactoStatus.removeAttribute("data-state");
    };

    contactoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = (contactoNombre?.value || "").trim();
      const email = (contactoEmail?.value || "").trim();
      const tel = (contactoTelefono?.value || "").trim();
      const mensaje = (contactoMensaje?.value || "").trim();

      if (!nombre || !email || !tel) {
        setStatus("Completá nombre, email y teléfono.", "err");
        return;
      }

      const btn = contactoForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Enviando...";
      }
      setStatus("Enviando...", "info");

      try {
        const sendContactEmail = httpsCallable(functions, "sendContactEmail");
        await sendContactEmail({
          nombre,
          email,
          telefono: tel,
          mensaje,
          page: window.location.href,
          referrer: document.referrer || "",
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
        setStatus("Listo, te contactamos a la brevedad.", "ok");
        contactoForm.reset();
      } catch (err) {
        console.error("Error enviando contacto:", err);
        setStatus("No se pudo enviar. Probá de nuevo en unos minutos.", "err");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Quiero más información";
        }
      }
    });
  }

  if (anioContacto) {
    anioContacto.textContent = new Date().getFullYear();
  }
  if (anioNosotros) {
    anioNosotros.textContent = new Date().getFullYear();
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

  // Calidad constructiva
  if (calidadWrap && calidadSeccion) {
    const items = Array.isArray(proyecto.calidadConstructiva)
      ? proyecto.calidadConstructiva
      : [];
    if (items.length) {
      calidadWrap.innerHTML = "";
      items.forEach(t => {
        const div = document.createElement("div");
        div.className = "calidad-item";
        div.textContent = t;
        calidadWrap.appendChild(div);
      });
      calidadSeccion.style.display = "";
    } else {
      calidadSeccion.style.display = "none";
    }
  }

  // Botones (al final): Ver planos + Avances + WhatsApp
  const acciones = document.getElementById("accionesProyecto");
  if (acciones) {
    acciones.innerHTML = "";
    if (proyecto.planos && proyecto.planos.length) {
      const btnPlano = document.createElement("a");
      btnPlano.className = "btn";
      btnPlano.id = "btnPlano";
      btnPlano.href = "#";
      btnPlano.textContent = "📄 Planos";
      acciones.appendChild(btnPlano);
    }

    if (Array.isArray(proyecto.avances) && proyecto.avances.length) {
      const btnAvances = document.createElement("a");
      btnAvances.className = "btn";
      btnAvances.id = "btnAvances";
      btnAvances.href = "#";
      btnAvances.textContent = "Avances";
      acciones.appendChild(btnAvances);
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
      btnWpp.textContent = "💬 WhatsApp";
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
    const bloque = document.createElement("details");
    bloque.className = "unidades-piso piso-accordion";
    bloque.innerHTML = `
      <summary class="piso-title">
        <span>${piso}</span>
        <span class="piso-count">${grupos[piso].length}</span>
      </summary>
    `;

    grupos[piso].forEach(u => {
      const div = document.createElement("div");
      div.className = "unidad";

      const estadoNorm = (u.estado || "disponible").toLowerCase();
      if (estadoNorm === "vendida") div.classList.add("vendida");
      if (estadoNorm === "reservada") div.classList.add("reservada");
      div.dataset.piso = piso;
      div.dataset.estado = estadoNorm;

      const moneda = (u.moneda || "USD").toUpperCase();
      const precioTxt = u.precio ? `${moneda} ${u.precio}` : "Consultar";
      const wpp = proyecto.whatsapp || "";
      let baseMsg = proyecto.mensajeWpp || `Hola! Quiero info sobre ${proyecto.nombre}.`;
      if (estadoNorm === "reservada") {
        const pisoTxt = u.piso || "-";
        baseMsg = `Hola! Vi la unidad ${u.nombre || "-"} (${pisoTxt}) en ${proyecto.nombre}. Está reservada, ¿hay disponibilidad o lista de espera? Si no, ¿me podés ofrecer alternativas similares?`;
      }
      const extra = [
        `Unidad: ${u.nombre || "-"}`,
        `Piso: ${u.piso || "-"}`,
        `Ambientes: ${u.ambientes || "-"}`,
        `Metros: ${u.metros || "-"} m²`,
        `Precio: ${precioTxt}`,
        `Orientación: ${u.orientacion || "-"}`,
        `Vista: ${u.vista || "-"}`,
        `Personas: ${u.personas || "-"}`
      ].join(" | ");
      const wppMsg = encodeURIComponent(
        estadoNorm === "reservada" ? baseMsg : `${baseMsg} (${extra})`
      );
      const wppHref = wpp ? `https://wa.me/${wpp}?text=${wppMsg}` : "";
      const mostrarConsultar = wppHref && estadoNorm !== "vendida";

      div.innerHTML = `
        <div class="unidad-header">
          <strong>${u.nombre || "Unidad"}</strong>
        </div>

        <div class="unidad-info">
          <div class="info-item info-amb">
            <span class="info-label">Ambientes</span>
            <span class="info-value">${u.ambientes || "-"} amb</span>
          </div>
          <div class="info-item info-metros">
            <span class="info-label">Metros</span>
            <span class="info-value">${u.metros || "-"} m²</span>
          </div>
          <div class="info-item info-orientacion only-mobile">
            <span class="info-label">Orientación</span>
            <span class="info-value">${u.orientacion || "-"}</span>
          </div>
          <div class="info-item info-vista only-mobile">
            <span class="info-label">Vista</span>
            <span class="info-value">${u.vista || "-"}</span>
          </div>
          <div class="info-item info-personas only-mobile">
            <span class="info-label">Personas</span>
            <span class="info-value">${u.personas || "-"}</span>
          </div>
          <div class="info-item info-precio">
            <span class="info-label">Precio</span>
            <span class="info-value">${precioTxt}</span>
          </div>
          <div class="info-item info-fotos">
            <span class="info-label">Fotos</span>
            ${
              (Array.isArray(u.fotos) && u.fotos.length)
                ? `<button type="button" class="info-action" data-action="fotos" aria-label="Ver fotos">📷 Ver</button>`
                : `<span class="info-muted">No</span>`
            }
          </div>
          <div class="info-item info-pdf">
            <span class="info-label">PDF</span>
            ${
              u.pdfUrl
                ? `<a class="info-action" href="${u.pdfUrl}" target="_blank" rel="noopener" aria-label="Abrir PDF">⬇️ Abrir</a>`
                : `<span class="info-muted">No</span>`
            }
          </div>
        </div>

        <div class="unidad-actions">
          ${mostrarConsultar ? `<a class="btn btn-consultar" href="${wppHref}" target="_blank" rel="noopener">💬 Consultar</a>` : ""}
          <span class="estado ${estadoNorm}">
            ${estadoNorm}
          </span>
        </div>
        ${u.plano ? `<button class="btn-plano">📄 Ver plano</button>` : ""}
      `;

      const info = div.querySelector(".unidad-info");
      if (info) {
        const fotosAction = info.querySelector('[data-action="fotos"]');
        if (fotosAction && Array.isArray(u.fotos) && u.fotos.length) {
          fotosAction.addEventListener("click", () => openLightboxWith(u.fotos, 0));
        }
      }

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
        if (!anyVisible) return;

        if (pisoVal !== "todos") {
          bloque.open = true;
        } else if (estadoVal !== "todos") {
          // si filtra por estado, abrimos solo los que tienen resultados
          bloque.open = true;
        } else {
          // sin filtros: mantener cerrados por defecto
          bloque.open = false;
        }
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
  let lightboxPhotos = [];
  let lightboxIndex = 0;

  const openLightboxWith = (list, start = 0) => {
    if (!Array.isArray(list) || !list.length) return;
    lightboxPhotos = list;
    lightboxIndex = (start + list.length) % list.length;
    lightboxImg.src = lightboxPhotos[lightboxIndex];
    lightbox.classList.add("open");
  };

  const moveLightbox = (delta) => {
    if (!lightboxPhotos.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxPhotos.length) % lightboxPhotos.length;
    lightboxImg.src = lightboxPhotos[lightboxIndex];
  };

  img.addEventListener("click", () => openLightboxWith(fotos, index));
  lightboxClose?.addEventListener("click", () => lightbox.classList.remove("open"));
  lightbox?.addEventListener("click", e => e.target === lightbox && lightbox.classList.remove("open"));
  lightboxPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    moveLightbox(-1);
  });
  lightboxNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    moveLightbox(1);
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
  const isPdf = (url) => /\.pdf($|\?)/i.test(url || "");
  const planosPdf = planos.filter(isPdf);
  const planosImgs = planos.filter(p => !isPdf(p));
  let planoIndex = 0;

  if (!planos.length && btnPlano) {
    btnPlano.style.display = "none";
  }

  function mostrarPlano(i) {
    if (!planosImgs.length) return;
    planoIndex = (i + planosImgs.length) % planosImgs.length;
    planosImg.src = planosImgs[planoIndex];
    [...planosThumbs.children].forEach(t => t.classList.remove("active"));
    planosThumbs.children[planoIndex]?.classList.add("active");
  }

  btnPlano?.addEventListener("click", e => {
    e.preventDefault();
    planosThumbs.innerHTML = "";

    // PDFs: botones para elegir
    if (planosPdf.length) {
      planosPdf.forEach((src, i) => {
        const a = document.createElement("a");
        a.href = src;
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "btn";
        a.style.marginRight = "8px";
        a.textContent = `Plano PDF ${i + 1}`;
        planosThumbs.appendChild(a);
      });
    }

    // ImÃ¡genes: visor con miniaturas
    if (planosImgs.length) {
      planosImgs.forEach((src, i) => {
        const t = document.createElement("img");
        t.className = "thumb-img" + (i === 0 ? " active" : "");
        t.src = src;
        t.onclick = () => mostrarPlano(i);
        planosThumbs.appendChild(t);
      });
      if (planosImg) planosImg.style.display = "";
      if (planosPrev) planosPrev.style.display = "";
      if (planosNext) planosNext.style.display = "";
      mostrarPlano(0);
    } else {
      if (planosImg) planosImg.style.display = "none";
      if (planosPrev) planosPrev.style.display = "none";
      if (planosNext) planosNext.style.display = "none";
    }

    panelPlanos.classList.add("open");
  });

  planosClose?.addEventListener("click", () => panelPlanos.classList.remove("open"));
  panelPlanos?.addEventListener("click", e => e.target === panelPlanos && panelPlanos.classList.remove("open"));
  planosPrev?.addEventListener("click", () => mostrarPlano(planoIndex - 1));
  planosNext?.addEventListener("click", () => mostrarPlano(planoIndex + 1));

  // ==================================================
  // 5) AVANCES (modal)
  // ==================================================
  const btnAvances = document.getElementById("btnAvances");
  const panelAvances = document.getElementById("panelAvances");
  const avancesImg = document.getElementById("avancesImg");
  const avancesVideo = document.getElementById("avancesVideo");
  const avancesThumbs = document.getElementById("avancesThumbs");
  const avancesClose = document.getElementById("avancesClose");

  const isVideoUrl = (url) => /\.(mp4|webm)($|\?)/i.test(url || "");
  const avances = Array.isArray(proyecto.avances) ? proyecto.avances.slice() : [];
  avances.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  let avanceIndex = 0;

  if (!avances.length && btnAvances) {
    btnAvances.style.display = "none";
  }

  function showAvance(i) {
    if (!avances.length) return;
    avanceIndex = (i + avances.length) % avances.length;
    const a = avances[avanceIndex];
    const isVideo = a.tipo === "video" || isVideoUrl(a.mediaUrl);

    if (avancesVideo) {
      avancesVideo.pause();
      avancesVideo.currentTime = 0;
    }

    if (isVideo) {
      if (avancesVideo) {
        avancesVideo.src = a.mediaUrl || "";
        avancesVideo.style.display = "block";
      }
      if (avancesImg) avancesImg.style.display = "none";
    } else {
      if (avancesImg) {
        avancesImg.src = a.mediaUrl || "";
        avancesImg.style.display = "block";
      }
      if (avancesVideo) avancesVideo.style.display = "none";
    }

    [...(avancesThumbs?.children || [])].forEach(t => t.classList.remove("active"));
    avancesThumbs?.children[avanceIndex]?.classList.add("active");
  }

  function closeAvances() {
    panelAvances?.classList.remove("open");
    if (avancesVideo) {
      avancesVideo.pause();
      avancesVideo.currentTime = 0;
    }
  }

  btnAvances?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!avancesThumbs) return;
    avancesThumbs.innerHTML = "";

    avances.forEach((a, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "avance-chip" + (i === 0 ? " active" : "");
      const tipo = (a.tipo === "video" || isVideoUrl(a.mediaUrl)) ? "Video" : "Foto";
      chip.textContent = `${a.fecha || "Sin fecha"} ? ${tipo}`;
      chip.addEventListener("click", () => showAvance(i));
      avancesThumbs.appendChild(chip);
    });

    showAvance(0);
    panelAvances?.classList.add("open");
  });

  avancesClose?.addEventListener("click", closeAvances);
  panelAvances?.addEventListener("click", e => e.target === panelAvances && closeAvances());

  document.addEventListener("keydown", (e) => {
    const lightboxOpen = lightbox?.classList.contains("open");
    const planosOpen = panelPlanos?.classList.contains("open");
    const avancesOpen = panelAvances?.classList.contains("open");
    if (!lightboxOpen && !planosOpen && !avancesOpen) return;

    if (e.key === "Escape") {
      if (lightboxOpen) lightbox.classList.remove("open");
      if (planosOpen) panelPlanos.classList.remove("open");
      if (avancesOpen) closeAvances();
      return;
    }

    if (e.key === "ArrowLeft") {
      if (lightboxOpen) moveLightbox(-1);
      if (planosOpen && planosImgs.length) {
        mostrarPlano(planoIndex - 1);
      }
    }

    if (e.key === "ArrowRight") {
      if (lightboxOpen) moveLightbox(1);
      if (planosOpen && planosImgs.length) {
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
        moveLightbox(-1);
      } else {
        moveLightbox(1);
      }
    } else if (tipo === "planos") {
      if (!planosImgs.length) return;
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









