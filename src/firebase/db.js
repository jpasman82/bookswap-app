import { db } from "./config";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  arrayUnion,
  setDoc
} from "firebase/firestore";

export const donateBook = async (bookData) => {
  try {
    const docRef = await addDoc(collection(db, "books"), {
      ...bookData,
      status: "available",
      createdAt: new Date()
    });
    return docRef.id;
  } catch (e) {
    throw e;
  }
};

export const joinWaitingList = async (bookId, userId) => {
  const listRef = doc(db, "waitingLists", bookId);
  await setDoc(listRef, {
    queue: arrayUnion({
      userId,
      requestedAt: new Date()
    })
  }, { merge: true });
};

export const getAvailableBooks = async () => {
  const q = query(collection(db, "books"), where("status", "==", "available"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};