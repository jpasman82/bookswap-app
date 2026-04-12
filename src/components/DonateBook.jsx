import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Loader2, Plus } from 'lucide-react';

const DonateBook = ({ user, onBookAdded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDonate, setLoadingDonate] = useState(false);

  const searchBooks = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoadingSearch(true);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=5`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.items) {
        setResults(data.items.map(item => ({
          id: item.id,
          title: item.volumeInfo.title || 'Sin título',
          author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Autor desconocido',
          coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          description: item.volumeInfo.description || 'Sin descripción disponible.'
        })));
      } else {
        setResults([]);
        alert("No se encontraron resultados.");
      }
    } catch (error) {
      console.error(error);
      alert("Error en la búsqueda.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleDonate = async (book) => {
    setLoadingDonate(true);
    try {
      await addDoc(collection(db, "books"), {
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        description: book.description,
        donatedBy: user.uid,
        donatedByName: user.displayName || 'Usuario',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert("Libro enviado. Pendiente de autorización.");
      onBookAdded();
    } catch (error) {
      alert("Error al guardar.");
    } finally {
      setLoadingDonate(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white px-5 py-8 shadow-sm rounded-b-[40px] mb-6">
        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter text-center">Donar Libro</h2>
        <p className="text-sm text-gray-400 mb-8 text-center font-medium">Suma cultura a la comunidad</p>
        
        <form onSubmit={searchBooks} className="relative max-w-sm mx-auto">
          <input 
            type="text"
            placeholder="Título, autor o ISBN..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-6 pr-14 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 font-bold placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            required
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white w-11 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition">
            {loadingSearch ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </button>
        </form>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {results.map(book => (
          <div key={book.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-20 h-28 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-inner">
              {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" alt="" /> : <Plus size={24} className="text-gray-200" />}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">{book.author}</p>
              </div>
              <button onClick={() => handleDonate(book)} disabled={loadingDonate} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs active:scale-95 transition mt-3 shadow-md shadow-blue-50 uppercase tracking-widest">
                Confirmar Donación
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonateBook;