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
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ================= FIREBASE CONFIG ================= */

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

/* ================= AUTH ANÔNIMO ================= */

const auth = getAuth(app);
signInAnonymously(auth);

/* ================= GRUPO FIXO ================= */

export const GROUP_ID = "JUSTIFICADOS";

/* =========================================================
   LOUVORES (REALTIME)
========================================================= */

export function listenLouvoresByPessoa(pessoaKey, onUpdate) {
  const col = collection(db, "groups", GROUP_ID, "louvores");
  const q = query(
    col,
    where("pessoa", "==", pessoaKey),
   
  );

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    onUpdate(items);
  });
}

export async function addLouvorFirestore(pessoaKey, data) {
  const col = collection(db, "groups", GROUP_ID, "louvores");

  await addDoc(col, {
    pessoa: pessoaKey,
    nome: data.nome,
    youtube: data.youtube || "",
    letra: data.letra || "",
    cifra: data.cifra || "",
    createdAt: serverTimestamp()
  });
}

/* =========================================================
   AGENDA (REALTIME)
========================================================= */

// ===== AGENDA (REALTIME) =====

export function listenAgendaDay(dayKey, onUpdate) {
  const ref = doc(db, "groups", GROUP_ID, "agenda", dayKey);

  return onSnapshot(ref, (snap) => {
    const data = snap.exists() ? snap.data() : { items: [] };
    onUpdate(data.items || []);
  });
}

// ✅ Agora recebe o ITEM completo (name, youtube, letra, cifra)
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

// ✅ Remove por ID, mas tem fallback por índice (pra itens antigos sem id)
export async function removeAgendaItemFirestore(dayKey, itemId, indexFallback = null) {
  const ref = doc(db, "groups", GROUP_ID, "agenda", dayKey);
  const snap = await getDoc(ref);

  const items = snap.exists() ? (snap.data().items || []) : [];

  let next = items;

  if (itemId) {
    next = items.filter(it => it?.id !== itemId);
  } else if (typeof indexFallback === "number") {
    next = [...items];
    next.splice(indexFallback, 1);
  }

  await setDoc(ref, { items: next }, { merge: true });
}