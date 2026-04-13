import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { Book, User, Image as ImageIcon, Headphones, Loader2, Search, CheckCircle } from 'lucide-react';

const DonateBook = ({ user, onBookAdded }) => {
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    coverUrl: '',
    spotifyLink: ''
  });

  // Buscar en la API de Google Books
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchTerm}&maxResults=5&key=${apiKey}`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (error) {
      alert("Error al buscar el libro. Revisa tu conexión o la clave de la API.");
    } finally {
      setIsSearching(false);
    }
  };

  // Seleccionar un libro de los resultados de la API
  const handleSelectBook = (book) => {
    const info = book.volumeInfo;
    setFormData({
      title: info.title || '',
      author: info.authors ? info.authors.join(', ') : '',
      // Reemplazamos http por https para evitar errores en navegadores
      coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      spotifyLink: formData.spotifyLink // Mantenemos el link de Spotify si ya lo había puesto
    });
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert("Por favor, ingresa el título del libro.");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "books"), {
        title: formData.title,
        author: formData.author,
        coverUrl: formData.coverUrl,
        spotifyLink: formData.spotifyLink,
        status: 'pending', // Entra como pendiente para que el admin lo apruebe
        donatedBy: user.uid,
        donatedByName: user.displayName || user.email.split('@')[0],
        createdAt: new Date()
      });
      onBookAdded();
    } catch (error) {
      alert("Error al guardar el libro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24">
      <div className="bg-purple-900 px-5 py-8 rounded-b-[40px] shadow-lg mb-8">
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Aportar Libro</h1>
        <p className="text-purple-200 font-medium text-sm">Suma una nueva lectura a la comunidad.</p>
      </div>

      <div className="px-5 space-y-6">
        
        {/* BUSCADOR API */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-purple-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-900 mb-3">Autocompletar con API</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por título o autor..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-900 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={isSearching || !searchTerm}
              className="bg-purple-100 text-purple-900 px-4 rounded-xl font-bold active:scale-95 transition flex items-center justify-center"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {/* Resultados de Búsqueda */}
          {searchResults.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
              {searchResults.map((book) => (
                <div 
                  key={book.id} 
                  onClick={() => handleSelectBook(book)}
                  className="flex gap-3 p-2 hover:bg-purple-50 rounded-xl cursor-pointer transition border border-transparent hover:border-purple-100 active:scale-95"
                >
                  <div className="w-10 h-14 bg-gray-200 rounded overflow-hidden shrink-0 flex items-center justify-center">
                    {book.volumeInfo.imageLinks?.smallThumbnail ? (
                      <img src={book.volumeInfo.imageLinks.smallThumbnail} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      <Book size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-900 truncate">{book.volumeInfo.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate">
                      {book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Autor desconocido'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FORMULARIO MANUAL / AUTOCOMPLETADO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Título del libro</label>
            <div className="relative">
              <Book className="absolute left-4 top-4 text-gray-400" size={18} />
              <input 
                required
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-purple-900 text-sm"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Autor</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-gray-400" size={18} />
              <input 
                required
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-purple-900 text-sm"
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Link Portada (Opcional)</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-4 text-gray-400" size={18} />
              <input 
                type="url"
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-purple-900 text-sm text-gray-500"
                value={formData.coverUrl}
                onChange={e => setFormData({...formData, coverUrl: e.target.value})}
              />
            </div>
          </div>

          {/* NUEVO CAMPO: LINK DE SPOTIFY */}
          <div className="pt-2">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">
               Link Podcast Spotify (Opcional)
            </label>
            <div className="relative">
              <Headphones className="absolute left-4 top-4 text-[#1DB954]" size={18} />
              <input 
                type="url"
                placeholder="https://open.spotify.com/episode/..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#1DB954] text-sm"
                value={formData.spotifyLink}
                onChange={e => setFormData({...formData, spotifyLink: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-yellow-500 text-purple-950 py-4 rounded-2xl font-black shadow-xl shadow-yellow-200/50 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            ENVIAR A REVISIÓN
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonateBook;