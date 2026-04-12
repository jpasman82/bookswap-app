import { auth } from "./config";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error en login:", error);
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};