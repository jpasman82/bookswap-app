import React from 'react';
import { X, Headphones, User, ShieldCheck, ListPlus, Check } from 'lucide-react';

const BookDetailsModal = ({ book, userId, sedeUser, onClose, onReserve, onWaitlist, onRemoveWaitlist, disabled }) => {
  if (!book) return null;

  const assignedDate = book.assignedAt?.toDate() || book.createdAt?.toDate();
  const diffTime = Math.abs(new Date() - assignedDate);
  const daysHeld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysLeft = 10 - daysHeld;

  const isWaitlisted = book.waitlist?.includes(userId);
  const isMyBook = book.heldBy === userId || book.reservedBy === userId;
  
  const canReserve = book.status === 'available' && !isMyBook;
  const canWaitlist = book.status === 'reserved' && !isMyBook;
  const waitlistCount = book.waitlist?.length || 0;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={onClose}
      ></div>
      
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] relative z-10 animate-in slide-in-from-bottom-full duration-300 max-h-[95vh] overflow-y-auto">
        
        <div className="relative h-72 bg-purple-900 overflow-hidden">
          {book.coverUrl && (
            <img 
              src={book.coverUrl} 
              className="w-full h-full object-cover opacity-60 blur-sm" 
              alt="" 
            />
          )}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white z-20 hover:bg-white/30 transition"
          >
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
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight mb-2">
              {book.title}
            </h2>
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <User size={16} />
              <span className="text-sm">{book.author}</span>
            </div>
          </div>

          {book.spotifyLink && (
            <div className="mb-8 p-5 bg-green-50 rounded-[30px] border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#1DB954] p-2 rounded-xl text-white shadow-lg shadow-green-200">
                  <Headphones size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Podcast Disponible</p>
                  <p className="text-sm font-bold text-gray-900">Escuchar reseña en Spotify</p>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Sinopsis</p>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  {book.description}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Estado</p>
                <p className={`text-xs font-bold uppercase ${book.status === 'available' ? 'text-green-600' : 'text-purple-900'}`}>
                  {book.status === 'available' ? 'Disponible' : 'Reservado'}
                </p>
                {book.status !== 'pending' && (
                  <p className={`text-[9px] font-bold mt-1 ${daysLeft < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {daysLeft < 0 ? 'Devolución vencida' : `Faltan ${daysLeft} días`}
                  </p>
                )}
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <p className="text-[8px] font-black uppercase tracking-widest text-purple-600 mb-1">Lo tiene</p>
                <p className="text-xs font-bold text-purple-950 truncate">
                  {book.heldByName || book.donatedByName || 'Sede Central'}
                </p>
              </div>
            </div>
          </div>

          {isMyBook && (
            <div className="w-full py-5 bg-purple-50 rounded-2xl text-purple-900 font-black text-center text-sm border border-purple-100 uppercase tracking-widest">
              LIBRO EN TU PODER O RESERVADO
            </div>
          )}

          {canReserve && (
            <button 
              onClick={onReserve}
              disabled={disabled}
              className={`w-full py-5 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                disabled 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#1DB954] text-white shadow-green-200 hover:bg-green-600'
              }`}
            >
              <ShieldCheck size={20} />
              {disabled ? 'SIN CRÉDITOS PARA RESERVAR' : 'RESERVAR ESTA LECTURA'}
            </button>
          )}

          {canWaitlist && (
            isWaitlisted ? (
              <button 
                onClick={onRemoveWaitlist}
                className="w-full py-5 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 bg-green-100 text-green-700"
              >
                <Check size={20} />
                ESTÁS EN LISTA DE ESPERA ({waitlistCount})
              </button>
            ) : (
              <button 
                onClick={onWaitlist}
                className="w-full py-5 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <ListPlus size={20} />
                ANOTARME EN LISTA DE ESPERA ({waitlistCount})
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;