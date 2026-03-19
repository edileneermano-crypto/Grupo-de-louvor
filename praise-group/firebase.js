/* =========================================================
   FIREBASE - PRAISE GROUP
   Configuração + autenticação + Firestore
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* =========================================================
   1) CONFIGURAÇÃO FIREBASE
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyAv4C-UkpSSuHFatzAJlRDa00D0zfSGzKA",
  authDomain: "praise-group-3427e.firebaseapp.com",
  projectId: "praise-group-3427e",
  storageBucket: "praise-group-3427e.firebasestorage.app",
  messagingSenderId: "313122425254",
  appId: "1:313122425254:web:fa790ac21cd4b8c4f6a767"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const GROUP_ID = "JUSTIFICADOS";


/* =========================================================
   2) AUTENTICAÇÃO ANÔNIMA
========================================================= */
const auth = getAuth(app);

signInAnonymously(auth).catch((error) => {
  console.error("Erro na autenticação anônima:", error);
});


/* =========================================================
   3) UTILITÁRIOS
========================================================= */
function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function limparTexto(texto) {
  return String(texto || "").trim();
}


/* =========================================================
   4) LOUVORES
========================================================= */

/* ---------- Listar em tempo real por pessoa ---------- */
export function listenLouvoresByPessoa(pessoaKey, onUpdate) {
  const colRef = collection(db, "groups", GROUP_ID, "louvores");
  const q = query(colRef, where("pessoa", "==", pessoaKey));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    onUpdate(items);
  });
}


/* ---------- Verificar duplicidade ---------- */
export async function louvorJaExisteFirestore(pessoaKey, nomeLouvor) {
  const colRef = collection(db, "groups", GROUP_ID, "louvores");
  const q = query(colRef, where("pessoa", "==", pessoaKey));
  const snap = await getDocs(q);

  const nomeNormalizado = normalizarTexto(nomeLouvor);

  return snap.docs.some((docItem) => {
    const data = docItem.data();
    const nomeExistente = data.nomeNormalizado || data.nome || "";
    return normalizarTexto(nomeExistente) === nomeNormalizado;
  });
}


/* ---------- Adicionar louvor ---------- */
export async function addLouvorFirestore(pessoaKey, data) {
  const colRef = collection(db, "groups", GROUP_ID, "louvores");

  const nome = limparTexto(data.nome);
  const youtube = limparTexto(data.youtube);
  const letra = limparTexto(data.letra);
  const cifra = limparTexto(data.cifra);

  if (!nome) {
    throw new Error("NOME_OBRIGATORIO");
  }

  const jaExiste = await louvorJaExisteFirestore(pessoaKey, nome);

  if (jaExiste) {
    throw new Error("LOUVOR_DUPLICADO");
  }

  await addDoc(colRef, {
    pessoa: pessoaKey,
    nome,
    nomeNormalizado: normalizarTexto(nome),
    youtube,
    letra,
    cifra,
    createdAt: serverTimestamp()
  });
}


/* =========================================================
   5) AGENDA
========================================================= */

/* ---------- Ouvir itens em tempo real ---------- */
export function listenAgendaDay(dayKey, onUpdate) {
  const docRef = doc(db, "groups", GROUP_ID, "agenda", dayKey);

  return onSnapshot(docRef, (snap) => {
    const data = snap.exists() ? snap.data() : { items: [] };
    onUpdate(data.items || []);
  });
}


/* ---------- Adicionar item ---------- */
export async function addAgendaItemFirestore(dayKey, item) {
  const docRef = doc(db, "groups", GROUP_ID, "agenda", dayKey);
  const snap = await getDoc(docRef);

  const items = snap.exists() ? snap.data().items || [] : [];

  const newItem = {
    id: crypto.randomUUID(),
    name: limparTexto(item.name),
    youtube: limparTexto(item.youtube),
    letra: limparTexto(item.letra),
    cifra: limparTexto(item.cifra),
    createdAt: Date.now()
  };

  await setDoc(docRef, { items: [...items, newItem] }, { merge: true });
}


/* ---------- Remover item ---------- */
export async function removeAgendaItemFirestore(dayKey, itemId, indexFallback = null) {
  const docRef = doc(db, "groups", GROUP_ID, "agenda", dayKey);
  const snap = await getDoc(docRef);

  const items = snap.exists() ? snap.data().items || [] : [];

  let nextItems = items;

  if (itemId) {
    nextItems = items.filter((item) => item?.id !== itemId);
  } else if (typeof indexFallback === "number") {
    nextItems = [...items];
    nextItems.splice(indexFallback, 1);
  }

  await setDoc(docRef, { items: nextItems }, { merge: true });
}