/* =========================================================
   FIREBASE CONFIG - PRAISE GROUP
   Conecta site ao Firestore em tempo real
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
   FIREBASE CONFIG
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


/* =========================================================
   AUTENTICAÇÃO ANÔNIMA
========================================================= */

const auth = getAuth(app);
signInAnonymously(auth);


/* =========================================================
   GRUPO FIXO
========================================================= */

export const GROUP_ID = "JUSTIFICADOS";


/* =========================================================
   NORMALIZAÇÃO DE TEXTO
   Padroniza texto para comparação e evita duplicidade
========================================================= */

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


/* =========================================================
   LOUVORES - LISTAR EM TEMPO REAL POR PESSOA
========================================================= */

export function listenLouvoresByPessoa(pessoaKey, onUpdate) {
  const col = collection(db, "groups", GROUP_ID, "louvores");
  const q = query(
    col,
    where("pessoa", "==", pessoaKey)
  );

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    onUpdate(items);
  });
}


/* =========================================================
   LOUVORES - VERIFICAR DUPLICIDADE
   Impede repetir o mesmo louvor na mesma pasta
========================================================= */

export async function louvorJaExisteFirestore(pessoaKey, nomeLouvor) {
  const col = collection(db, "groups", GROUP_ID, "louvores");
  const q = query(col, where("pessoa", "==", pessoaKey));
  const snap = await getDocs(q);

  const nomeNormalizado = normalizarTexto(nomeLouvor);

  return snap.docs.some((d) => {
    const data = d.data();
    const nomeExistente = data.nomeNormalizado || data.nome || "";
    return normalizarTexto(nomeExistente) === nomeNormalizado;
  });
}


/* =========================================================
   LOUVORES - ADICIONAR NO FIRESTORE
   Valida nome obrigatório e bloqueia duplicados
========================================================= */

export async function addLouvorFirestore(pessoaKey, data) {
  const col = collection(db, "groups", GROUP_ID, "louvores");

  const nomeLimpo = String(data.nome || "").trim();

  if (!nomeLimpo) {
    throw new Error("NOME_OBRIGATORIO");
  }

  const jaExiste = await louvorJaExisteFirestore(pessoaKey, nomeLimpo);

  if (jaExiste) {
    throw new Error("LOUVOR_DUPLICADO");
  }

  await addDoc(col, {
    pessoa: pessoaKey,
    nome: nomeLimpo,
    nomeNormalizado: normalizarTexto(nomeLimpo),
    youtube: String(data.youtube || "").trim(),
    letra: String(data.letra || "").trim(),
    cifra: String(data.cifra || "").trim(),
    createdAt: serverTimestamp()
  });
}


/* =========================================================
   AGENDA - OUVIR ITENS EM TEMPO REAL
========================================================= */

export function listenAgendaDay(dayKey, onUpdate) {
  const ref = doc(db, "groups", GROUP_ID, "agenda", dayKey);

  return onSnapshot(ref, (snap) => {
    const data = snap.exists() ? snap.data() : { items: [] };
    onUpdate(data.items || []);
  });
}


/* =========================================================
   AGENDA - ADICIONAR ITEM
   Salva item completo com links e identificador único
========================================================= */

export async function addAgendaItemFirestore(dayKey, item) {
  const ref = doc(db, "groups", GROUP_ID, "agenda", dayKey);
  const snap = await getDoc(ref);

  const items = snap.exists() ? (snap.data().items || []) : [];

  const newItem = {
    id: crypto.randomUUID(),
    name: item.name || "",
    youtube: item.youtube || "",
    letra: item.letra || "",
    cifra: item.cifra || "",
    createdAt: Date.now()
  };

  await setDoc(ref, { items: [...items, newItem] }, { merge: true });
}


/* =========================================================
   AGENDA - REMOVER ITEM
   Remove por ID e usa índice como fallback
========================================================= */

export async function removeAgendaItemFirestore(dayKey, itemId, indexFallback = null) {
  const ref = doc(db, "groups", GROUP_ID, "agenda", dayKey);
  const snap = await getDoc(ref);

  const items = snap.exists() ? (snap.data().items || []) : [];

  let next = items;

  if (itemId) {
    next = items.filter((it) => it?.id !== itemId);
  } else if (typeof indexFallback === "number") {
    next = [...items];
    next.splice(indexFallback, 1);
  }

  await setDoc(ref, { items: next }, { merge: true });
}