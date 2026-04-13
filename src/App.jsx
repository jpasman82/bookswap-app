import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Home, LibraryBig, PlusCircle, ShieldAlert, Loader2, LogOut } from 'lucide-react';

import Dashboard from './views/Dashboard';
import DonateBook from './components/DonateBook';
import Library from './views/Library';
import Profile from './views/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [error, setError] = useState('');

  const ADMIN_EMAIL = 'celularjpp@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setError('');
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          const isAdmin = currentUser.email === ADMIN_EMAIL;
          const newUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Nuevo Lector',
            photoUrl: currentUser.photoURL || '',
            status: isAdmin ? 'approved' : 'new',
            role: isAdmin ? 'admin' : 'user',
            credits: isAdmin ? 1 : 0,
            createdAt: new Date()
          };
          try {
            await setDoc(userRef, newUser);
          } catch (err) {
            setError("Error al crear usuario.");
          }
        }

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
      <Loader2 className="animate-spin text-purple-900 mb-4" size={48} />
      <p className="text-gray-400 font-bold animate-pulse">Cargando BookSwap...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-900 p-4 rounded-3xl shadow-lg shadow-purple-200">
              <LibraryBig size={32} className="text-yellow-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-center mb-1 tracking-tighter text-gray-900">BookSwap</h1>
          <p className="text-center text-gray-400 mb-8 font-medium font-bold uppercase text-[10px] tracking-widest">Exclusivo San Isidro</p>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 p-2 rounded-lg mb-6">{error}</p>}

          <button 
            onClick={loginWithGoogle} 
            className="w-full bg-purple-50 text-purple-900 py-4 rounded-2xl font-black shadow-sm flex items-center justify-center gap-3 hover:bg-purple-100 transition-all active:scale-95 border border-purple-100"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
            ENTRAR CON GOOGLE
          </button>
        </div>
      </div>
    );
  }

  if (dbUser?.status === 'new') {
    return <Profile user={user} dbUser={dbUser} />;
  }

  if (dbUser?.status === 'pending') {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-yellow-100 p-6 rounded-full mb-6"><ShieldAlert size={48} className="text-yellow-600" /></div>
        <h2 className="text-2xl font-black mb-4 tracking-tighter">Perfil en Revisión</h2>
        <p className="text-gray-500 font-medium leading-relaxed max-w-xs">
          Tu cuenta fue creada. Un administrador debe validarla para que puedas ver los libros.
        </p>
        <button onClick={() => signOut(auth)} className="mt-10 text-purple-900 font-bold hover:text-purple-950 transition-all underline">Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <header className="bg-white p-5 flex justify-between items-center sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <span className="font-black text-2xl text-purple-900 tracking-tighter">BookSwap</span>
        <div className="flex items-center gap-3">
          <div onClick={() => setView('profile')} className="flex items-center gap-2 bg-gray-50 p-1 pr-3 rounded-full cursor-pointer hover:bg-gray-100 transition-all">
            <img src={dbUser?.photoUrl || `https://ui-avatars.com/api/?background=random&name=${dbUser?.displayName}`} className="w-8 h-8 rounded-full border border-purple-200 object-cover" alt="" />
            <span className="text-xs font-black text-purple-950">{dbUser?.displayName?.split(' ')[0]}</span>
          </div>
          <button 
            onClick={() => signOut(auth)} 
            className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {view === 'library' && <Library user={user} dbUser={dbUser} />}
        {view === 'donate' && <DonateBook user={user} onBookAdded={() => setView('library')} />}
        {view === 'dashboard' && <Dashboard user={user} dbUser={dbUser} />}
        {view === 'profile' && <Profile user={user} dbUser={dbUser} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 h-16 flex justify-around items-center z-40 px-4 pb-safe">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center ${view === 'dashboard' ? 'text-purple-900' : 'text-gray-400'}`}>
          <Home size={22} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
          <span className="text-[9px] font-black mt-1 uppercase">Inicio</span>
        </button>
        <button onClick={() => setView('donate')} className="relative -top-5">
          <div className="bg-yellow-500 p-4 rounded-full text-purple-950 shadow-xl shadow-yellow-200/50 active:scale-90 transition-transform">
            <PlusCircle size={28} />
          </div>
        </button>
        <button onClick={() => setView('library')} className={`flex flex-col items-center ${view === 'library' ? 'text-purple-900' : 'text-gray-400'}`}>
          <LibraryBig size={22} strokeWidth={view === 'library' ? 2.5 : 2} />
          <span className="text-[9px] font-black mt-1 uppercase">Librería</span>
        </button>
      </nav>
    </div>
  );
}

export default App;