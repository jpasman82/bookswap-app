import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, MapPin, Save, ShieldAlert, Link as LinkIcon, Loader2, Phone, Clock, Star, Repeat } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Le pasamos dbUser para saber si es un usuario nuevo o si solo está editando
const Profile = ({ user, dbUser }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState([-34.482, -58.550]);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    photoUrl: user?.photoURL || '',
    phone: '',
    locationText: '',
    bio: ''
  });

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data.display_name) {
        const address = data.address;
        const shortAddress = `${address.road || ''} ${address.house_number || ''}, ${address.suburb || address.city || ''}`.trim().replace(/^,|,$/g, '');
        setFormData(prev => ({ ...prev, locationText: shortAddress || data.display_name }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
      },
    });
    return position === null ? null : <Marker position={position} />;
  }

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
            phone: data.phone || '',
            locationText: data.locationText || data.location || '',
            bio: data.bio || ''
          });
          if (data.coords) setPosition(data.coords);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.phone) return alert("El celular es obligatorio.");
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        ...formData,
        coords: position,
        updatedAt: new Date()
      };

      // Si el usuario es NUEVO, lo pasamos a pendiente. 
      // Si ya estaba aprobado o es admin, NO le tocamos el status para no bloquearlo.
      if (dbUser?.status === 'new') {
        updateData.status = 'pending';
      }

      await setDoc(userRef, updateData, { merge: true });
      
      if (dbUser?.status === 'new') {
        alert("¡Perfil guardado! Un administrador revisará tu cuenta.");
      } else {
        alert("¡Tus datos se actualizaron correctamente!");
      }
      
    } catch (error) {
      alert("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-purple-900">
      <Loader2 size={32} className="animate-spin" />
    </div>
  );

  return (
    <div className="pb-28 animate-in fade-in duration-500">
      <div className="bg-purple-900 px-6 py-10 rounded-b-[40px] shadow-lg mb-8 text-white">
        <h1 className="text-3xl font-black tracking-tighter mb-2">Mi Perfil</h1>
        <p className="text-purple-200 text-sm font-medium">Configura tu cuenta para empezar a intercambiar.</p>
      </div>

      {dbUser?.status === 'new' && (
        <div className="px-5 mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-900 mb-4 ml-1">Cómo funciona BookSwap</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex gap-4 shadow-sm">
              <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600 shrink-0 h-max"><Star size={20} /></div>
              <div>
                <p className="text-xs font-black text-gray-900 uppercase mb-1">Obtén Créditos</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Dona un libro para recibir 1 crédito. Solo puedes tener 1 crédito a la vez (máximo un libro en tu poder).</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex gap-4 shadow-sm">
              <div className="bg-purple-100 p-3 rounded-2xl text-purple-600 shrink-0 h-max"><Clock size={20} /></div>
              <div>
                <p className="text-xs font-black text-gray-900 uppercase mb-1">Plazo de 10 días</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Al reservar, tienes 10 días para disfrutar la lectura. Vencido el plazo, el sistema te pedirá devolverlo.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-purple-100 flex gap-4 shadow-sm">
              <div className="bg-green-100 p-3 rounded-2xl text-green-600 shrink-0 h-max"><Repeat size={20} /></div>
              <div>
                <p className="text-xs font-black text-gray-900 uppercase mb-1">Devuelve y Repite</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Al devolver el libro a la Sede o al siguiente lector, recuperas tu crédito para elegir una nueva aventura.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="px-5 space-y-6">
        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 rounded-full bg-purple-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative">
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-purple-200" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-purple-900" size={18} />
              <input required className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-purple-900 outline-none text-sm"
                value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Celular (WhatsApp)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 text-purple-900" size={18} />
              <input required type="tel" placeholder="1123456789" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-purple-900 outline-none text-sm"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div className="bg-purple-50 p-5 rounded-[32px] border border-purple-100 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-purple-900" />
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-900">Punto de Intercambio</h3>
            </div>
            
            <div className="h-60 w-full rounded-2xl overflow-hidden border-2 border-white shadow-sm z-0 relative">
              <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker />
              </MapContainer>
            </div>

            <div>
              <label className="text-[9px] font-black text-purple-400 uppercase ml-1 mb-1 block">Dirección Detectada / Referencia</label>
              <input required className="w-full px-4 py-3 bg-white border border-purple-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-900 outline-none"
                value={formData.locationText} onChange={e => setFormData({...formData, locationText: e.target.value})} />
            </div>

            <div className="flex gap-2 text-purple-800 bg-white/50 p-3 rounded-xl">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-tight">Toca el mapa para autocompletar la dirección. No uses tu dirección exacta por seguridad.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Biografía / Intereses</label>
            <textarea className="w-full px-4 py-4 bg-white border border-gray-100 rounded-2xl font-medium focus:ring-2 focus:ring-purple-900 outline-none text-sm h-24 resize-none"
              value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-yellow-500 text-purple-950 py-5 rounded-2xl font-black shadow-xl shadow-yellow-200/50 active:scale-95 transition-all">
          {saving ? <Loader2 className="animate-spin mx-auto" /> : 'GUARDAR PERFIL'}
        </button>
      </form>
    </div>
  );
};

export default Profile;