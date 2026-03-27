import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseConfigured } from "../firebase/config";

function ensureConfigured() {
  if (!firebaseConfigured || !db) {
    throw new Error(
      "Firebase is not configured. Add the required REACT_APP_FIREBASE_* environment variables."
    );
  }
}

function subscribe(collectionName, sortField, setter, errorSetter) {
  if (!firebaseConfigured || !db) {
    setter([]);
    return () => {};
  }

  const collectionQuery = query(collection(db, collectionName), orderBy(sortField, "desc"));

  return onSnapshot(
    collectionQuery,
    (snapshot) => {
      setter(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    (error) => {
      errorSetter?.({
        type: "error",
        text: error.message || `Unable to load ${collectionName}.`,
      });
    }
  );
}

export { firebaseConfigured };

export function subscribeToBooks(setter, errorSetter) {
  return subscribe("books", "createdAt", setter, errorSetter);
}

export function subscribeToMembers(setter, errorSetter) {
  return subscribe("members", "createdAt", setter, errorSetter);
}

export function subscribeToTransactions(setter, errorSetter) {
  return subscribe("transactions", "borrowedAt", setter, errorSetter);
}

export async function createBook(book) {
  ensureConfigured();
  return addDoc(collection(db, "books"), {
    ...book,
    totalCopies: Number(book.totalCopies || 0),
    availableCopies: Number(book.totalCopies || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBook(bookId, book) {
  ensureConfigured();
  return updateDoc(doc(db, "books", bookId), {
    ...book,
    updatedAt: serverTimestamp(),
  });
}

export async function removeBook(bookId) {
  ensureConfigured();
  return deleteDoc(doc(db, "books", bookId));
}

export async function createMember(member) {
  ensureConfigured();
  return addDoc(collection(db, "members"), {
    ...member,
    createdAt: serverTimestamp(),
  });
}

export async function removeMember(memberId) {
  ensureConfigured();
  return deleteDoc(doc(db, "members", memberId));
}

export async function borrowBook(bookId, memberId, details) {
  ensureConfigured();

  const transactionRef = collection(db, "transactions");
  const bookRef = doc(db, "books", bookId);

  return runTransaction(db, async (transaction) => {
    const bookSnapshot = await transaction.get(bookRef);

    if (!bookSnapshot.exists()) {
      throw new Error("Book not found.");
    }

    const bookData = bookSnapshot.data();
    const availableCopies = Number(bookData.availableCopies || 0);

    if (availableCopies < 1) {
      throw new Error("No available copies left for this title.");
    }

    transaction.update(bookRef, {
      availableCopies: availableCopies - 1,
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(transactionRef), {
      bookId,
      memberId,
      bookTitle: details.bookTitle,
      memberName: details.memberName,
      status: "borrowed",
      borrowedAt: serverTimestamp(),
      returnedAt: null,
    });
  });
}

export async function returnBook(transactionId) {
  ensureConfigured();

  const transactionRef = doc(db, "transactions", transactionId);

  return runTransaction(db, async (transaction) => {
    const transactionSnapshot = await transaction.get(transactionRef);

    if (!transactionSnapshot.exists()) {
      throw new Error("Transaction not found.");
    }

    const transactionData = transactionSnapshot.data();

    if (transactionData.status === "returned") {
      return;
    }

    const bookRef = doc(db, "books", transactionData.bookId);
    const bookSnapshot = await transaction.get(bookRef);

    if (!bookSnapshot.exists()) {
      throw new Error("Book record not found.");
    }

    const bookData = bookSnapshot.data();

    transaction.update(bookRef, {
      availableCopies: Number(bookData.availableCopies || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    transaction.update(transactionRef, {
      status: "returned",
      returnedAt: serverTimestamp(),
    });
  });
}
