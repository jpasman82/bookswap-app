import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({ donated: 0 });
  const [reservedBooks, setReservedBooks] = useState([]);

  const fetchData = async () => {
    if (!user) return;
    const donatedQuery = query(collection(db, "books"), where("donatedBy", "==", user.uid));
    const donatedSnapshot = await getDocs(donatedQuery);
    setStats({ donated: donatedSnapshot.size });

    const reservedQuery = query(collection(db, "books"), where("reservedBy", "==", user.uid));
    const reservedSnapshot = await getDocs(reservedQuery);
    const booksData = reservedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setReservedBooks(booksData);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleReturn = async (bookId) => {
    if (!window.confirm("¿Seguro que quieres devolver este libro a la biblioteca?")) return;
    try {
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, { status: 'available', reservedBy: null });
      alert("¡Libro devuelto con éxito!");
      fetchData(); 
    } catch (error) {
      console.error("Error al devolver:", error);
    }
  };

  return (
    <div className="text-black">
      <h1 className="text-2xl font-black mb-6">Hola, {user.displayName.split(' ')[0]} 👋</h1>
      
      {/* AQUÍ ESTÁ EL CAMBIO A FLEX-COL: Estadísticas */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-gray-400 uppercase text-[11px] font-bold tracking-widest">Libros Donados</h2>
            <p className="text-xs text-gray-500 mt-1">Aportados a la comunidad</p>
          </div>
          <p className="text-3xl font-black text-blue-600">{stats.donated}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-gray-400 uppercase text-[11px] font-bold tracking-widest">Reservas Activas</h2>
            <p className="text-xs text-gray-500 mt-1">Leyendo actualmente</p>
          </div>
          <p className="text-3xl font-black text-green-500">{reservedBooks.length}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 border-b border-gray-100 pb-2">Tus Lecturas</h2>
        
        {/* AQUÍ ESTÁ EL CAMBIO A FLEX-COL: Mis Libros */}
        {reservedBooks.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed p-8 rounded-2xl text-center">
            <p className="text-sm font-medium text-gray-500">No tienes libros reservados.</p>
            <p className="text-xs text-gray-400 mt-1">¡Ve a la biblioteca a buscar uno!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reservedBooks.map(book => (
              <div key={book.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                <div className="w-16 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50 overflow-hidden line-clamp-3 text-blue-700 px-1 text-center">
                    {book.title}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{book.title}</h3>
                  <p className="text-gray-500 text-xs mb-3">{book.author}</p>
                  <button 
                    onClick={() => handleReturn(book.id)}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs active:scale-95 transition"
                  >
                    Devolver Libro
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;