import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Book, User, Image as ImageIcon, Headphones, Loader2, Search, CheckCircle, MapPin } from 'lucide-react';

const DonateBook = ({ user, onBookAdded }) => {
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sedeUser, setSedeUser] = useState(null); 
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    coverUrl: '',
    spotifyLink: '',
    deliverToSede: false 
  });

  useEffect(() => {
    const fetchSede = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "sede"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setSedeUser({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error buscando sede:", error);
      }
    };
    fetchSede();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    
    setIsSearching(true);
    setSearchResults([]); // Limpiar busquedas anteriores
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
      // USAMOS encodeURIComponent PARA SANITIZAR LA BÚSQUEDA
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}&maxResults=5&key=${apiKey}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Error en la respuesta de la API");
      
      const data = await res.json();
      // VALIDAMOS QUE items EXISTA Y FILTRAMOS RESULTADOS CORRUPTOS
      const validItems = (data.items || []).filter(item => item && item.volumeInfo && item.volumeInfo.title);
      setSearchResults(validItems);
    } catch (error) {
      alert("Error al buscar el libro. Intenta ser más específico.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book) => {
    const info = book.volumeInfo;
    setFormData({
      ...formData,
      title: info.title || '',
      // VALIDAMOS SI authors EXISTE ANTES DE HACER JOIN
      author: (info.authors && Array.isArray(info.authors)) ? info.authors.join(', ') : 'Autor Desconocido',
      coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
    });
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert("Por favor, ingresa el título del libro.");
    
    setLoading(true);
    try {
      const initialHolderId = formData.deliverToSede && sedeUser ? sedeUser.id : user.uid;
      const initialHolderName = formData.deliverToSede && sedeUser ? sedeUser.displayName : (user.displayName || user.email.split('@')[0]);

      await addDoc(collection(db, "books"), {
        title: formData.title,
        author: formData.author || 'Autor Desconocido', // Aseguramos que siempre haya autor
        coverUrl: formData.coverUrl,
        spotifyLink: formData.spotifyLink,
        status: 'pending',
        donatedBy: user.uid,
        donatedByName: user.displayName || user.email.split('@')[0],
        heldBy: initialHolderId,
        heldByName: initialHolderName,
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
      <div className="bg-slate-950 px-5 py-8 rounded-b-[40px] shadow-lg mb-8 border-b border-amber-500/20">
        <h1 className="text-3xl font-black text-amber-500 tracking-tighter mb-2">Aportar Libro</h1>
        <p className="text-slate-400 font-medium text-sm">Suma una nueva lectura a la comunidad Ex Libertate.</p>
      </div>

      <div className="px-5 space-y-6">
        
        {/* BUSCADOR API */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Autocompletar con API</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por título o autor..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={isSearching || !searchTerm}
              className="bg-slate-950 text-amber-500 px-4 rounded-xl font-bold active:scale-95 transition flex items-center justify-center disabled:opacity-50"
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
                  className="flex gap-3 p-2 hover:bg-amber-50 rounded-xl cursor-pointer transition border border-transparent hover:border-amber-200 active:scale-95"
                >
                  <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                    {book.volumeInfo.imageLinks?.smallThumbnail ? (
                      <img src={book.volumeInfo.imageLinks.smallThumbnail.replace('http:', 'https:')} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      <Book size={16} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-900 truncate">{book.volumeInfo.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Autor desconocido'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Título del libro</label>
            <div className="relative">
              <Book className="absolute left-4 top-4 text-slate-400" size={18} />
              <input 
                required
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Autor</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-400" size={18} />
              <input 
                required
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Link Portada (Opcional)</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-4 text-slate-400" size={18} />
              <input 
                type="url"
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-600"
                value={formData.coverUrl}
                onChange={e => setFormData({...formData, coverUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
               Link Podcast Spotify (Opcional)
            </label>
            <div className="relative">
              <Headphones className="absolute left-4 top-4 text-[#1DB954]" size={18} />
              <input 
                type="url"
                placeholder="https://open.spotify.com/..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#1DB954] text-sm"
                value={formData.spotifyLink}
                onChange={e => setFormData({...formData, spotifyLink: e.target.value})}
              />
            </div>
          </div>

          {sedeUser && (
            <div className="pt-2">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
                ¿Dónde estará este libro?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, deliverToSede: false})}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                    !formData.deliverToSede 
                      ? 'bg-amber-100 border-amber-200 text-amber-900 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  Me lo quedo yo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, deliverToSede: true})}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    formData.deliverToSede 
                      ? 'bg-amber-100 border-amber-200 text-amber-900 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <MapPin size={14} />
                  Entregar en Sede
                </button>
              </div>
              {formData.deliverToSede && (
                <p className="text-[10px] text-slate-500 mt-2 ml-1">
                  Recuerda llevarlo a la Sede Central ({sedeUser.displayName}) para que esté disponible.
                </p>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-slate-950 text-amber-500 py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all text-sm border-2 border-amber-500/20"
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