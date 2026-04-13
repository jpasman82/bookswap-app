import React from 'react';
import { X, Headphones, BookOpen, User, Calendar, ShieldCheck } from 'lucide-react';

const BookDetailsModal = ({ book, onClose, onReserve, disabled }) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] relative z-10 animate-in slide-in-from-bottom-full duration-300 max-h-[95vh] overflow-y-auto">
        <div className="relative h-72 bg-purple-900 overflow-hidden">
          {book.coverUrl ? (
            <img src={book.coverUrl} className="w-full h-full object-cover opacity-60 blur-sm" alt="" />
          ) : null}
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white z-20">
            <X size={20} />
          </button>
          
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-32 h-48 bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
              {book.coverUrl ? (
                <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
              ) : (
                <div className="w-full h-full bg-purple-100 flex items-center justify-center p-4 text-center">
                  <span className="text-[10px] font-black uppercase text-purple-900">{book.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 -mt-6 bg-white rounded-t-[40px] relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight mb-2">{book.title}</h2>
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <User size={16} />
              <span className="text-sm">{book.author}</span>
            </div>
          </div>

          {/* SECCIÓN DEL PODCAST */}
          {book.spotifyLink && (
            <div className="mb-8 p-5 bg-green-50 rounded-[30px] border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#1DB954] p-2 rounded-xl text-white">
                  <Headphones size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Resumen Disponible</p>
                  <p className="text-sm font-bold text-gray-900">Escuchar el podcast en Spotify</p>
                </div>
              </div>
              <a 
                href={book.spotifyLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#1DB954] text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition uppercase tracking-widest"
              >
                REPRODUCIR AHORA
              </a>
            </div>
          )}

          <div className="space-y-6 mb-8">
            {book.description && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Sinopsis</p>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{book.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Estado</p>
                <p className="text-xs font-bold text-purple-900 uppercase">{book.status === 'available' ? 'Disponible' : 'Reservado'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Donado por</p>
                <p className="text-xs font-bold text-gray-700 truncate">{book.donatedByName || 'Comunidad'}</p>
              </div>
            </div>
          </div>

          {book.status === 'available' && (
            <button 
              onClick={onReserve}
              disabled={disabled}
              className={`w-full py-5 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                disabled ? 'bg-gray-100 text-gray-400' : 'bg-purple-900 text-white shadow-purple-200'
              }`}
            >
              <ShieldCheck size={20} />
              RESERVAR ESTA LECTURA
            </button>
          )}

          {disabled && book.status === 'available' && (
            <p className="text-center text-red-500 text-[10px] font-black uppercase mt-4 tracking-widest">
              No tienes créditos suficientes
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;