import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Users, CheckCircle, ShieldAlert, BookOpen, Bookmark } from 'lucide-react';

const Dashboard = ({ user, dbUser }) => {
  const [stats, setStats] = useState({ donated: 0 });
  const [reservedBooks, setReservedBooks] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // 1. Cargar datos personales (Libros donados y reservados)
  const fetchPersonalData = async () => {
    if (!user) return;
    try {
      const donatedQuery = query(collection(db, "books"), where("donatedBy", "==", user.uid));
      const donatedSnapshot = await getDocs(donatedQuery);
      setStats({ donated: donatedSnapshot.size });

      const reservedQuery = query(collection(db, "books"), where("reservedBy", "==", user.uid));
      const reservedSnapshot = await getDocs(reservedQuery);
      setReservedBooks(reservedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error al buscar datos personales:", error);
    }
  };

  useEffect(() => {
    fetchPersonalData();
  }, [user]);

  // 2. Cargar usuarios pendientes (SOLO si es admin)
  useEffect(() => {
    if (dbUser?.role !== 'admin') return;
    const q = query(collection(db, "users"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      setPendingUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [dbUser]);

  // 3. Acciones
  const handleReturn = async (bookId) => {
    if (!window.confirm("¿Seguro que quieres devolver este libro a la biblioteca?")) return;
    try {
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, { status: 'available', reservedBy: null, reservedByName: null });
      alert("¡Libro devuelto con éxito!");
      fetchPersonalData(); 
    } catch (error) {
      alert("Error al devolver.");
    }
  };

  const approveUser = async (uid) => {
    if (!window.confirm("¿Aprobar ingreso de este usuario a la comunidad?")) return;
    try {
      await updateDoc(doc(db, "users", uid), { status: 'approved' });
    } catch (error) {
      alert("Error al aprobar usuario.");
    }
  };

  return (
    <div className="pb-28 animate-in fade-in duration-500 space-y-8">
      
      {/* HEADER DE BIENVENIDA Y CRÉDITOS */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[35px] text-white shadow-xl shadow-blue-100 mt-2">
        <h1 className="text-3xl font-black tracking-tighter mb-1">
          Hola, {dbUser?.displayName ? dbUser.displayName.split(' ')[0] : 'Lector'} 👋
        </h1>
        <p className="text-blue-100 font-medium text-sm mb-6">Este es tu resumen de actividad.</p>
        
        <div className="flex gap-4">
          <div className="bg-white/10 p-4 rounded-2xl flex-1 border border-white/20">
            <BookOpen size={24} className="text-blue-200 mb-2" />
            <p className="text-2xl font-black">{dbUser?.credits || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Créditos</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl flex-1 border border-white/20">
            <Bookmark size={24} className="text-blue-200 mb-2" />
            <p className="text-2xl font-black">{stats.donated}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Donados</p>
          </div>
        </div>
      </div>

      {/* TUS LECTURAS (Libros Reservados) */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <BookOpen size={20} className="text-gray-900" />
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Tus Lecturas</h2>
        </div>
        
        {reservedBooks.length === 0 ? (
          <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">No tienes libros reservados.</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">¡Ve a la biblioteca a buscar uno!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reservedBooks.map(book => (
              <div key={book.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center">
                <div className="w-16 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
                  ) : (
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 px-1 text-center absolute">
                      {book.title}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5 line-clamp-2">{book.title}</h3>
                    <p className="text-gray-500 text-xs font-medium mb-3">{book.author}</p>
                  </div>
                  <button 
                    onClick={() => handleReturn(book.id)}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs active:scale-95 transition"
                  >
                    Devolver Libro
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL DE ADMINISTRADOR (Validar Usuarios) */}
      {dbUser?.role === 'admin' && (
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-orange-100 mt-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
          <div className="flex items-center gap-2 mb-6 text-gray-900">
            <ShieldAlert size={20} className="text-orange-500" />
            <h3 className="text-lg font-black tracking-tight">Validar Usuarios (Admin)</h3>
          </div>

          {pendingUsers.length === 0 ? (
            <p className="text-gray-400 text-sm font-medium text-center py-4 bg-gray-50 rounded-2xl">
              No hay nuevos usuarios por validar.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={u.photoUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full" alt="avatar" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-gray-900 truncate">{u.displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate font-medium">{u.email}</p>
                    </div>
                  </div>
                  <button onClick={() => approveUser(u.id)} className="bg-green-100 text-green-700 p-2.5 rounded-xl active:scale-90 transition shadow-sm">
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;