import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, doc, runTransaction, onSnapshot, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import BookCard from '../components/BookCard';
import BookDetailsModal from '../components/BookDetailsModal';
import EditBookModal from '../components/EditBookModal'; 
import { Search, Coins, Headphones, Clock, TrendingUp } from 'lucide-react';

const Library = ({ user, dbUser }) => {
  const [books, setBooks] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [sedeUser, setSedeUser] = useState(null);

  const [podcastOnly, setPodcastOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const isAdmin = dbUser?.role === 'admin';
  const categories = ['Todas', 'Economía', 'Filosofía', 'Política', 'Historia', 'Ficción', 'Desarrollo Personal', 'Negocios'];

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserCredits(docSnap.data().credits || 0);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fetchSede = async () => {
      const q = query(collection(db, "users"), where("role", "==", "sede"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSedeUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    };
    fetchSede();
  }, []);

  const fetchBooks = async () => {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    setBooks(querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleUpdateBook = async (updatedData) => {
    try {
      const bookRef = doc(db, "books", editingBook.id);
      await updateDoc(bookRef, updatedData);
      setEditingBook(null);
      fetchBooks();
    } catch (e) {
      alert("Error al actualizar.");
    }
  };

  const handleAuthorize = async (book) => {
    try {
      await runTransaction(db, async (transaction) => {
        const donorRef = doc(db, "users", book.donatedBy);
        const bookRef = doc(db, "books", book.id);
        const donorSnap = await transaction.get(donorRef);
        
        const finalHeldBy = book.heldBy || book.donatedBy;
        const finalHeldByName = book.heldByName || book.donatedByName;

        transaction.update(bookRef, { 
          status: 'available',
          heldBy: finalHeldBy,
          heldByName: finalHeldByName,
          assignedAt: new Date()
        });
        if (donorSnap.exists()) {
          transaction.set(donorRef, { credits: 1 }, { merge: true });
        }
      });
      fetchBooks();
    } catch (e) { alert("Error en la autorización."); }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("¿Estás seguro de eliminar este libro?")) return;
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
        const bookDoc = await transaction.get(bookRef);
        const credits = userDoc.data()?.credits || 0;
        if (credits <= 0) throw "Sin créditos.";
        
        const bookData = bookDoc.data();
        const finalHeldBy = bookData.heldBy || bookData.donatedBy;
        const finalHeldByName = bookData.heldByName || bookData.donatedByName || "Usuario";

        transaction.update(userRef, { credits: 0 });
        transaction.update(bookRef, { 
          status: 'reserved', 
          reservedBy: user.uid, 
          reservedByName: userDoc.data()?.displayName || user.displayName,
          heldBy: finalHeldBy,
          heldByName: finalHeldByName,
          holderDelivered: false,
          reserverReceived: false
        });
      });
      fetchBooks();
      setSelectedBook(null);
    } catch (e) { alert(e); }
  };

  const handleWaitlist = async (bookId) => {
    try {
      await updateDoc(doc(db, "books", bookId), {
        waitlist: arrayUnion(user.uid)
      });
      fetchBooks();
      if(selectedBook) setSelectedBook({...selectedBook, waitlist: [...(selectedBook.waitlist || []), user.uid]});
    } catch (e) {
      alert("Error.");
    }
  };

  const handleRemoveWaitlist = async (bookId) => {
    try {
      await updateDoc(doc(db, "books", bookId), {
        waitlist: arrayRemove(user.uid)
      });
      fetchBooks();
      if(selectedBook) setSelectedBook({...selectedBook, waitlist: selectedBook.waitlist.filter(id => id !== user.uid)});
    } catch (e) {
      alert("Error.");
    }
  };

  let processedBooks = [...books];

  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    processedBooks = processedBooks.filter(b => 
      b.title?.toLowerCase().includes(lowerTerm) || 
      b.author?.toLowerCase().includes(lowerTerm)
    );
  }

  if (podcastOnly) {
    processedBooks = processedBooks.filter(b => b.spotifyLink && b.spotifyLink.trim() !== '');
  }

  if (selectedCategory !== 'Todas') {
    processedBooks = processedBooks.filter(b => b.category === selectedCategory);
  }

  processedBooks.sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    } else if (sortBy === 'popular') {
      const popA = a.history ? a.history.length : 0;
      const popB = b.history ? b.history.length : 0;
      return popB - popA;
    }
    return 0;
  });

  return (
    <div className="pb-28">
      <div className="bg-white px-5 pt-6 pb-2 sticky top-0 z-20 shadow-sm border-b border-gray-50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-900 mb-1">Explorar</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Biblioteca</h1>
          </div>
          <div className="bg-yellow-400 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-yellow-100">
            <Coins size={16} className="text-yellow-900" />
            <span className="font-black text-yellow-950 text-sm">{userCredits > 0 ? 1 : 0}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Buscar título o autor..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-purple-900 transition-all shadow-inner" 
            />
            <Search size={20} className="absolute left-4 top-4 text-gray-400" />
          </div>
          
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="bg-gray-100 text-purple-900 p-4 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-inner hover:bg-gray-200"
            >
              {sortBy === 'newest' ? <Clock size={20} /> : <TrendingUp size={20} />}
            </button>
            
            {showSortMenu && (
              <div className="absolute right-0 top-14 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                <button 
                  onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 ${sortBy === 'newest' ? 'bg-purple-50 text-purple-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Clock size={16} /> Más Recientes
                </button>
                <button 
                  onClick={() => { setSortBy('popular'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 border-t border-gray-50 ${sortBy === 'popular' ? 'bg-purple-50 text-purple-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <TrendingUp size={16} /> Más Leídos
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setPodcastOnly(!podcastOnly)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors border ${
              podcastOnly ? 'bg-purple-900 text-white border-purple-900 shadow-md shadow-purple-200' : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            <Headphones size={14} /> Podcast
          </button>
          
          <div className="w-px h-8 bg-gray-200 shrink-0 mx-1 self-center"></div>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs transition-colors border ${
                selectedCategory === cat ? 'bg-purple-100 text-purple-900 font-black border-purple-200' : 'bg-white text-gray-400 font-bold border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-6">
        {processedBooks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 font-bold">No se encontraron libros con estos filtros.</p>
          </div>
        ) : (
          processedBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              userId={user.uid}
              sedeUser={sedeUser}
              isAdmin={isAdmin} 
              onReserve={() => handleReserve(book.id)}
              onOpenDetails={() => setSelectedBook(book)}
              onAuthorize={() => handleAuthorize(book)}
              onDelete={() => handleDelete(book.id)}
              onEdit={() => setEditingBook(book)}
              onWaitlist={() => handleWaitlist(book.id)}
              onRemoveWaitlist={() => handleRemoveWaitlist(book.id)}
              disabled={userCredits <= 0} 
            />
          ))
        )}
      </div>

      <BookDetailsModal 
        book={selectedBook} 
        userId={user.uid}
        sedeUser={sedeUser}
        onClose={() => setSelectedBook(null)} 
        onReserve={() => handleReserve(selectedBook?.id)} 
        onWaitlist={() => handleWaitlist(selectedBook?.id)}
        onRemoveWaitlist={() => handleRemoveWaitlist(selectedBook?.id)}
        disabled={userCredits <= 0} 
      />
      
      <EditBookModal 
        book={editingBook} 
        onClose={() => setEditingBook(null)} 
        onSave={handleUpdateBook} 
      />
    </div>
  );
};

export default Library;