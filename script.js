/* =========================================================
   PRAISE GROUP - SCRIPT (LIMPO E SEM TRAVAR O HOME)
========================================================= */

/* =========================
   1) LOADER (fecha se existir)
========================= */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (!loader) return;

  const close = () => {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 700);
  };

  setTimeout(close, 700);
  setTimeout(close, 4000);
});

/* =========================
   2) DARK MODE (global)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkToggle");
  const tema = localStorage.getItem("tema") || "dark";

  if (tema === "light") document.body.classList.add("light");
  if (toggle) toggle.checked = (tema === "light");

  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("light");
      localStorage.setItem("tema", document.body.classList.contains("light") ? "light" : "dark");
    });
  }

  initHamburger();
  initFirestoreFeatures();
});

/* =========================
   3) HAMBURGER (MOBILE)
========================= */
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("mainNav");
  if (!btn || !nav) return;

  const closeMenu = () => {
    nav.classList.remove("nav-open");
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  const toggleMenu = () => {
    const open = nav.classList.toggle("nav-open");
    btn.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  btn.addEventListener("click", toggleMenu);
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("nav-open")) return;
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    closeMenu();
  });
}

/* =========================
   4) FIRESTORE (dinâmico)
========================= */
async function initFirestoreFeatures() {
  const isRepertorio = !!document.getElementById("listaLouvores");
  const isNovoLouvor = !!document.getElementById("pessoa") && !!document.getElementById("nome");
  const isAgenda = !!document.querySelector(".day-card");

  if (!isRepertorio && !isNovoLouvor && !isAgenda) return;

  let fb;
  try {
    fb = await import("./firebase.js");
  } catch (err) {
    console.error("Erro ao carregar firebase.js:", err);
    alert("Firebase não carregou. Verifique firebase.js e as regras do Firestore.");
    return;
  }

  if (isRepertorio) setupRepertorioFirestore(fb);
  if (isNovoLouvor) setupNovoLouvorFirestore(fb);
  if (isAgenda) setupAgendaFirestore(fb);
}

/* =========================
   5) REPERTÓRIO (Firestore realtime)
========================= */
function setupRepertorioFirestore(fb) {
  let unsubscribe = null;

  // 1) Define a função global PRIMEIRO (para o onclick funcionar)
  window.abrirLouvores = function (pessoa) {
    const container = document.getElementById("listaLouvores");
    if (!container) return;

    if (typeof unsubscribe === "function") unsubscribe();

    const nomesBonitos = {
      joao: "João",
      antonio: "Antonio Carlos",
      sofia: "Sofia",
      jessica: "Jessica",
      laura: "Laura",
      kele: "Kele",
      eliana: "Eliana",
      edilene: "Edilene",
      elaine: "Elaine",
      maisa: "Maisa",
      kauan: "Kauan",
      sugestoes: "Sugestões",
    };

    const titulo = nomesBonitos[pessoa] || pessoa;

    container.innerHTML = `<h2>Louvores - ${titulo}</h2><p class="muted">Carregando...</p>`;
    container.scrollIntoView({ behavior: "smooth", block: "start" });

    unsubscribe = fb.listenLouvoresByPessoa(pessoa, (lista) => {
      let html = `<h2>Louvores - ${titulo}</h2>`;

      if (!lista.length) {
        html += `<p class="muted">Nenhum louvor adicionado ainda.</p>`;
      } else {
        lista.forEach((l, idx) => {
          html += `
            <div class="louvor-item">
              <strong>${idx + 1}. ${escapeHTML(l.nome || "")}</strong>
              <div class="icons">
                ${l.youtube ? `
                  <a href="${l.youtube}" target="_blank" rel="noopener" title="YouTube">
                    <img src="icon/icone youtube.png" class="icon-img" alt="YouTube">
                  </a>` : ""}

                ${l.letra ? `
                  <a href="${l.letra}" target="_blank" rel="noopener" title="Letra">
                    <img src="icon/icone letras.png" class="icon-img" alt="Letra">
                  </a>` : ""}

                ${l.cifra ? `
                  <a href="${l.cifra}" target="_blank" rel="noopener" title="Cifra">
                    <img src="icon/icone cifra club.png" class="icon-img" alt="Cifra">
                  </a>` : ""}
              </div>
            </div>
          `;
        });
      }

      container.innerHTML = html;
    });
  };

  // 2) Só depois, abre automaticamente via hash (repertorio.html#joao)
  const hash = (window.location.hash || "").replace("#", "").trim();
  if (hash) {
    window.abrirLouvores(hash);
    history.replaceState(null, "", window.location.pathname);
  }
}

/* =========================
   6) NOVO LOUVOR (Firestore)
========================= */
function setupNovoLouvorFirestore(fb) {
  window.salvarLouvor = async function () {
    const pessoa = document.getElementById("pessoa")?.value || "";
    const nome = document.getElementById("nome")?.value?.trim() || "";
    const youtube = document.getElementById("youtube")?.value?.trim() || "";
    const letra = document.getElementById("letra")?.value?.trim() || "";
    const cifra = document.getElementById("cifra")?.value?.trim() || "";

    if (!pessoa || !nome) {
      alert("Selecione o ministro e digite o nome do louvor.");
      return;
    }

    await fb.addLouvorFirestore(pessoa, { nome, youtube, letra, cifra });
    window.location.href = `repertorio.html#${encodeURIComponent(pessoa)}`;
  };
}

/* =========================
   7) AGENDA (Firestore + modal)
========================= */
let agendaSelectedDayKey = null;

function setupAgendaFirestore(fb) {
  const dayCards = document.querySelectorAll(".day-card");
  if (!dayCards.length) return;

  dayCards.forEach(card => {
    const dayKey = card.getAttribute("data-day");
    const ul = card.querySelector(".day-list");
    const addBtn = card.querySelector(".day-add");
    if (!dayKey || !ul || !addBtn) return;

    fb.listenAgendaDay(dayKey, (items) => {
      renderAgendaListFirestore(ul, items, dayKey, fb);
    });

    addBtn.addEventListener("click", () => {
      agendaSelectedDayKey = dayKey;
      openAgendaModal();
    });
  });

  wireAgendaModalEventsFirestore(fb);
}

function renderAgendaListFirestore(ul, items, dayKey, fb) {
  if (!items || items.length === 0) {
    ul.innerHTML = `<li class="muted">Sem louvores ainda.</li>`;
    return;
  }

  ul.innerHTML = items.map((it, idx) => {
    const name = it?.name || it?.nome || "";

    // ===== ÍCONES DOURADOS =====
    const yt = it?.youtube ? `
      <a href="${it.youtube}" target="_blank" rel="noopener" title="YouTube">
        <img src="icon/icone youtube.png" class="mini-icon" alt="YT">
      </a>` : "";
      
    const lt = it?.letra ? `
      <a href="${it.letra}" target="_blank" rel="noopener" title="Letras">
        <img src="icon/icone letras.png" class="mini-icon" alt="LT">
      </a>` : "";
      
    const cf = it?.cifra ? `
      <a href="${it.cifra}" target="_blank" rel="noopener" title="Cifra">
        <img src="icon/icone cifra club.png" class="mini-icon" alt="CF">
      </a>` : "";

    return `
      <li class="louvor-item-lista">
        <div class="nome-louvor">
          <span>${escapeHTML(name)}</span>
        </div>

        <div class="day-links">
          ${yt}${lt}${cf}

          <button 
            class="day-remove" 
            type="button"
            data-id="${it?.id || ""}"
            data-idx="${idx}">
            Remover
          </button>
        </div>
      </li>
    `;
  }).join("");

  // ===== REMOVER =====
  ul.querySelectorAll(".day-remove").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const idx = Number(btn.getAttribute("data-idx"));

      // remove por id OU índice (itens antigos)
      await fb.removeAgendaItemFirestore(
        dayKey,
        id || null,
        Number.isFinite(idx) ? idx : null
      );
    });
  });
}

function wireAgendaModalEventsFirestore(fb) {
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  const closeBtn = document.getElementById("modalClose");
  const cancelBtn = document.getElementById("modalCancel");
  const saveBtn = document.getElementById("modalSave");

  closeBtn?.addEventListener("click", closeAgendaModal);
  cancelBtn?.addEventListener("click", closeAgendaModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAgendaModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeAgendaModal();
  });

  saveBtn?.addEventListener("click", async () => {
    const item = getAgendaModalValues();
    if (!item) return;
    if (!agendaSelectedDayKey) return;

    await fb.addAgendaItemFirestore(agendaSelectedDayKey, item);
    closeAgendaModal();
  });
}

function openAgendaModal() {
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  document.getElementById("mNome").value = "";
  document.getElementById("mYoutube").value = "";
  document.getElementById("mLetra").value = "";
  document.getElementById("mCifra").value = "";

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  setTimeout(() => document.getElementById("mNome")?.focus(), 50);
}

function closeAgendaModal() {
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  agendaSelectedDayKey = null;
}

function getAgendaModalValues() {
  const name = (document.getElementById("mNome")?.value || "").trim();
  const youtube = (document.getElementById("mYoutube")?.value || "").trim();
  const letra = (document.getElementById("mLetra")?.value || "").trim();
  const cifra = (document.getElementById("mCifra")?.value || "").trim();

  if (!name) {
    alert("Informe o nome do louvor.");
    document.getElementById("mNome")?.focus();
    return null;
  }

  return { id: crypto.randomUUID(), name, youtube, letra, cifra };
}

/* =========================
   UTIL
========================= */
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}