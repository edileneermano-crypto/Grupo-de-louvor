/* =========================================================
   PRAISE GROUP - SCRIPT (LIMPO E ORGANIZADO)
   - Loader (somente se existir na página)
   - Dark mode persistente
   - Repertório: abrir louvores por pessoa
   - Novo Louvor: salvar no localStorage e redirecionar
   - Agenda: salvar por dia/local (localStorage)
========================================================= */

/* =========================
   1) LOADER (fecha se existir)
========================= */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (!loader) return;

  setTimeout(() => {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 700);
  }, 900);
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

  // Se estiver no repertório e tiver hash (ex: #joao), abre automaticamente.
  initRepertorioHashOpen();

  // Se estiver na agenda, renderiza o que foi salvo
  initAgendaPage();
});

/* =========================
   MENU HAMBURGER (MOBILE)
========================= */
document.addEventListener("DOMContentLoaded", () => {
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

  // Fecha ao clicar em qualquer link
  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", closeMenu);
  });

  // Fecha com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Se sair do mobile, fecha o menu
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
});

/* =========================
   3) REPERTÓRIO
========================= */
function initRepertorioHashOpen() {
  const container = document.getElementById("listaLouvores");
  if (!container) return; // não está no repertório

  const hash = (window.location.hash || "").replace("#", "").trim();
  if (hash) {
    abrirLouvores(hash);
    // limpa hash para não ficar “grudado”
    history.replaceState(null, "", window.location.pathname);
  }
}

function abrirLouvores(pessoa) {
  const container = document.getElementById("listaLouvores");
  if (!container) return;

  const dados = JSON.parse(localStorage.getItem("louvores")) || {};
  const lista = dados[pessoa] || [];

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
  let html = `<h2>Louvores - ${titulo}</h2>`;

  if (lista.length === 0) {
    html += `<p class="muted">Nenhum louvor adicionado ainda.</p>`;
  } else {
    lista.forEach((l, idx) => {
      html += `
        <div class="louvor-item">
          <strong>${idx + 1}. ${escapeHTML(l.nome || "")}</strong>
          <div class="icons">
            ${l.youtube ? `<a href="${l.youtube}" target="_blank" title="YouTube">🎵</a>` : ""}
            ${l.letra ? `<a href="${l.letra}" target="_blank" title="Letra">📖</a>` : ""}
            ${l.cifra ? `<a href="${l.cifra}" target="_blank" title="Cifra">🎸</a>` : ""}
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;

   // ✅ Vai direto para a lista (rola suavemente)
  container.scrollIntoView({ behavior: "smooth", block: "start" });

  // guarda por conveniência (mas NÃO autoabre sempre)
  localStorage.setItem("ultimaPessoa", pessoa);

}


/* =========================
   4) NOVO LOUVOR
========================= */
function salvarLouvor() {
  const pessoa = document.getElementById("pessoa")?.value || "";
  const nome = document.getElementById("nome")?.value?.trim() || "";
  const youtube = document.getElementById("youtube")?.value?.trim() || "";
  const letra = document.getElementById("letra")?.value?.trim() || "";
  const cifra = document.getElementById("cifra")?.value?.trim() || "";

  if (!pessoa || !nome) {
    alert("Selecione o ministro e digite o nome do louvor.");
    return;
  }

  const novoLouvor = { nome, youtube, letra, cifra };

  const dados = JSON.parse(localStorage.getItem("louvores")) || {};
  if (!dados[pessoa]) dados[pessoa] = [];
  dados[pessoa].push(novoLouvor);

  localStorage.setItem("louvores", JSON.stringify(dados));

  // ✅ Redireciona e já abre a pessoa via HASH (ex: repertorio.html#joao)
  window.location.href = `repertorio.html#${encodeURIComponent(pessoa)}`;
}

// =====================================================
// AGENDA (com modal) - salvar por dia/localStorage
// =====================================================

let agendaSelectedDayKey = null;

function initAgendaPage() {
  const dayCards = document.querySelectorAll(".day-card");
  if (!dayCards.length) return; // não está na agenda

  // Renderiza o que já existe salvo
  renderAgendaAll();

  // Botões "+ Adicionar" -> abre modal
  dayCards.forEach(card => {
    const dayKey = card.getAttribute("data-day");
    const addBtn = card.querySelector(".day-add");
    if (!dayKey || !addBtn) return;

    addBtn.addEventListener("click", () => {
      agendaSelectedDayKey = dayKey;
      openAgendaModal();
    });
  });

  // Eventos do modal
  wireAgendaModalEvents();
}

function wireAgendaModalEvents(){
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  const closeBtn = document.getElementById("modalClose");
  const cancelBtn = document.getElementById("modalCancel");
  const saveBtn = document.getElementById("modalSave");

  // fecha
  closeBtn?.addEventListener("click", closeAgendaModal);
  cancelBtn?.addEventListener("click", closeAgendaModal);

  // clicar fora fecha
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAgendaModal();
  });

  // ESC fecha
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeAgendaModal();
    }
  });

  // salvar
  saveBtn?.addEventListener("click", () => {
    const item = getAgendaModalValues();
    if (!item) return;

    if (!agendaSelectedDayKey) return;

    addAgendaItem(agendaSelectedDayKey, item);
    renderAgendaDay(agendaSelectedDayKey);
    closeAgendaModal();
  });
}

function openAgendaModal(){
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  // limpa campos
  document.getElementById("mNome").value = "";
  document.getElementById("mYoutube").value = "";
  document.getElementById("mLetra").value = "";
  document.getElementById("mCifra").value = "";

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  // foca no nome
  setTimeout(() => document.getElementById("mNome")?.focus(), 50);
}

function closeAgendaModal(){
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  agendaSelectedDayKey = null;
}

function getAgendaModalValues(){
  const name = (document.getElementById("mNome").value || "").trim();
  const youtube = (document.getElementById("mYoutube").value || "").trim();
  const letra = (document.getElementById("mLetra").value || "").trim();
  const cifra = (document.getElementById("mCifra").value || "").trim();

  if (!name) {
    alert("Informe o nome do louvor.");
    document.getElementById("mNome")?.focus();
    return null;
  }

  return { name, youtube, letra, cifra };
}

// ===== storage agenda =====
function getAgendaStore() {
  return JSON.parse(localStorage.getItem("agenda")) || {};
}
function setAgendaStore(store) {
  localStorage.setItem("agenda", JSON.stringify(store));
}
function addAgendaItem(dayKey, item) {
  const store = getAgendaStore();
  if (!store[dayKey]) store[dayKey] = [];
  store[dayKey].push(item);
  setAgendaStore(store);
}
function removeAgendaItem(dayKey, index) {
  const store = getAgendaStore();
  if (!store[dayKey]) return;
  store[dayKey].splice(index, 1);
  setAgendaStore(store);
}

function renderAgendaAll() {
  document.querySelectorAll(".day-card").forEach(card => {
    const key = card.getAttribute("data-day");
    if (key) renderAgendaDay(key);
  });
}

function renderAgendaDay(dayKey) {
  const card = document.querySelector(`.day-card[data-day="${dayKey}"]`);
  if (!card) return;

  const ul = card.querySelector(".day-list");
  if (!ul) return;

  const store = getAgendaStore();
  const items = store[dayKey] || [];

  if (items.length === 0) {
    ul.innerHTML = `<li class="muted">Sem louvores ainda.</li>`;
    return;
  }

  ul.innerHTML = items.map((it, idx) => {
    const yt = it.youtube ? `<a href="${it.youtube}" target="_blank" title="YouTube">🎵</a>` : "";
    const lt = it.letra ? `<a href="${it.letra}" target="_blank" title="Letras">📖</a>` : "";
    const cf = it.cifra ? `<a href="${it.cifra}" target="_blank" title="Cifra">🎸</a>` : "";

    return `
      <li>
        <span>🎵 ${escapeHTML(it.name)}</span>
        <span class="day-links">${yt}${lt}${cf}</span>
        <button class="day-remove" type="button" data-idx="${idx}">Remover</button>
      </li>
    `;
  }).join("");

  ul.querySelectorAll(".day-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-idx"));
      removeAgendaItem(dayKey, i);
      renderAgendaDay(dayKey);
    });
  });
}

/* =========================
   6) UTIL
========================= */
function escapeHTML(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

