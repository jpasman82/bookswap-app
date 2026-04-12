import React from 'react';
import { X, Info } from 'lucide-react';

const BookDetailsModal = ({ book, onClose, onReserve, disabled }) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center">
      {/* Fondo oscuro con desenfoque */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Contenedor del Modal */}
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Botón de cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 transition z-20"
        >
          <X size={20} />
        </button>

        {/* Portada grande (sale un poco del borde) */}
        <div className="flex justify-center -mt-16 mb-4 shrink-0">
          <div className="w-32 h-48 bg-gray-200 rounded-xl shadow-xl overflow-hidden border-4 border-white flex items-center justify-center relative">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-400 p-2 text-center absolute">{book.title}</span>
            )}
          </div>
        </div>

        {/* Información Principal */}
        <div className="text-center mb-4 shrink-0">
          <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">
            {book.status === 'available' ? 'Disponible' : 'Reservado'}
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{book.title}</h2>
          <p className="text-md text-gray-500 font-medium">{book.author}</p>
        </div>

        {/* SECCIÓN NUEVA: Descripción con Scroll */}
        <div className="flex-1 overflow-y-auto mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-900">
            <Info size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold">Sinopsis</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {book.description || "Este ejemplar fue aportado a la comunidad de BookSwap sin una sinopsis detallada."}
          </p>
        </div>

        {/* Botón de acción */}
        <div className="mt-auto shrink-0">
          {book.status === 'available' ? (
            <button 
              onClick={() => {
                onReserve();
                onClose();
              }}
              disabled={disabled}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                disabled 
                  ? 'bg-gray-200 text-gray-400' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {disabled ? 'Necesitás 1 crédito' : 'Reservar ahora'}
            </button>
          ) : (
            <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-lg">
              No disponible actualmente
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookDetailsModal;