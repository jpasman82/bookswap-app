import React from 'react';
import { CheckCircle, Trash2, Edit3, Headphones } from 'lucide-react';

const BookCard = ({ book, onReserve, onOpenDetails, onAuthorize, onDelete, onEdit, disabled }) => {
  const gradients = ['from-purple-900 to-indigo-800', 'from-indigo-800 to-purple-800', 'from-fuchsia-800 to-purple-900'];
  const colorIndex = book.title ? book.title.length % gradients.length : 0;

  return (
    <div 
      onClick={onOpenDetails}
      className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-4 active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex gap-4">
        <div className={`w-24 h-32 rounded-2xl bg-gradient-to-br ${gradients[colorIndex]} shadow-lg flex items-center justify-center relative overflow-hidden shrink-0`}>
          {book.coverUrl ? (
            <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
          ) : (
            <h3 className="text-white font-black text-[10px] text-center p-2 z-10 uppercase tracking-tighter">{book.title}</h3>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 ${
              book.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
              book.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-900'
            }`}>
              {book.status === 'pending' ? 'Pendiente' : book.status === 'available' ? 'Disponible' : 'Reservado'}
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-tight mb-0.5 line-clamp-2">{book.title}</h3>
            <p className="text-xs text-gray-500 font-medium">{book.author}</p>
          </div>
          
          {/* Botón de Podcast incrustado en la card */}
          {book.spotifyLink && (
            <a 
              href={book.spotifyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Para que no abra el detalle al tocar el link
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black text-[#1DB954] uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg w-max"
            >
              <Headphones size={12} /> Escuchar Resumen
            </a>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-50">
        {book.status === 'pending' && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-12 bg-gray-100 text-gray-600 py-3 rounded-2xl flex items-center justify-center active:scale-95 transition"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAuthorize(); }}
              className="flex-1 bg-purple-900 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-purple-200 transition"
            >
              <CheckCircle size={14} /> Autorizar
            </button>
          </>
        )}
        
        {book.status === 'available' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onReserve(); }}
            disabled={disabled}
            className={`flex-1 py-3 rounded-2xl font-bold text-xs active:scale-95 transition ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-purple-900 text-white shadow-md shadow-purple-200'}`}
          >
            Reservar
          </button>
        )}

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-12 bg-red-50 text-red-500 py-3 rounded-2xl flex items-center justify-center active:scale-95 transition border border-red-100"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default BookCard;