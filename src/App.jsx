import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Home, LibraryBig, PlusCircle, User, ShieldAlert, Loader2, Mail, Lock } from 'lucide-react';

import Dashboard from './views/Dashboard';
import DonateBook from './components/DonateBook';
import Library from './views/Library';
import Profile from './views/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('library');

  // Estados para el login manual
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ADMIN_EMAIL = 'celularjpp@gmail.com'; // <--- CAMBIA ESTO POR TU MAIL REAL

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setError('');
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        
        // Verificamos si existe en la DB
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          const isAdmin = currentUser.email === ADMIN_EMAIL;
          const newUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || email.split('@')[0],
            photoUrl: currentUser.photoURL || '',
            status: isAdmin ? 'approved' : 'pending',
            role: isAdmin ? 'admin' : 'user',
            credits: isAdmin ? 10 : 0,
            createdAt: new Date()
          };
          try {
            await setDoc(userRef, newUser);
            setDbUser(newUser);
          } catch (err) {
            console.error("Error al crear usuario en DB:", err);
            setError("Error de base de datos. Revisa las reglas de Firestore.");
          }
        }

        // Suscribirse a cambios (por si el admin aprueba al usuario)
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setDbUser(docSnap.data());
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setDbUser(null);
        setLoading(false);
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Fallo en la autenticación: " + err.message);
    }
  };

  const loginWithGoogle = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Error al conectar con Google.");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-gray-400 font-bold animate-pulse">Cargando BookSwap...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-100">
              <LibraryBig size={32} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-center mb-1 tracking-tighter text-gray-900">BookSwap</h1>
          <p className="text-center text-gray-400 mb-8 font-medium">
            {isRegistering ? 'Crea una cuenta nueva' : 'Ingresa a la comunidad'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-400" size={18} />
              <input 
                type="email" placeholder="Email" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                value={email} onChange={e => setEmail(e.target.value)} required 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
              <input 
                type="password" placeholder="Contraseña" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                value={password} onChange={e => setPassword(e.target.value)} required 
              />
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black active:scale-95 transition-all">
              {isRegistering ? 'CREAR CUENTA' : 'ENTRAR'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="px-4 text-[10px] font-black text-gray-300">O</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <button onClick={loginWithGoogle} className="w-full bg-blue-50 text-blue-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-100 transition-all active:scale-95">
            Continuar con Google
          </button>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} 
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
              className="text-blue-600 font-black ml-2 underline decoration-2 underline-offset-4"
            >
              {isRegistering ? 'Inicia sesión' : 'Regístrate acá'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (dbUser?.status === 'pending') {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-orange-100 p-6 rounded-full mb-6"><ShieldAlert size={48} className="text-orange-600" /></div>
        <h2 className="text-2xl font-black mb-4 tracking-tighter">Perfil en Revisión</h2>
        <p className="text-gray-500 font-medium leading-relaxed max-w-xs">
          ¡Hola! Tu cuenta fue creada, pero un administrador debe validarla para que puedas ver los libros.
        </p>
        <button onClick={() => signOut(auth)} className="mt-10 text-gray-400 font-bold hover:text-gray-900 transition-all underline">Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white p-5 flex justify-between items-center sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <span className="font-black text-2xl text-blue-600 tracking-tighter">BookSwap</span>
        <div onClick={() => setView('profile')} className="flex items-center gap-2 bg-gray-50 p-1 pr-3 rounded-full cursor-pointer hover:bg-gray-100 transition-all">
          <img src={dbUser?.photoUrl || `https://ui-avatars.com/api/?background=random&name=${dbUser?.displayName}`} className="w-8 h-8 rounded-full border border-blue-100 object-cover" alt="" />
          <span className="text-xs font-black">{dbUser?.displayName?.split(' ')[0]}</span>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {view === 'library' && <Library user={user} dbUser={dbUser} />}
        {view === 'donate' && <DonateBook user={user} onBookAdded={() => setView('library')} />}
        {view === 'dashboard' && <Dashboard user={user} dbUser={dbUser} />}
        {view === 'profile' && <Profile user={user} dbUser={dbUser} onLogout={() => signOut(auth)} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 h-16 flex justify-around items-center z-40 px-4 pb-safe">
        <button onClick={() => setView('library')} className={`flex flex-col items-center ${view === 'library' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LibraryBig size={22} strokeWidth={view === 'library' ? 2.5 : 2} />
          <span className="text-[9px] font-black mt-1 uppercase">Librería</span>
        </button>
        <button onClick={() => setView('donate')} className="relative -top-5">
          <div className="bg-blue-600 p-4 rounded-full text-white shadow-xl shadow-blue-200 active:scale-90 transition-transform">
            <PlusCircle size={28} />
          </div>
        </button>
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Home size={22} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
          <span className="text-[9px] font-black mt-1 uppercase">Inicio</span>
        </button>
      </nav>
    </div>
  );
}

export default App;