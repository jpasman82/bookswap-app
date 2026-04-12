import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, doc, runTransaction, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import BookCard from '../components/BookCard';
import BookDetailsModal from '../components/BookDetailsModal';
import EditBookModal from '../components/EditBookModal'; // Importamos el nuevo modal
import { Search, Coins } from 'lucide-react';

const Library = ({ user }) => {
  const [books, setBooks] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingBook, setEditingBook] = useState(null); // Estado para el libro que se está editando

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) setUserCredits(doc.data().credits || 0);
    });
    return () => unsubscribe();
  }, [user]);

  const fetchBooks = async () => {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    setBooks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleUpdateBook = async (updatedData) => {
    try {
      const bookRef = doc(db, "books", editingBook.id);
      await updateDoc(bookRef, updatedData);
      setEditingBook(null);
      alert("Información actualizada.");
      fetchBooks();
    } catch (e) {
      alert("Error al actualizar.");
    }
  };

  const handleAuthorize = async (book) => {
    if (!window.confirm(`¿Autorizar alta de "${book.title}"?`)) return;
    try {
      await runTransaction(db, async (transaction) => {
        const donorRef = doc(db, "users", book.donatedBy);
        const bookRef = doc(db, "books", book.id);
        const donorSnap = await transaction.get(donorRef);
        const currentCredits = donorSnap.exists() ? donorSnap.data().credits || 0 : 0;
        transaction.update(bookRef, { status: 'available' });
        transaction.set(donorRef, { credits: currentCredits + 1 }, { merge: true });
      });
      alert("Libro disponible y crédito otorgado.");
      fetchBooks();
    } catch (e) { alert("Error en la autorización."); }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("¿Eliminar definitivamente?")) return;
    try {
      await deleteDoc(doc(db, "books", bookId));
      fetchBooks();
    } catch (e) { alert("Error al eliminar."); }
  };

  const handleReserve = async (bookId) => {
    const userRef = doc(db, "users", user.uid);
    const bookRef = doc(db, "books", bookId);
    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const credits = userDoc.data()?.credits || 0;
        if (credits <= 0) throw "Sin créditos.";
        transaction.update(userRef, { credits: credits - 1 });
        transaction.update(bookRef, { status: 'reserved', reservedBy: user.uid, reservedByName: user.displayName });
      });
      alert("Reservado.");
      fetchBooks();
    } catch (e) { alert(e); }
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pb-28">
      {/* Header idéntico al anterior */}
      <div className="bg-white px-5 py-6 sticky top-0 z-20 shadow-sm border-b border-gray-50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Explorar</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Biblioteca</h1>
          </div>
          <div className="bg-yellow-400 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-yellow-100">
            <Coins size={16} className="text-yellow-800" />
            <span className="font-black text-yellow-900 text-sm">{userCredits}</span>
          </div>
        </div>
        <div className="relative">
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 outline-none focus:bg-white transition-all shadow-inner" />
          <Search size={20} className="absolute left-4 top-4 text-gray-300" />
        </div>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-6">
        {filteredBooks.map(book => (
          <BookCard 
            key={book.id} 
            book={book} 
            onReserve={() => handleReserve(book.id)}
            onOpenDetails={() => setSelectedBook(book)}
            onAuthorize={() => handleAuthorize(book)}
            onDelete={() => handleDelete(book.id)}
            onEdit={() => setEditingBook(book)} // Abrimos el modal de edición
            disabled={userCredits <= 0} 
          />
        ))}
      </div>

      <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onReserve={() => handleReserve(selectedBook.id)} disabled={userCredits <= 0} />
      
      {/* Nuevo Modal de Edición */}
      <EditBookModal 
        book={editingBook} 
        onClose={() => setEditingBook(null)} 
        onSave={handleUpdateBook} 
      />
    </div>
  );
};

export default Library;