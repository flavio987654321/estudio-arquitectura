import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const storage = getStorage();

async function subirArchivoAStorage(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isPdfUrl(url) {
  return /\.pdf($|\?)/i.test(url || "");
}

function isPdfFile(file) {
  if (!file) return false;
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
}

async function cargarProyectosDesdeFirestore() {
  const snap = await getDocs(collection(db, "proyectos"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    iniciarPanel(user);
  });

function iniciarPanel(user) {
  console.log("✅ Usuario autenticado:", user.uid);

  const btnLogout = document.getElementById("btnLogout");
  const btnNuevo = document.getElementById("btnNuevo");
  const listaProyectos = document.getElementById("listaProyectos");
  const editor = document.querySelector(".panel-editor");
  const editorTitulo = document.getElementById("editorTitulo");
  const editorHint = document.getElementById("editorHint");
  const tabProyecto = document.getElementById("tabProyecto");
  const tabNosotros = document.getElementById("tabNosotros");
  const formNosotros = document.getElementById("formNosotros");

  const form = document.getElementById("formProyecto");
  const msg = document.getElementById("panelMsg");

  const p_id = document.getElementById("p_id");
  const p_nombre = document.getElementById("p_nombre");
  const p_direccion = document.getElementById("p_direccion");
  const p_descripcion = document.getElementById("p_descripcion");
  const p_mapa = document.getElementById("p_mapa");
  const p_puntos = document.getElementById("p_puntos");
  const p_calidad = document.getElementById("p_calidad");
  const p_destacado = document.getElementById("p_destacado");
  const p_estado = document.getElementById("p_estado");
  const p_whatsapp = document.getElementById("p_whatsapp");
  const p_mensajeWpp = document.getElementById("p_mensajeWpp");

  // ===== NOSOTROS (GLOBAL) =====
  const n_titulo = document.getElementById("n_titulo");
  const n_subtitulo = document.getElementById("n_subtitulo");
  const n_p1_nombre = document.getElementById("n_p1_nombre");
  const n_p1_items = document.getElementById("n_p1_items");
  const n_p1_foto = document.getElementById("n_p1_foto");
  const n_p1_preview = document.getElementById("n_p1_preview");
  const n_p2_nombre = document.getElementById("n_p2_nombre");
  const n_p2_items = document.getElementById("n_p2_items");
  const n_p2_foto = document.getElementById("n_p2_foto");
  const n_p2_preview = document.getElementById("n_p2_preview");
  const n_mision = document.getElementById("n_mision");
  const n_vision = document.getElementById("n_vision");
  const n_steps_title = document.getElementById("n_steps_title");
  const n_steps_sub = document.getElementById("n_steps_sub");
  const n_s1_title = document.getElementById("n_s1_title");
  const n_s1_text = document.getElementById("n_s1_text");
  const n_s2_title = document.getElementById("n_s2_title");
  const n_s2_text = document.getElementById("n_s2_text");
  const n_s3_title = document.getElementById("n_s3_title");
  const n_s3_text = document.getElementById("n_s3_text");
  const n_s4_title = document.getElementById("n_s4_title");
  const n_s4_text = document.getElementById("n_s4_text");
  const n_s5_title = document.getElementById("n_s5_title");
  const n_s5_text = document.getElementById("n_s5_text");
  const n_s6_title = document.getElementById("n_s6_title");
  const n_s6_text = document.getElementById("n_s6_text");
  const btnGuardarNosotros = document.getElementById("btnGuardarNosotros");
  const panelMsgNosotros = document.getElementById("panelMsgNosotros");

  // ===== AVANCES =====
  const a_fecha = document.getElementById("a_fecha");
  const a_media = document.getElementById("a_media");
  const btnAgregarAvance = document.getElementById("btnAgregarAvance");
  const listaAvancesPanel = document.getElementById("listaAvancesPanel");

  let avancesData = [];

  // ===== FOTOS =====
  const inputFotos = document.getElementById("inputFotos");
  const btnLimpiarFotos = document.getElementById("btnLimpiarFotos");
  const previewFotos = document.getElementById("previewFotos");

  let fotosNuevas = [];      // File[]
  let fotosExistentes = [];  // string[] (URLs o DataURL)

  // ===== PLANOS (NUEVO) =====
  const inputPlanos = document.getElementById("inputPlanos");
  const btnLimpiarPlanos = document.getElementById("btnLimpiarPlanos");
  const previewPlanos = document.getElementById("previewPlanos");

  let planosNuevos = [];      // File[]
  let planosExistentes = [];  // string[] (URLs o DataURL)

  // ===== UNIDADES =====
  const u_nombre = document.getElementById("u_nombre");
  const u_amb = document.getElementById("u_amb");
  const u_metros = document.getElementById("u_metros");
  const u_precio = document.getElementById("u_precio");
  const u_moneda = document.getElementById("u_moneda");
  const u_orientacion = document.getElementById("u_orientacion");
  const u_vista = document.getElementById("u_vista");
  const u_personas = document.getElementById("u_personas");
  const u_piso = document.getElementById("u_piso");
  const u_estado = document.getElementById("u_estado");
  const btnAgregarUnidad = document.getElementById("btnAgregarUnidad");
  const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
  const listaUnidadesPanel = document.getElementById("listaUnidadesPanel");
  const u_fotos = document.getElementById("u_fotos");
  const u_pdf = document.getElementById("u_pdf");
  const previewUnidadFotos = document.getElementById("previewUnidadFotos");

  const unidadArchivos = document.getElementById("unidadArchivos");

  const btnEliminar = document.getElementById("btnEliminar");
  const unidadSheet = document.getElementById("unidadSheet");
  const unidadEditBtn = document.getElementById("unidadEditBtn");
  const unidadDeleteBtn = document.getElementById("unidadDeleteBtn");
  const unidadCancelBtn = document.getElementById("unidadCancelBtn");

  let proyectos = [];
  let activoId = null;
  let unidadFotosNuevas = [];
  let unidadFotosExistentes = [];
  let unidadPdfNuevo = null;
  let unidadEditIndex = null;
  let unidadHighlightIndex = null;

  // Nosotros (global)
  let nosotrosData = null;
  let n_p1_foto_nueva = null;
  let n_p2_foto_nueva = null;
  let n_p1_foto_url = "";
  let n_p2_foto_url = "";

  function setMsg(text) {
    if (!msg) return;
    msg.textContent = text || "";
    if (text) setTimeout(() => (msg.textContent = ""), 2200);
  }

  function setMsgNosotros(text) {
    if (!panelMsgNosotros) return;
    panelMsgNosotros.textContent = text || "";
    if (text) setTimeout(() => (panelMsgNosotros.textContent = ""), 2200);
  }

  function setEditorEnabled(enabled) {
    if (!editor) return;
    editor.classList.toggle("is-disabled", !enabled);
    if (editorHint) {
      editorHint.textContent = enabled
        ? "Editando proyecto."
        : "Seleccioná un proyecto o creá uno nuevo para editar.";
    }
  }

  function showProyectoEditor() {
    if (form) form.classList.remove("is-hidden");
    if (formNosotros) formNosotros.classList.add("is-hidden");
    tabProyecto?.classList.remove("btn-ghost");
    tabNosotros?.classList.add("btn-ghost");
    if (editorTitulo) editorTitulo.textContent = "Proyecto";
    const hasActivo = !!getActivo();
    setEditorEnabled(hasActivo);
  }

  function showNosotrosEditor() {
    if (form) form.classList.add("is-hidden");
    if (formNosotros) formNosotros.classList.remove("is-hidden");
    tabProyecto?.classList.add("btn-ghost");
    tabNosotros?.classList.remove("btn-ghost");
    editor?.classList.remove("is-disabled");
    if (editorTitulo) editorTitulo.textContent = "Nosotros";
    if (editorHint) editorHint.textContent = "Editando contenido general de Nosotros.";
  }

  function renderLista() {
    listaProyectos.innerHTML = "";
    proyectos.forEach(p => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "item-proyecto" + (p.id === activoId ? " active" : "");
      item.innerHTML = `
        <div class="item-title">${p.nombre || "Proyecto"} ${p.destacado ? "⭐" : ""}</div>
        <div class="item-sub">${p.ubicacion || ""}</div>
      `;
      item.addEventListener("click", () => {
        activoId = p.id;
        renderLista();
        cargarEnEditor();
        showProyectoEditor();
      });
      listaProyectos.appendChild(item);
    });
  }

  function getActivo() {
    return proyectos.find(p => p.id === activoId) || null;
  }

  function editarUnidad(idx) {
    const p = getActivo();
    if (!p || !p.unidades || !p.unidades[idx]) return;
    const u = p.unidades[idx];
    unidadEditIndex = idx;
    u_nombre.value = u.nombre || "";
    u_amb.value = u.ambientes || "";
    u_metros.value = u.metros || "";
    u_precio.value = u.precio || "";
    if (u_moneda) u_moneda.value = (u.moneda || "USD").toUpperCase();
    if (u_orientacion) u_orientacion.value = u.orientacion || "";
    if (u_vista) u_vista.value = u.vista || "";
    if (u_personas) u_personas.value = u.personas || "";
    if (u_piso) u_piso.value = u.piso || "Planta baja";
    u_estado.value = u.estado || "disponible";

    unidadFotosNuevas = [];
    unidadFotosExistentes = Array.isArray(u.fotos) ? [...u.fotos] : [];
    unidadPdfNuevo = null;
    if (u_fotos) u_fotos.value = "";
    if (u_pdf) u_pdf.value = "";
    renderUnidadFotosPreview();
    if (unidadArchivos) unidadArchivos.classList.remove("is-hidden");

    if (btnAgregarUnidad) btnAgregarUnidad.textContent = "Actualizar unidad";
    if (btnCancelarEdicion) btnCancelarEdicion.classList.remove("is-hidden");
    setMsg("Editando unidad. Actualiza y guarda.");

    // Llevar la vista al formulario de edición
    if (u_nombre) {
      u_nombre.scrollIntoView({ behavior: "smooth", block: "start" });
      u_nombre.focus({ preventScroll: true });
    }
  }

  async function guardarUnidadesEnFirestore(p) {
    if (!p || !p.id) return;
    await setDoc(
      doc(db, "proyectos", p.id),
      {
        unidades: p.unidades || [],
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  async function eliminarUnidad(idx) {
    const p = getActivo();
    if (!p || !p.unidades || !p.unidades[idx]) return;
    const u = p.unidades[idx];
    const ok = confirm(`¿Eliminar la unidad "${u?.nombre || "sin nombre"}"?`);
    if (!ok) return;
    p.unidades.splice(idx, 1);
    renderUnidades(p);
    setMsg("Unidad eliminada. Guardando...");

    try {
      await guardarUnidadesEnFirestore(p);
      setMsg("Unidad eliminada y guardada ✅");
    } catch (err) {
      console.error("Error guardando unidades:", err);
      setMsg("No se pudo guardar. Guardá cambios manualmente.");
    }
  }

  function openUnidadActions(idx) {
    if (!unidadSheet) return;
    unidadSheet.dataset.idx = String(idx);
    unidadSheet.classList.add("open");
  }

  function closeUnidadActions() {
    if (!unidadSheet) return;
    unidadSheet.classList.remove("open");
  }

 function renderUnidades(p) {
  listaUnidadesPanel.innerHTML = "";

  if (!p.unidades || !p.unidades.length) {
    listaUnidadesPanel.innerHTML = "<p>No hay unidades cargadas.</p>";
    return;
  }

  const grupos = {};
  (p.unidades || []).forEach((u, idx) => {
    const key = (u.piso || "Sin piso").trim() || "Sin piso";
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push({ u, idx });
  });

  const ordenarPisos = (a, b) => {
    const rank = (s) => {
      const t = String(s || "").toLowerCase();
      if (t.includes("planta")) return 0;
      const m = t.match(/\d+/);
      if (m) return parseInt(m[0], 10);
      if (t.includes("cocher")) return 100;
      if (t.includes("terraza")) return 101;
      if (t.includes("otro")) return 102;
      if (t.includes("sin")) return 103;
      return 200;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "es", { numeric: true });
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

    grupos[piso].forEach(({ u, idx }) => {
      const row = document.createElement("div");
      row.className = "unidad-row";
      if (unidadHighlightIndex === idx) row.classList.add("unidad-highlight");

      const moneda = (u.moneda || "USD").toUpperCase();
      const precioTxt = u.precio ? `${moneda} ${u.precio}` : "Consultar";
      const fotosCount = Array.isArray(u.fotos) ? u.fotos.length : (u.__fotosFiles?.length || 0);
      const hasPdf = !!u.pdfUrl || !!u.__pdfFile;

      row.innerHTML = `
          <div class="unidad-row-body">
            <div class="unidad-row-head">
              <strong>${u.nombre}</strong>
              <span class="estado ${u.estado} unidad-estado unidad-estado-mobile">${u.estado}</span>
            </div>
            <ul class="unidad-info-list">
              <li><span class="label">Piso</span><span class="value">${u.piso || "Sin piso"}</span></li>
              <li><span class="label">Ambientes</span><span class="value">${u.ambientes || "-"}</span></li>
              <li><span class="label">Metros</span><span class="value">${u.metros || "-"} m2</span></li>
              <li><span class="label">Orientación</span><span class="value">${u.orientacion || "-"}</span></li>
              <li><span class="label">Vista</span><span class="value">${u.vista || "-"}</span></li>
              <li><span class="label">Personas</span><span class="value">${u.personas || "-"}</span></li>
              <li><span class="label">Precio</span><span class="value">${precioTxt}</span></li>
              <li><span class="label">Fotos</span><span class="value">${fotosCount}</span></li>
              <li>
                <span class="label">PDF</span>
                <span class="value">${hasPdf ? "sí" : "no"}</span>
              </li>
            </ul>

            <div class="unidad-actions unidad-actions-desktop">
              <span class="estado ${u.estado} unidad-estado unidad-estado-desktop">${u.estado}</span>
              <button type="button" class="btn mini">Editar</button>
              <button type="button" class="btn mini danger">Eliminar</button>
            </div>
          </div>

        <button type="button" class="unidad-menu unidad-actions-mobile" aria-label="Acciones" data-idx="${idx}">⋯</button>
      `;

      row.querySelector(".unidad-actions-desktop .btn.mini:not(.danger)")?.addEventListener("click", () => {
        editarUnidad(idx);
      });

      row.querySelector(".unidad-actions-desktop .danger").onclick = () => {
        eliminarUnidad(idx);
      };

      const menuBtn = row.querySelector(".unidad-menu");
      menuBtn?.addEventListener("click", () => {
        openUnidadActions(idx);
      });

      bloque.appendChild(row);
    });

    listaUnidadesPanel.appendChild(bloque);
  });

  if (unidadHighlightIndex !== null) {
    const el = listaUnidadesPanel.querySelector(".unidad-highlight");
    if (el) {
      setTimeout(() => {
        el.classList.remove("unidad-highlight");
      }, 1800);
    }
    unidadHighlightIndex = null;
  }
}

function renderFotosPreview() {
    if (!previewFotos) return;
    previewFotos.innerHTML = "";

    // existentes (URLs/DataURL)
    fotosExistentes.forEach((url, idx) => {
      const div = document.createElement("div");
      div.className = "foto-item";
      div.innerHTML = `
        <img src="${url}" alt="foto">
        <button type="button" class="btn-x" title="Quitar">✕</button>
        <div class="tag">Guardada</div>
      `;
      div.querySelector(".btn-x").onclick = () => {
        fotosExistentes.splice(idx, 1);

        // sincroniza con el proyecto activo
        const p = getActivo();
        if (p) {
          p.fotos = [...fotosExistentes];
        }
        renderFotosPreview();
      };
      previewFotos.appendChild(div);
    });

    // nuevas (Files)
    fotosNuevas.forEach((file, idx) => {
      const blobUrl = URL.createObjectURL(file);
      const div = document.createElement("div");
      div.className = "foto-item";
      div.innerHTML = `
        <img src="${blobUrl}" alt="foto nueva">
        <button type="button" class="btn-x" title="Quitar">✕</button>
        <div class="tag">Nueva</div>
      `;
      div.querySelector(".btn-x").onclick = () => {
        fotosNuevas.splice(idx, 1);
        renderFotosPreview();
      };
      previewFotos.appendChild(div);
    });
  }

  function renderUnidadFotosPreview() {
    if (!previewUnidadFotos) return;
    previewUnidadFotos.innerHTML = "";

    unidadFotosExistentes.forEach((url, idx) => {
      const div = document.createElement("div");
      div.className = "foto-item";
      div.innerHTML = `
        <img src="${url}" alt="foto unidad">
        <button type="button" class="btn-x" title="Quitar">✕</button>
        <div class="tag">Guardada</div>
      `;
      div.querySelector(".btn-x").onclick = () => {
        unidadFotosExistentes.splice(idx, 1);
        renderUnidadFotosPreview();
      };
      previewUnidadFotos.appendChild(div);
    });

    unidadFotosNuevas.forEach((file, idx) => {
      const blobUrl = URL.createObjectURL(file);
      const div = document.createElement("div");
      div.className = "foto-item";
      div.innerHTML = `
        <img src="${blobUrl}" alt="foto nueva">
        <button type="button" class="btn-x" title="Quitar">✕</button>
        <div class="tag">Nueva</div>
      `;
      div.querySelector(".btn-x").onclick = () => {
        unidadFotosNuevas.splice(idx, 1);
        renderUnidadFotosPreview();
      };
      previewUnidadFotos.appendChild(div);
    });
  }

  function renderAvancesPanel() {
    if (!listaAvancesPanel) return;
    listaAvancesPanel.innerHTML = "";
    if (!avancesData.length) {
      listaAvancesPanel.innerHTML = "<p class='muted small'>No hay avances cargados.</p>";
      return;
    }
    const sorted = avancesData
      .map((a, i) => ({ a, i }))
      .sort((x, y) => (y.a.fecha || "").localeCompare(x.a.fecha || ""));

    sorted.forEach(({ a, i }) => {
      const isVideo = a.tipo === "video" || /\.(mp4|webm)($|\?)/i.test(a.mediaUrl || "");
      const div = document.createElement("div");
      div.className = "avance-panel-item";
      div.innerHTML = `
        <div class="avance-panel-media">
          ${isVideo
            ? `<video src="${a.mediaUrl}" muted playsinline class="avance-panel-thumb"></video>`
            : `<img src="${a.mediaUrl}" alt="avance" class="avance-panel-thumb">`
          }
        </div>
        <div class="avance-panel-info">
          <span class="avance-panel-fecha">${a.fecha || "Sin fecha"}</span>
          <span class="avance-panel-tipo">${isVideo ? "Video" : "Foto"}</span>
        </div>
        <button type="button" class="btn mini danger avance-del">Eliminar</button>
      `;
      div.querySelector(".avance-del").onclick = async () => {
        if (!confirm("¿Eliminar este avance?")) return;
        avancesData.splice(i, 1);
        const p = getActivo();
        if (p) p.avances = [...avancesData];
        try {
          await guardarAvancesEnFirestore(p);
          setMsg("Avance eliminado ✅");
        } catch (err) {
          console.error(err);
          setMsg("Error eliminando avance.");
        }
        renderAvancesPanel();
      };
      listaAvancesPanel.appendChild(div);
    });
  }

  async function guardarAvancesEnFirestore(p) {
    if (!p?.id) return;
    await setDoc(
      doc(db, "proyectos", p.id),
      { avances: avancesData, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  function renderPlanosPreview() {
    if (!previewPlanos) return;
    previewPlanos.innerHTML = "";

    // existentes (URLs/DataURL)
    planosExistentes.forEach((url, idx) => {
      const div = document.createElement("div");
      div.className = "foto-item";
      if (isPdfUrl(url)) {
        div.innerHTML = `
          <div class="tag">PDF</div>
          <div style="padding:10px; font-weight:700; font-size:13px;">Plano PDF</div>
          <button type="button" class="btn-x" title="Quitar">&#10006;</button>
        `;
      } else {
        div.innerHTML = `
          <img src="${url}" alt="plano">
          <button type="button" class="btn-x" title="Quitar">&#10006;</button>
          <div class="tag">Guardado</div>
        `;
      }
      div.querySelector(".btn-x").onclick = () => {
        planosExistentes.splice(idx, 1);

        const p = getActivo();
        if (p) {
          p.planos = [...planosExistentes];
        }
        renderPlanosPreview();
      };
      previewPlanos.appendChild(div);
    });

    // nuevas (Files)
    planosNuevos.forEach((file, idx) => {
      const blobUrl = URL.createObjectURL(file);
      const div = document.createElement("div");
      div.className = "foto-item";
      if (isPdfFile(file)) {
        div.innerHTML = `
          <div class="tag">PDF</div>
          <div style="padding:10px; font-weight:700; font-size:13px;">Plano PDF</div>
          <button type="button" class="btn-x" title="Quitar">&#10006;</button>
        `;
      } else {
        div.innerHTML = `
          <img src="${blobUrl}" alt="plano nuevo">
          <button type="button" class="btn-x" title="Quitar">&#10006;</button>
          <div class="tag">Nuevo</div>
        `;
      }
      div.querySelector(".btn-x").onclick = () => {
        planosNuevos.splice(idx, 1);
        renderPlanosPreview();
      };
      previewPlanos.appendChild(div);
    });
  }

  function renderNosotrosPreview() {
    if (n_p1_preview) n_p1_preview.innerHTML = "";
    if (n_p2_preview) n_p2_preview.innerHTML = "";

    const renderOne = (wrap, url, isNueva) => {
      if (!wrap || !url) return;
      const div = document.createElement("div");
      div.className = "foto-item";
      div.innerHTML = `
        <img src="${url}" alt="foto">
        <div class="tag">${isNueva ? "Nueva" : "Guardada"}</div>
      `;
      wrap.appendChild(div);
    };

    if (n_p1_preview) {
      const url = n_p1_foto_nueva ? URL.createObjectURL(n_p1_foto_nueva) : n_p1_foto_url;
      renderOne(n_p1_preview, url, !!n_p1_foto_nueva);
    }
    if (n_p2_preview) {
      const url = n_p2_foto_nueva ? URL.createObjectURL(n_p2_foto_nueva) : n_p2_foto_url;
      renderOne(n_p2_preview, url, !!n_p2_foto_nueva);
    }
  }

  async function cargarNosotrosEnEditor() {
    try {
      const snap = await getDoc(doc(db, "site", "nosotros"));
      nosotrosData = snap.exists() ? (snap.data() || {}) : {};

      n_titulo.value = nosotrosData.titulo || "El equipo detrás de cada proyecto";
      n_subtitulo.value = nosotrosData.subtitulo || "Profesionales comprometidos con la excelencia y tu satisfacción.";

      n_p1_nombre.value = nosotrosData.personas?.[0]?.nombre || "";
      n_p1_items.value = (nosotrosData.personas?.[0]?.items || []).join("\n");
      n_p1_foto_url = nosotrosData.personas?.[0]?.fotoUrl || "";

      n_p2_nombre.value = nosotrosData.personas?.[1]?.nombre || "";
      n_p2_items.value = (nosotrosData.personas?.[1]?.items || []).join("\n");
      n_p2_foto_url = nosotrosData.personas?.[1]?.fotoUrl || "";

      n_mision.value = nosotrosData.mision || "";
      n_vision.value = nosotrosData.vision || "";

      n_steps_title.value = nosotrosData.stepsTitle || "Lo que hace un desarrollador";
      n_steps_sub.value = nosotrosData.stepsSub || "Seis etapas que garantizan excelencia de principio a fin.";

      const steps = nosotrosData.steps || [];
      n_s1_title.value = steps[0]?.titulo || "";
      n_s1_text.value = steps[0]?.texto || "";
      n_s2_title.value = steps[1]?.titulo || "";
      n_s2_text.value = steps[1]?.texto || "";
      n_s3_title.value = steps[2]?.titulo || "";
      n_s3_text.value = steps[2]?.texto || "";
      n_s4_title.value = steps[3]?.titulo || "";
      n_s4_text.value = steps[3]?.texto || "";
      n_s5_title.value = steps[4]?.titulo || "";
      n_s5_text.value = steps[4]?.texto || "";
      n_s6_title.value = steps[5]?.titulo || "";
      n_s6_text.value = steps[5]?.texto || "";

      renderNosotrosPreview();
    } catch (err) {
      console.error("Error cargando Nosotros:", err);
    }
  }
  inputFotos?.addEventListener("change", () => {
    const files = Array.from(inputFotos.files || []);
    if (!files.length) return;

    const maxMB = 6;
    const ok = files.filter(f => f.size <= maxMB * 1024 * 1024);
    if (ok.length !== files.length) {
      alert(`Algunas fotos superan ${maxMB}MB y no se agregaron.`);
    }

    const MAX_FOTOS = 10;
    const disponibles = MAX_FOTOS - (fotosExistentes.length + fotosNuevas.length);
    if (disponibles <= 0) {
      alert(`Máximo ${MAX_FOTOS} fotos por proyecto.`);
      inputFotos.value = "";
      return;
    }
    fotosNuevas.push(...ok.slice(0, disponibles));
    inputFotos.value = "";
    renderFotosPreview();
  });

  btnLimpiarFotos?.addEventListener("click", () => {
    fotosNuevas = [];
    renderFotosPreview();
  });

  inputPlanos?.addEventListener("change", () => {
    const files = Array.from(inputPlanos.files || []);
    if (!files.length) return;

    const maxMB = 6;
    const ok = files.filter(f => f.size <= maxMB * 1024 * 1024);
    if (ok.length !== files.length) {
      alert(`Algunos planos superan ${maxMB}MB y no se agregaron.`);
    }

    planosNuevos.push(...ok);
    inputPlanos.value = "";
    renderPlanosPreview();
  });

  btnLimpiarPlanos?.addEventListener("click", () => {
    planosNuevos = [];
    renderPlanosPreview();
  });

  btnAgregarAvance?.addEventListener("click", async () => {
    const p = getActivo();
    if (!p) { setMsg("Seleccioná un proyecto primero."); return; }

    const fecha = a_fecha?.value || "";
    const file = a_media?.files?.[0] || null;

    if (!fecha) { alert("Ingresá la fecha del avance."); return; }
    if (!file) { alert("Seleccioná una foto o video."); return; }

    const oldTxt = btnAgregarAvance.textContent;
    btnAgregarAvance.disabled = true;
    btnAgregarAvance.textContent = "Subiendo...";

    try {
      const ownerUid = auth.currentUser?.uid;
      const basePath = ownerUid ? `proyectos/${ownerUid}/${p.id}` : `proyectos/${p.id}`;
      const safeName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
      const url = await subirArchivoAStorage(file, `${basePath}/avances/${safeName}`);

      const tipo = file.type.startsWith("video") ? "video" : "foto";
      avancesData.push({ fecha, mediaUrl: url, tipo });
      p.avances = [...avancesData];

      await guardarAvancesEnFirestore(p);

      if (a_fecha) a_fecha.value = "";
      if (a_media) a_media.value = "";
      renderAvancesPanel();
      setMsg("Avance guardado ✅");
    } catch (err) {
      console.error(err);
      alert("Error subiendo el avance.");
    } finally {
      btnAgregarAvance.disabled = false;
      btnAgregarAvance.textContent = oldTxt;
    }
  });

  n_p1_foto?.addEventListener("change", () => {
    n_p1_foto_nueva = n_p1_foto.files?.[0] || null;
    renderNosotrosPreview();
  });

  n_p2_foto?.addEventListener("change", () => {
    n_p2_foto_nueva = n_p2_foto.files?.[0] || null;
    renderNosotrosPreview();
  });

  tabProyecto?.addEventListener("click", () => {
    showProyectoEditor();
  });

  tabNosotros?.addEventListener("click", async () => {
    showNosotrosEditor();
    await cargarNosotrosEnEditor();
  });

  unidadEditBtn?.addEventListener("click", () => {
    const idx = Number(unidadSheet?.dataset.idx || "-1");
    if (idx >= 0) editarUnidad(idx);
    closeUnidadActions();
  });

  unidadDeleteBtn?.addEventListener("click", async () => {
    const idx = Number(unidadSheet?.dataset.idx || "-1");
    if (idx >= 0) await eliminarUnidad(idx);
    closeUnidadActions();
  });

  unidadCancelBtn?.addEventListener("click", closeUnidadActions);
  unidadSheet?.addEventListener("click", (e) => {
    if (e.target === unidadSheet) closeUnidadActions();
  });

  u_fotos?.addEventListener("change", () => {
    const files = Array.from(u_fotos.files || []);
    if (!files.length) return;
    const MAX_FOTOS = 6;
    const disponibles = MAX_FOTOS - (unidadFotosExistentes.length + unidadFotosNuevas.length);
    if (disponibles <= 0) {
      alert(`Máximo ${MAX_FOTOS} fotos por unidad.`);
      u_fotos.value = "";
      return;
    }
    unidadFotosNuevas.push(...files.slice(0, disponibles));
    if (files.length > disponibles) {
      alert(`Máximo ${MAX_FOTOS} fotos por unidad. Solo se agregaron ${disponibles}.`);
    }
    u_fotos.value = "";
    renderUnidadFotosPreview();
  });

  u_pdf?.addEventListener("change", () => {
    const file = u_pdf.files?.[0] || null;
    unidadPdfNuevo = file;
  });

  function limpiarEditor() {
    p_id.value = "";
    p_nombre.value = "";
    p_direccion.value = "";
    p_descripcion.value = "";
    p_mapa.value = "";
    p_puntos.value = "";
    p_calidad.value = "";
    p_destacado.checked = false;
    if (p_estado) p_estado.value = "en_obra";
    p_whatsapp.value = "";
    p_mensajeWpp.value = "";

    avancesData = [];
    renderAvancesPanel();

    fotosExistentes = [];
    fotosNuevas = [];
    renderFotosPreview();

    planosExistentes = [];
    planosNuevos = [];
    renderPlanosPreview();

    unidadFotosNuevas = [];
    unidadFotosExistentes = [];
    if (u_fotos) u_fotos.value = "";
    renderUnidadFotosPreview();
    if (unidadArchivos) unidadArchivos.classList.add("is-hidden");

    listaUnidadesPanel.innerHTML = "";
    unidadEditIndex = null;
    if (btnAgregarUnidad) btnAgregarUnidad.textContent = "Agregar";
    if (btnCancelarEdicion) btnCancelarEdicion.classList.add("is-hidden");
  }

  function cargarEnEditor() {
    const p = getActivo();
    if (!p) {
      limpiarEditor();
      setEditorEnabled(false);
      return;
    }

    setEditorEnabled(true);
    p_id.value = p.id || "";
    p_nombre.value = p.nombre || "";
    p_direccion.value = p.direccion || "";
    p_descripcion.value = p.descripcion || "";
    p_mapa.value = p.mapaEmbed || "";
    p_puntos.value = Array.isArray(p.puntosClave) ? p.puntosClave.join("\n") : "";
    p_calidad.value = Array.isArray(p.calidadConstructiva) ? p.calidadConstructiva.join("\n") : "";
    p_destacado.checked = !!p.destacado;
    if (p_estado) p_estado.value = p.estadoObra || "en_obra";
    p_whatsapp.value = p.whatsapp || "";
    p_mensajeWpp.value = p.mensajeWpp || "";

    // avances
    avancesData = Array.isArray(p.avances) ? [...p.avances] : [];
    renderAvancesPanel();

    // fotos
    fotosExistentes = Array.isArray(p.fotos) ? [...p.fotos] : [];
    fotosNuevas = [];
    renderFotosPreview();

    // planos
    planosExistentes = Array.isArray(p.planos) ? [...p.planos] : [];
    planosNuevos = [];
    renderPlanosPreview();

    renderUnidades(p);
    unidadEditIndex = null;
    if (btnAgregarUnidad) btnAgregarUnidad.textContent = "Agregar";
    if (btnCancelarEdicion) btnCancelarEdicion.classList.add("is-hidden");
  }

  // Nuevo proyecto
  btnNuevo.addEventListener("click", () => {
    const base = "nuevo-proyecto";
    let id = base;
    let i = 1;
    while (proyectos.some(p => p.id === id)) {
      id = `${base}-${i++}`;
    }

    proyectos.unshift({
      id,
      nombre: "Nuevo proyecto",
      ubicacion: "",
      descripcion: "",
      whatsapp: "",
      mensajeWpp: "",
      calidadConstructiva: [],
      destacado: false,
      estadoObra: "en_obra",
      owner: auth.currentUser?.uid || "",
      fotos: [],
      planos: [],     // 👈 NUEVO
      unidades: []
    });

    activoId = id;
    renderLista();
    cargarEnEditor();
    setMsg("Proyecto creado.");
    showProyectoEditor();
  });

// Agregar unidad
btnAgregarUnidad?.addEventListener("click", () => {
  const p = getActivo();
  if (!p) {
    setMsg("Seleccioná un proyecto primero.");
    return;
  }

  const nom = u_nombre.value.trim();
  const amb = u_amb.value.trim();
  const met = u_metros.value.trim();
  const pre = u_precio.value.trim();
  const mon = (u_moneda?.value || "USD").trim();
  const ori = (u_orientacion?.value || "").trim();
  const vis = (u_vista?.value || "").trim();
  const per = (u_personas?.value || "").trim();
  const pis = (u_piso?.value || "").trim();
  const est = u_estado.value;
  const fotosFiles = [...unidadFotosNuevas];
  const pdfFile = unidadPdfNuevo;

  // mínimo requerido
  if (!nom) {
    alert("Ingresá al menos el nombre de la unidad");
    return;
  }

  p.unidades = p.unidades || [];
  const baseUnidad = unidadEditIndex !== null ? (p.unidades[unidadEditIndex] || {}) : {};
  const nuevaUnidad = {
    ...baseUnidad,
    nombre: nom,
    piso: pis,
    ambientes: amb,
    metros: met,
    precio: pre,
    moneda: mon,
    orientacion: ori,
    vista: vis,
    personas: per,
    estado: est
  };

  nuevaUnidad.fotos = [...unidadFotosExistentes];
  if (fotosFiles.length) {
    nuevaUnidad.__fotosFiles = fotosFiles;
  }
  if (pdfFile) {
    nuevaUnidad.__pdfFile = pdfFile;
  }

  if (unidadEditIndex !== null) {
    p.unidades[unidadEditIndex] = nuevaUnidad;
    unidadHighlightIndex = unidadEditIndex;
  } else {
    p.unidades.push(nuevaUnidad);
    unidadHighlightIndex = p.unidades.length - 1;
  }

  // limpiar formulario
  u_nombre.value = "";
  u_amb.value = "";
  u_metros.value = "";
  u_precio.value = "";
  if (u_moneda) u_moneda.value = "USD";
  if (u_orientacion) u_orientacion.value = "";
  if (u_vista) u_vista.value = "";
  if (u_personas) u_personas.value = "";
  if (u_piso) u_piso.value = "Planta baja";
  u_estado.value = "disponible";
  unidadFotosNuevas = [];
  unidadFotosExistentes = [];
  unidadPdfNuevo = null;
  if (u_fotos) u_fotos.value = "";
  if (u_pdf) u_pdf.value = "";
  renderUnidadFotosPreview();
  if (unidadArchivos) unidadArchivos.classList.add("is-hidden");

  renderUnidades(p);
  const estabaEditando = unidadEditIndex !== null;
  if (estabaEditando) {
    setMsg("Unidad actualizada. Guardando...");
  } else {
    setMsg("Unidad agregada. Guardando...");
  }

  unidadEditIndex = null;
  if (btnAgregarUnidad) btnAgregarUnidad.textContent = "Agregar";
  if (btnCancelarEdicion) btnCancelarEdicion.classList.add("is-hidden");

  guardarUnidadesEnFirestore(p)
    .then(() => {
      setMsg(estabaEditando ? "Unidad actualizada y guardada ✅" : "Unidad agregada y guardada ✅");
    })
    .catch((err) => {
      console.error("Error guardando unidades:", err);
      setMsg("No se pudo guardar. Guardá cambios manualmente.");
    });
}); 

btnCancelarEdicion?.addEventListener("click", () => {
  unidadEditIndex = null;
  u_nombre.value = "";
  u_amb.value = "";
  u_metros.value = "";
  u_precio.value = "";
  if (u_moneda) u_moneda.value = "USD";
  if (u_orientacion) u_orientacion.value = "";
  if (u_vista) u_vista.value = "";
  if (u_personas) u_personas.value = "";
  if (u_piso) u_piso.value = "Planta baja";
  u_estado.value = "disponible";
  unidadFotosNuevas = [];
  unidadFotosExistentes = [];
  unidadPdfNuevo = null;
  if (u_fotos) u_fotos.value = "";
  if (u_pdf) u_pdf.value = "";
  renderUnidadFotosPreview();
  if (unidadArchivos) unidadArchivos.classList.add("is-hidden");
  if (btnAgregarUnidad) btnAgregarUnidad.textContent = "Agregar";
  btnCancelarEdicion.classList.add("is-hidden");
  setMsg("Edición cancelada.");
});

  // Guardar Nosotros (general)
  formNosotros?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!btnGuardarNosotros) return;

    const oldTxt = btnGuardarNosotros.textContent;
    btnGuardarNosotros.disabled = true;
    btnGuardarNosotros.textContent = "Guardando...";

    try {
      const basePath = "site/nosotros";

      if (n_p1_foto_nueva) {
        const safeName = `${Date.now()}-p1-${n_p1_foto_nueva.name}`.replace(/\s+/g, "-");
        n_p1_foto_url = await subirArchivoAStorage(n_p1_foto_nueva, `${basePath}/${safeName}`);
        n_p1_foto_nueva = null;
      }
      if (n_p2_foto_nueva) {
        const safeName = `${Date.now()}-p2-${n_p2_foto_nueva.name}`.replace(/\s+/g, "-");
        n_p2_foto_url = await subirArchivoAStorage(n_p2_foto_nueva, `${basePath}/${safeName}`);
        n_p2_foto_nueva = null;
      }

      const data = {
        titulo: (n_titulo.value || "").trim(),
        subtitulo: (n_subtitulo.value || "").trim(),
        mision: (n_mision.value || "").trim(),
        vision: (n_vision.value || "").trim(),
        stepsTitle: (n_steps_title.value || "").trim(),
        stepsSub: (n_steps_sub.value || "").trim(),
        personas: [
          {
            nombre: (n_p1_nombre.value || "").trim(),
            items: (n_p1_items.value || "").split("\n").map(x => x.trim()).filter(Boolean),
            fotoUrl: n_p1_foto_url || ""
          },
          {
            nombre: (n_p2_nombre.value || "").trim(),
            items: (n_p2_items.value || "").split("\n").map(x => x.trim()).filter(Boolean),
            fotoUrl: n_p2_foto_url || ""
          }
        ],
        steps: [
          { titulo: (n_s1_title.value || "").trim(), texto: (n_s1_text.value || "").trim() },
          { titulo: (n_s2_title.value || "").trim(), texto: (n_s2_text.value || "").trim() },
          { titulo: (n_s3_title.value || "").trim(), texto: (n_s3_text.value || "").trim() },
          { titulo: (n_s4_title.value || "").trim(), texto: (n_s4_text.value || "").trim() },
          { titulo: (n_s5_title.value || "").trim(), texto: (n_s5_text.value || "").trim() },
          { titulo: (n_s6_title.value || "").trim(), texto: (n_s6_text.value || "").trim() }
        ]
      };

      await setDoc(doc(db, "site", "nosotros"), data, { merge: true });
      setMsgNosotros("Guardado ✅");
      renderNosotrosPreview();
    } catch (err) {
      console.error(err);
      alert("Error guardando Nosotros.");
    } finally {
      btnGuardarNosotros.disabled = false;
      btnGuardarNosotros.textContent = oldTxt || "Guardar Nosotros";
    }
  });

  // Guardar cambios del proyecto
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = getActivo();
    if (!p) return;

    const btnSubmit = form.querySelector('button[type="submit"]');
    const oldTxt = btnSubmit?.textContent;
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Guardando...";
    }

    try {
      p.nombre = (p_nombre.value || "").trim();
      p.direccion = (p_direccion.value || "").trim();
      p.descripcion = (p_descripcion.value || "").trim();
      p.mapaEmbed = (p_mapa.value || "").trim();
      p.puntosClave = (p_puntos.value || "")
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);
      p.calidadConstructiva = (p_calidad.value || "")
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);
      p.destacado = !!p_destacado.checked;
      p.estadoObra = (p_estado?.value || "").trim() || "en_obra";
      p.whatsapp = (p_whatsapp.value || "").trim();
      p.mensajeWpp = (p_mensajeWpp.value || "").trim();
      if (!p.owner) p.owner = auth.currentUser?.uid || "";

      // Mantener existentes + nuevas (archivos)
      p.fotos = [...fotosExistentes];
      p.planos = [...planosExistentes];

      // si cambió el nombre, ajustamos id si estaba “nuevo”
      if (p.id.startsWith("nuevo-proyecto")) {
        const nuevoId = slugify(p.nombre) || p.id;
        if (!proyectos.some(x => x.id === nuevoId)) {
          p.id = nuevoId;
          activoId = nuevoId;
        }
      }

      // ===== Subir imágenes a Storage y guardar SOLO URLs =====
      const ownerUid = auth.currentUser?.uid;
      const basePath = ownerUid ? `proyectos/${ownerUid}/${p.id}` : `proyectos/${p.id}`;
      const fotosUrls = [...p.fotos];
      for (let i = 0; i < fotosNuevas.length; i++) {
        const file = fotosNuevas[i];
        const safeName = `${Date.now()}-${i}-${file.name}`.replace(/\s+/g, "-");
        const url = await subirArchivoAStorage(
          file,
          `${basePath}/fotos/${safeName}`
        );
        fotosUrls.push(url);
      }

      const planosUrls = [...p.planos];
      for (let i = 0; i < planosNuevos.length; i++) {
        const file = planosNuevos[i];
        const safeName = `${Date.now()}-${i}-${file.name}`.replace(/\s+/g, "-");
        const url = await subirArchivoAStorage(
          file,
          `${basePath}/planos/${safeName}`
        );
        planosUrls.push(url);
      }

      // ===== Subir adjuntos por unidad (fotos + PDF) =====
      const unidadesFinal = [];
      for (let i = 0; i < (p.unidades || []).length; i++) {
        const u = p.unidades[i];
        const uOut = { ...u };
        const slugU = slugify(u.nombre || `unidad-${i + 1}`);

        if (Array.isArray(uOut.__fotosFiles) && uOut.__fotosFiles.length) {
          const fotosUrls = Array.isArray(uOut.fotos) ? [...uOut.fotos] : [];
          for (let j = 0; j < uOut.__fotosFiles.length; j++) {
            const file = uOut.__fotosFiles[j];
            const safeName = `${Date.now()}-${j}-${file.name}`.replace(/\s+/g, "-");
            const url = await subirArchivoAStorage(
              file,
              `${basePath}/unidades/${slugU}-${i}/fotos/${safeName}`
            );
            fotosUrls.push(url);
          }
          uOut.fotos = fotosUrls;
        }

        if (uOut.__pdfFile) {
          const file = uOut.__pdfFile;
          const safeName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
          const url = await subirArchivoAStorage(
            file,
            `${basePath}/unidades/${slugU}-${i}/pdf/${safeName}`
          );
          uOut.pdfUrl = url;
        }

        delete uOut.__fotosFiles;
        delete uOut.__pdfFile;
        unidadesFinal.push(uOut);
      }

      p.unidades = unidadesFinal;

      // ===== Guardar en Firestore SIN base64 =====
      await setDoc(
        doc(db, "proyectos", p.id),
        {
          ...p,
          fotos: fotosUrls,
          planos: planosUrls,
          owner: auth.currentUser.uid,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

console.log("🔥 Proyecto guardado (datos + URLs)");

      // resetear nuevas y refrescar
      fotosExistentes = [...fotosUrls];
      fotosNuevas = [];
      planosExistentes = [...planosUrls];
      planosNuevos = [];

      renderLista();
      cargarEnEditor(); // refresca previews y estado
      setMsg("Guardado ✅");

    } catch (err) {
      console.error(err);
      alert("Error guardando. Probá con imágenes más livianas.");
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = oldTxt || "Guardar cambios";
      }
    }
  });

  // Eliminar
  btnEliminar.addEventListener("click", () => {
    const p = getActivo();
    if (!p) return;

    const ok = confirm(`¿Eliminar "${p.nombre}"?`);
    if (!ok) return;

    proyectos = proyectos.filter(x => x.id !== p.id);
    activoId = proyectos[0]?.id || null;

    // ===== Eliminar también de Firestore =====
deleteDoc(doc(db, "proyectos", p.id))
  .then(() => console.log("🗑️ Proyecto eliminado de Firestore:", p.id))
  .catch(err => console.error("Error borrando en Firestore", err));

    renderLista();
    cargarEnEditor();
    setMsg("Eliminado.");
  });

  // Logout
  btnLogout.addEventListener("click", () => {
    signOut(auth).finally(() => {
      window.location.href = "login.html";
    });
  });

  // Inicial
  (async () => {
    proyectos = await cargarProyectosDesdeFirestore();
    activoId = proyectos[0]?.id || null;
    renderLista();
    cargarEnEditor();
    await cargarNosotrosEnEditor();
    showProyectoEditor();
  })();
  }
});




