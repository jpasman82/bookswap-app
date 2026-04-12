import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const EditBookModal = ({ book, onClose, onSave }) => {
  const [formData, setFormData] = useState({ title: '', author: '', description: '' });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || ''
      });
    }
  }, [book]);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 relative z-10 animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Editar Información</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Título del Libro</label>
            <input 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Autor / Autores</label>
            <input 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sinopsis / Descripción</label>
            <textarea 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none h-40 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            onClick={() => onSave(formData)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95 transition mt-4 uppercase tracking-widest"
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookModal;