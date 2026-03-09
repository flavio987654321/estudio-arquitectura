import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
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
  const editorHint = document.getElementById("editorHint");

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
  const p_whatsapp = document.getElementById("p_whatsapp");
  const p_mensajeWpp = document.getElementById("p_mensajeWpp");

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
  const u_piso = document.getElementById("u_piso");
  const u_estado = document.getElementById("u_estado");
  const btnAgregarUnidad = document.getElementById("btnAgregarUnidad");
  const listaUnidadesPanel = document.getElementById("listaUnidadesPanel");
  const u_fotos = document.getElementById("u_fotos");
  const u_pdf = document.getElementById("u_pdf");

  const btnEliminar = document.getElementById("btnEliminar");

  let proyectos = [];
  let activoId = null;
  let unidadFotosNuevas = [];
  let unidadPdfNuevo = null;

  function setMsg(text) {
    if (!msg) return;
    msg.textContent = text || "";
    if (text) setTimeout(() => (msg.textContent = ""), 2200);
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
      });
      listaProyectos.appendChild(item);
    });
  }

  function getActivo() {
    return proyectos.find(p => p.id === activoId) || null;
  }

 function renderUnidades(p) {
  listaUnidadesPanel.innerHTML = "";

  (p.unidades || []).forEach((u, idx) => {
    const row = document.createElement("div");
    row.className = "unidad-row";

    const moneda = (u.moneda || "USD").toUpperCase();
    const precioTxt = u.precio ? `${moneda} ${u.precio}` : "Consultar";
    const fotosCount = Array.isArray(u.fotos) ? u.fotos.length : (u.__fotosFiles?.length || 0);
    const hasPdf = !!u.pdfUrl || !!u.__pdfFile;

    row.innerHTML = `
      <div>
        <strong>${u.nombre}</strong>
        <div class="info">🧱 ${u.piso || "Sin piso"}</div>
        <div class="info">
          🛏️ ${u.ambientes || "-"} amb · 📐 ${u.metros || "-"} m² · 💰 ${precioTxt}
        </div>
        <div class="info">
          📷 ${fotosCount} fotos · 📄 ${hasPdf ? "PDF" : "sin PDF"}
        </div>
      </div>

      <div class="unidad-actions">
        <span class="estado ${u.estado}">${u.estado}</span>
        <button type="button" class="btn mini danger">✕</button>
      </div>
    `;

    row.querySelector(".danger").onclick = () => {
      p.unidades.splice(idx, 1);
      renderUnidades(p);
    };

    listaUnidadesPanel.appendChild(row);
  });
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

  u_fotos?.addEventListener("change", () => {
    const files = Array.from(u_fotos.files || []);
    if (!files.length) return;
    const MAX_FOTOS = 10;
    unidadFotosNuevas = files.slice(0, MAX_FOTOS);
    if (files.length > MAX_FOTOS) {
      alert(`Máximo ${MAX_FOTOS} fotos por unidad.`);
    }
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
    p_whatsapp.value = "";
    p_mensajeWpp.value = "";

    fotosExistentes = [];
    fotosNuevas = [];
    renderFotosPreview();

    planosExistentes = [];
    planosNuevos = [];
    renderPlanosPreview();

    listaUnidadesPanel.innerHTML = "";
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
    p_whatsapp.value = p.whatsapp || "";
    p_mensajeWpp.value = p.mensajeWpp || "";

    // fotos
    fotosExistentes = Array.isArray(p.fotos) ? [...p.fotos] : [];
    fotosNuevas = [];
    renderFotosPreview();

    // planos
    planosExistentes = Array.isArray(p.planos) ? [...p.planos] : [];
    planosNuevos = [];
    renderPlanosPreview();

    renderUnidades(p);
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
      owner: auth.currentUser?.uid || "",
      fotos: [],
      planos: [],     // 👈 NUEVO
      unidades: []
    });

    activoId = id;
    renderLista();
    cargarEnEditor();
    setMsg("Proyecto creado.");
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
  p.unidades.push({
    nombre: nom,
    piso: pis,
    ambientes: amb,
    metros: met,
    precio: pre,
    moneda: mon,
    estado: est,
    __fotosFiles: fotosFiles,
    __pdfFile: pdfFile
  });

  // limpiar formulario
  u_nombre.value = "";
  u_amb.value = "";
  u_metros.value = "";
  u_precio.value = "";
  if (u_moneda) u_moneda.value = "USD";
  if (u_piso) u_piso.value = "Planta baja";
  u_estado.value = "disponible";
  unidadFotosNuevas = [];
  unidadPdfNuevo = null;
  if (u_fotos) u_fotos.value = "";
  if (u_pdf) u_pdf.value = "";

  renderUnidades(p);
  setMsg("Unidad agregada. Recordá guardar cambios.");
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
  })();
  }
});


