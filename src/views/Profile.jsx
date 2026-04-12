import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, MapPin, Info, Save, ShieldAlert, Link as LinkIcon, Loader2 } from 'lucide-react';

const Profile = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    photoUrl: user?.photoURL || '',
    location: '',
    bio: ''
  });

  // Cuando la pantalla carga, buscamos si el usuario ya tiene datos en la base
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            displayName: data.displayName || user.displayName || '',
            photoUrl: data.photoUrl || user.photoURL || '',
            location: data.location || '',
            bio: data.bio || ''
          });
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const userRef = doc(db, "users", user.uid);
      // Usamos merge: true para no borrar los créditos que ya tenga el usuario
      await setDoc(userRef, {
        displayName: formData.displayName,
        photoUrl: formData.photoUrl,
        location: formData.location,
        bio: formData.bio,
        updatedAt: new Date()
      }, { merge: true });
      
      alert("¡Perfil guardado con éxito!");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar tu perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-blue-600">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 animate-in fade-in duration-500">
      <div className="bg-white px-5 py-8 shadow-sm border-b border-gray-50 mb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">Mi Perfil</h1>
        <p className="text-sm text-gray-500 font-medium">Completa tus datos para la comunidad.</p>
      </div>

      <form onSubmit={handleSave} className="px-5 flex flex-col gap-6">
        
        {/* FOTO DE PERFIL */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center mb-4 relative">
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-blue-300" />
            )}
          </div>
        </div>

        {/* CAMPOS DEL FORMULARIO */}
        <div className="space-y-5">
          
          {/* Nombre */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">
              <User size={14} /> Nombre Público
            </label>
            <input 
              type="text"
              required
              value={formData.displayName}
              onChange={e => setFormData({...formData, displayName: e.target.value})}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
          </div>

          {/* Foto (URL) */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">
              <LinkIcon size={14} /> Link de tu foto (Opcional)
            </label>
            <input 
              type="url"
              value={formData.photoUrl}
              onChange={e => setFormData({...formData, photoUrl: e.target.value})}
              placeholder="https://ejemplo.com/mifoto.jpg"
              className="w-full px-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
          </div>

          {/* Ubicación (Con alerta de seguridad) */}
          <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1 mb-2">
              <MapPin size={14} /> Zona de Intercambio
            </label>
            <input 
              type="text"
              required
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="Ej: Centro de San Isidro / Estación Boulogne"
              className="w-full px-4 py-4 bg-white border border-blue-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm mb-3"
            />
            {/* ALERT DE SEGURIDAD */}
            <div className="flex items-start gap-2 text-orange-700 bg-orange-100/50 p-3 rounded-xl">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Por tu seguridad, indica solamente tu localidad, barrio o un punto de encuentro público. <strong>Nunca ingreses la dirección exacta de tu domicilio.</strong>
              </p>
            </div>
          </div>

          {/* Biografía */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">
              <Info size={14} /> Sobre ti / Libros favoritos
            </label>
            <textarea 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              placeholder="¡Hola! Me encanta leer ciencia ficción y novelas históricas..."
              className="w-full px-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm h-28 resize-none"
            />
          </div>

        </div>

        {/* BOTÓN GUARDAR */}
        <button 
          type="submit"
          disabled={saving}
          className="w-full mt-4 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-95 transition uppercase tracking-widest disabled:bg-blue-400"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </button>
      </form>
    </div>
  );
};

export default Profile;