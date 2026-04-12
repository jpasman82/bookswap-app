import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { Home, LibraryBig, PlusCircle, LogOut } from 'lucide-react'; // Nuevos iconos

import Dashboard from './views/Dashboard';
import DonateBook from './components/DonateBook';
import Library from './views/Library';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('library'); // Empezamos en la biblioteca por defecto

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión", error);
    }
  };

  const logout = () => signOut(auth);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white px-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <LibraryBig size={48} className="text-blue-600" />
        </div>
        <h1 className="text-4xl font-black mb-2 text-gray-900">BookSwap</h1>
        <p className="text-gray-500 mb-10">Intercambia libros con tu comunidad.</p>
        <button 
          onClick={loginWithGoogle}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-transform"
        >
          Ingresar con Google
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-black font-sans pb-20">
      {/* Header Móvil Superior (Solo para el logo y perfil) */}
      <header className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <span className="font-black text-2xl text-blue-600 tracking-tight">BookSwap</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">{user.displayName.split(' ')[0]}</span>
          <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-blue-100" alt="profile" />
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="p-4 max-w-md mx-auto">
        {view === 'dashboard' && <Dashboard user={user} />}
        {view === 'donate' && <DonateBook user={user} onBookAdded={() => setView('library')} />}
        {view === 'library' && <Library user={user} />}
      </main>

      {/* Barra de Navegación Inferior (Móvil) */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button onClick={() => setView('library')} className={`flex flex-col items-center justify-center w-full h-full ${view === 'library' ? 'text-blue-600' : 'text-gray-400'}`}>
            <LibraryBig size={24} strokeWidth={view === 'library' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-bold">Biblioteca</span>
          </button>
          
          {/* Botón Central Destacado para Donar */}
          <button onClick={() => setView('donate')} className="relative -top-5 flex flex-col items-center justify-center">
            <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-transform">
              <PlusCircle size={28} strokeWidth={2.5} />
            </div>
          </button>
          
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center justify-center w-full h-full ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
            <Home size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-bold">Mi Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;