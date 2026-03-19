/* =========================================================
   PRAISE GROUP - SCRIPT PRINCIPAL
   Organizado, limpo e preparado para PWA + Firestore
========================================================= */

/* =========================================================
   1) EVENTOS INICIAIS
========================================================= */
window.addEventListener("load", initLoader);

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHamburger();
  registerServiceWorker();
  initFirestoreFeatures();
});


/* =========================================================
   2) LOADER
========================================================= */
function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  const closeLoader = () => {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 700);
  };

  setTimeout(closeLoader, 700);
  setTimeout(closeLoader, 4000);
}


/* =========================================================
   3) TEMA DARK/LIGHT
========================================================= */
function initTheme() {
  const toggle = document.getElementById("darkToggle");
  const temaSalvo = localStorage.getItem("tema") || "dark";

  document.body.classList.toggle("light", temaSalvo === "light");

  if (toggle) {
    toggle.checked = temaSalvo === "light";

    toggle.addEventListener("change", () => {
      const isLight = toggle.checked;
      document.body.classList.toggle("light", isLight);
      localStorage.setItem("tema", isLight ? "light" : "dark");
    });
  }
}


/* =========================================================
   4) MENU HAMBURGER
========================================================= */
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
    const isOpen = nav.classList.toggle("nav-open");
    btn.classList.toggle("is-open", isOpen);
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  btn.addEventListener("click", toggleMenu);

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

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


/* =========================================================
   5) REGISTRO DO SERVICE WORKER (PWA)
========================================================= */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
      console.log("Service Worker registrado com sucesso.");
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
    }
  });
}


/* =========================================================
   6) INICIALIZAÇÃO CONDICIONAL DO FIRESTORE
========================================================= */
async function initFirestoreFeatures() {
  const isRepertorio = !!document.getElementById("listaLouvores");
  const isNovoLouvor = !!document.getElementById("pessoa") && !!document.getElementById("nome");
  const isAgenda = !!document.querySelector(".day-card");

  if (!isRepertorio && !isNovoLouvor && !isAgenda) return;

  let fb;
  try {
    fb = await import("./firebase.js");
  } catch (error) {
    console.error("Erro ao carregar firebase.js:", error);
    alert("Firebase não carregou. Verifique o arquivo firebase.js e as regras do Firestore.");
    return;
  }

  if (isRepertorio) setupRepertorioFirestore(fb);
  if (isNovoLouvor) setupNovoLouvorFirestore(fb);
  if (isAgenda) setupAgendaFirestore(fb);
}


/* =========================================================
   7) REPERTÓRIO
========================================================= */
function setupRepertorioFirestore(fb) {
  const container = document.getElementById("listaLouvores");
  if (!container) return;

  let unsubscribe = null;
  let listaAtual = [];
  let tituloAtual = "";
  let termoBuscaAtual = "";

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
    mulheresjustificadas: "Mulheres Justificadas",
    sugestoes: "Sugestões",
  };

  function handleBuscaLouvor(e) {
    termoBuscaAtual = e.target.value || "";
    const termoNormalizado = normalizarTexto(termoBuscaAtual);

    const listaFiltrada = listaAtual.filter((louvor) =>
      normalizarTexto(louvor.nome || "").includes(termoNormalizado)
    );

    renderLouvores(listaFiltrada);
  }

  function renderLouvores(listaFiltrada) {
    let html = `
      <h2>Louvores - ${escapeHTML(tituloAtual)}</h2>

      <div class="repertorio-search">
        <input
          type="text"
          id="buscarLouvor"
          placeholder="Pesquisar louvor nesta pasta..."
          aria-label="Pesquisar louvor nesta pasta"
        />
      </div>
    `;

    if (!listaAtual.length) {
      html += `<p class="muted">Nenhum louvor adicionado ainda.</p>`;
      container.innerHTML = html;
      restoreSearchInput();
      return;
    }

    if (!listaFiltrada.length) {
      html += `<p class="muted">Nenhum louvor encontrado.</p>`;
      container.innerHTML = html;
      restoreSearchInput(true);
      return;
    }

    html += listaFiltrada
      .map((louvor, idx) => {
        const nome = escapeHTML(louvor.nome || "");

        return `
          <div class="louvor-item">
            <strong>${idx + 1}. ${nome}</strong>

            <div class="icons">
              ${louvor.youtube ? `
                <a href="${louvor.youtube}" target="_blank" rel="noopener" title="YouTube">
                  <img src="icon/icone youtube.png" class="icon-img" alt="YouTube">
                </a>
              ` : ""}

              ${louvor.letra ? `
                <a href="${louvor.letra}" target="_blank" rel="noopener" title="Letra">
                  <img src="icon/icone letras.png" class="icon-img" alt="Letra">
                </a>
              ` : ""}

              ${louvor.cifra ? `
                <a href="${louvor.cifra}" target="_blank" rel="noopener" title="Cifra Club">
                  <img src="icon/icone cifra club.png" class="icon-img" alt="Cifra Club">
                </a>
              ` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = html;
    restoreSearchInput();
  }

  function restoreSearchInput(forceFocus = false) {
    const inputBusca = document.getElementById("buscarLouvor");
    if (!inputBusca) return;

    inputBusca.value = termoBuscaAtual;
    inputBusca.addEventListener("input", handleBuscaLouvor);

    if (termoBuscaAtual || forceFocus) {
      inputBusca.focus();
      inputBusca.setSelectionRange(inputBusca.value.length, inputBusca.value.length);
    }
  }

  function abrirLouvores(pessoa) {
    if (typeof unsubscribe === "function") unsubscribe();

    tituloAtual = nomesBonitos[pessoa] || pessoa;
    termoBuscaAtual = "";

    container.innerHTML = `
      <h2>Louvores - ${escapeHTML(tituloAtual)}</h2>
      <p class="muted">Carregando...</p>
    `;

    container.scrollIntoView({ behavior: "smooth", block: "start" });

    unsubscribe = fb.listenLouvoresByPessoa(pessoa, (lista) => {
      listaAtual = Array.isArray(lista) ? lista : [];

      listaAtual.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" })
      );

      renderLouvores(listaAtual);
    });
  }

  window.abrirLouvores = abrirLouvores;

  const hash = (window.location.hash || "").replace("#", "").trim();
  if (hash) {
    abrirLouvores(hash);
    history.replaceState(null, "", window.location.pathname);
  }
}


/* =========================================================
   8) NOVO LOUVOR
========================================================= */
function setupNovoLouvorFirestore(fb) {
  async function salvarLouvor() {
    const pessoa = document.getElementById("pessoa")?.value || "";
    const nome = document.getElementById("nome")?.value?.trim() || "";
    const youtube = document.getElementById("youtube")?.value?.trim() || "";
    const letra = document.getElementById("letra")?.value?.trim() || "";
    const cifra = document.getElementById("cifra")?.value?.trim() || "";

    if (!pessoa || !nome) {
      alert("Selecione o ministro e digite o nome do louvor.");
      return;
    }

    try {
      await fb.addLouvorFirestore(pessoa, { nome, youtube, letra, cifra });
      window.location.href = `repertorio.html#${encodeURIComponent(pessoa)}`;
    } catch (error) {
      if (error.message === "LOUVOR_DUPLICADO") {
        alert("Esse louvor já existe nesta pasta.");
        return;
      }

      if (error.message === "NOME_OBRIGATORIO") {
        alert("Digite o nome do louvor.");
        return;
      }

      console.error("Erro ao salvar louvor:", error);
      alert("Erro ao salvar o louvor. Tente novamente.");
    }
  }

  window.salvarLouvor = salvarLouvor;
}


/* =========================================================
   9) AGENDA
========================================================= */
let agendaSelectedDayKey = null;

function setupAgendaFirestore(fb) {
  const dayCards = document.querySelectorAll(".day-card");
  if (!dayCards.length) return;

  dayCards.forEach((card) => {
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

  ul.innerHTML = items
    .map((item, idx) => {
      const name = escapeHTML(item?.name || item?.nome || "");

      return `
        <li class="louvor-item-lista">
          <div class="nome-louvor">
            <span>${name}</span>
          </div>

          <div class="day-links">
            ${item?.youtube ? `
              <a href="${item.youtube}" target="_blank" rel="noopener" title="YouTube">
                <img src="icon/icone youtube.png" class="mini-icon" alt="YouTube">
              </a>
            ` : ""}

            ${item?.letra ? `
              <a href="${item.letra}" target="_blank" rel="noopener" title="Letras">
                <img src="icon/icone letras.png" class="mini-icon" alt="Letras">
              </a>
            ` : ""}

            ${item?.cifra ? `
              <a href="${item.cifra}" target="_blank" rel="noopener" title="Cifra Club">
                <img src="icon/icone cifra club.png" class="mini-icon" alt="Cifra Club">
              </a>
            ` : ""}

            <button
              class="day-remove"
              type="button"
              data-id="${item?.id || ""}"
              data-idx="${idx}"
            >
              Remover
            </button>
          </div>
        </li>
      `;
    })
    .join("");

  ul.querySelectorAll(".day-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const idx = Number(btn.getAttribute("data-idx"));

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
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeAgendaModal();
    }
  });

  saveBtn?.addEventListener("click", async () => {
    const item = getAgendaModalValues();
    if (!item || !agendaSelectedDayKey) return;

    await fb.addAgendaItemFirestore(agendaSelectedDayKey, item);
    closeAgendaModal();
  });
}

function openAgendaModal() {
  const modal = document.getElementById("agendaModal");
  if (!modal) return;

  const nome = document.getElementById("mNome");
  const youtube = document.getElementById("mYoutube");
  const letra = document.getElementById("mLetra");
  const cifra = document.getElementById("mCifra");

  if (nome) nome.value = "";
  if (youtube) youtube.value = "";
  if (letra) letra.value = "";
  if (cifra) cifra.value = "";

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  setTimeout(() => nome?.focus(), 50);
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

  return {
    id: crypto.randomUUID(),
    name,
    youtube,
    letra,
    cifra,
  };
}


/* =========================================================
   10) UTILITÁRIOS
========================================================= */
function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}