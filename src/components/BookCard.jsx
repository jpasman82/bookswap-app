import React from 'react';
import { CheckCircle, Trash2, Edit3, Headphones, ListPlus, Check, ShieldCheck } from 'lucide-react';

const BookCard = ({ book, userId, sedeUser, isAdmin, onReserve, onOpenDetails, onAuthorize, onDelete, onEdit, onWaitlist, onRemoveWaitlist, disabled }) => {
  const gradients = ['from-purple-900 to-indigo-800', 'from-indigo-800 to-purple-800', 'from-fuchsia-800 to-purple-900'];
  const colorIndex = book.title ? book.title.length % gradients.length : 0;

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
            
            {book.status !== 'pending' && (
              <p className={`text-[10px] font-bold mt-2 ${daysLeft < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {daysLeft < 0 ? 'Devolución vencida' : `Faltan ${daysLeft} días para devolución`}
              </p>
            )}
          </div>
          
          {book.spotifyLink && (
            <a 
              href={book.spotifyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black text-[#1DB954] uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg w-max"
            >
              <Headphones size={12} /> Escuchar Resumen
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
        
        {/* PANEL DE ADMINISTRADOR (Siempre visible para Admins) */}
        {isAdmin && (
          <div className="flex gap-2 w-full pb-2 border-b border-gray-50">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <Edit3 size={14} /> Editar
            </button>
            {book.status === 'pending' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAuthorize(); }}
                className="flex-1 bg-purple-100 text-purple-900 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <CheckCircle size={14} /> Autorizar
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}

        {/* ACCIONES DEL USUARIO LECTOR */}
        <div className="flex gap-2 w-full">
          
          {book.status === 'pending' && !isAdmin && (
            <div className="w-full py-3 bg-orange-50 text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
              En revisión por administrador
            </div>
          )}

          {isMyBook && book.status !== 'pending' && (
            <div className="flex-1 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest bg-purple-50 text-purple-900 flex items-center justify-center text-center">
              Libro en tu poder
            </div>
          )}

          {canReserve && (
            <button 
              onClick={(e) => { e.stopPropagation(); onReserve(); }}
              disabled={disabled}
              className={`flex-1 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition flex items-center justify-center gap-2 ${
                disabled ? 'bg-gray-100 text-gray-400' : 'bg-[#1DB954] text-white shadow-md shadow-green-200'
              }`}
            >
              {disabled ? 'Sin créditos' : <><ShieldCheck size={14} /> Reservar</>}
            </button>
          )}

          {canWaitlist && (
            isWaitlisted ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveWaitlist(); }}
                className="flex-1 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest bg-green-100 text-green-700 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Check size={14} /> En espera ({waitlistCount})
              </button>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); onWaitlist(); }}
                className="flex-1 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest bg-gray-100 text-gray-700 active:scale-95 transition flex items-center justify-center gap-2 hover:bg-gray-200"
              >
                <ListPlus size={14} /> Anotarme en espera ({waitlistCount})
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;