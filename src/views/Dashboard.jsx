import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, deleteDoc, getDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { BookOpen, Bookmark, Building, XCircle, LibraryBig, Phone, Clock, Send, ShieldAlert, CheckCircle, Inbox, Check, ArrowRightLeft, Users, UserX } from 'lucide-react'; // <-- Agregados Users y UserX

const Dashboard = ({ user, dbUser }) => {
  const [stats, setStats] = useState({ donated: 0 });
  const [myReservations, setMyReservations] = useState([]);
  const [heldAvailable, setHeldAvailable] = useState([]);
  const [toDeliver, setToDeliver] = useState([]);
  const [waitlistedBooks, setWaitlistedBooks] = useState([]);
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [sedeUser, setSedeUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedSedeId, setSelectedSedeId] = useState('');
  const [contactsData, setContactsData] = useState({});

  const [sedeReceiving, setSedeReceiving] = useState([]);
  const [sedeDelivering, setSedeDelivering] = useState([]);

  const getDaysHeld = (dateVal) => {
    if (!dateVal) return 0;
    const assignedDate = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    const diffTime = Math.abs(new Date() - assignedDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSedeHelper = async () => {
    const q = query(collection(db, "users"), where("role", "==", "sede"));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  };

  // Función inteligente para detectar vencimientos y auto-transferir
  const processExpirations = async (heldBooks) => {
    let hasChanges = false;
    const currentSede = await getSedeHelper();

    for (let book of heldBooks) {
      if (book.status === 'available' && book.heldBy !== book.donatedBy) {
        const daysHeld = getDaysHeld(book.assignedAt || book.createdAt);
        if (daysHeld > 10) {
          hasChanges = true;
          const bookRef = doc(db, "books", book.id);
          
          if (book.waitlist && book.waitlist.length > 0) {
            const nextUserId = book.waitlist[0];
            const nextUserRef = doc(db, "users", nextUserId);
            const nextUserDoc = await getDoc(nextUserRef);
            if (nextUserDoc.exists()) {
              const nextUserData = nextUserDoc.data();
              const currentCredits = nextUserData.credits || 0;
              await updateDoc(nextUserRef, { credits: Math.max(0, currentCredits - 1) });
              await updateDoc(bookRef, {
                status: 'reserved',
                reservedBy: nextUserId,
                reservedByName: nextUserData.displayName,
                waitlist: arrayRemove(nextUserId),
                holderDelivered: false,
                reserverReceived: false,
                history: arrayUnion({
                  date: new Date(),
                  event: `Plazo vencido. Auto-asignado a ${nextUserData.displayName}`
                })
              });
            }
          } else if (currentSede) {
            await updateDoc(bookRef, {
              status: 'reserved',
              reservedBy: currentSede.id,
              reservedByName: currentSede.displayName,
              holderDelivered: false,
              reserverReceived: false,
              history: arrayUnion({
                date: new Date(),
                event: `Plazo vencido. Auto-asignado a Sede Central`
              })
            });
          }
        }
      }
    }
    return hasChanges;
  };

  const fetchPersonalData = async () => {
    if (!user) return;
    try {
      const donatedQuery = query(collection(db, "books"), where("donatedBy", "==", user.uid));
      const donatedSnapshot = await getDocs(donatedQuery);
      setStats({ donated: donatedSnapshot.size });

      const reservedQuery = query(collection(db, "books"), where("reservedBy", "==", user.uid));
      const reservedSnapshot = await getDocs(reservedQuery);
      const reserved = reservedSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const heldQuery = query(collection(db, "books"), where("heldBy", "==", user.uid));
      const heldSnapshot = await getDocs(heldQuery);
      const held = heldSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const didAutoTransfer = await processExpirations(held);
      if (didAutoTransfer) {
        fetchPersonalData();
        return;
      }

      const waitlistQuery = query(collection(db, "books"), where("waitlist", "array-contains", user.uid));
      const waitlistSnapshot = await getDocs(waitlistQuery);
      setWaitlistedBooks(waitlistSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const usersToFetch = new Set();
      reserved.forEach(b => { 
        const hId = b.heldBy || b.donatedBy;
        if (hId) usersToFetch.add(hId); 
      });
      held.forEach(b => { 
        if (b.reservedBy) usersToFetch.add(b.reservedBy); 
      });

      const contacts = {};
      for (let uid of usersToFetch) {
        const uDoc = await getDoc(doc(db, "users", uid));
        if (uDoc.exists()) contacts[uid] = uDoc.data();
      }
      setContactsData(contacts);

      setMyReservations(reserved.filter(b => b.status === 'reserved'));

      const available = [];
      const deliver = [];

      held.forEach(book => {
        if (book.status === 'reserved') {
          deliver.push(book);
        } else if (book.status === 'available') {
          available.push(book);
        }
      });

      setHeldAvailable(available);
      setToDeliver(deliver);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPersonalData();
  }, [user]);

  useEffect(() => {
    if (dbUser?.role !== 'admin') return;

    const fetchAdminData = async () => {
      const sede = await getSedeHelper();
      setSedeUser(sede);

      const qUsersAll = query(collection(db, "users"), where("status", "==", "approved"));
      const snapUsersAll = await getDocs(qUsersAll);
      setAllUsers(snapUsersAll.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchAdminData();

    const unsubUsers = onSnapshot(query(collection(db, "users"), where("status", "==", "pending")), (snap) => {
      setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubBooks = onSnapshot(query(collection(db, "books"), where("status", "==", "pending")), (snap) => {
      setPendingBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubBooks();
    };
  }, [dbUser]);

  useEffect(() => {
    if (dbUser?.role !== 'admin' || !sedeUser?.id) return;

    const unsubSedeRec = onSnapshot(query(collection(db, "books"), where("reservedBy", "==", sedeUser.id)), (snap) => {
      setSedeReceiving(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSedeDel = onSnapshot(query(collection(db, "books"), where("heldBy", "==", sedeUser.id), where("status", "==", "reserved")), (snap) => {
      setSedeDelivering(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSedeRec();
      unsubSedeDel();
    };
  }, [sedeUser?.id, dbUser?.role]);

  const generateWpLink = (phone, title) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola! Te escribo por el libro ${title} en BookSwap.`);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const restoreCreditToOldHolder = async (oldHolderId) => {
    try {
      const oldHolderRef = doc(db, "users", oldHolderId);
      const oldHolderDoc = await getDoc(oldHolderRef);
      if (oldHolderDoc.exists() && oldHolderDoc.data().role !== 'sede') {
        await updateDoc(oldHolderRef, { credits: 1 });
      }
    } catch (e) { console.error("Error devolviendo crédito", e); }
  };

  const handleConfirmDelivery = async (book) => {
    try {
      const bookRef = doc(db, "books", book.id);
      if (book.reserverReceived) {
        await restoreCreditToOldHolder(book.heldBy);
        await updateDoc(bookRef, {
          status: 'available',
          heldBy: book.reservedBy,
          heldByName: book.reservedByName,
          reservedBy: null,
          reservedByName: null,
          holderDelivered: false,
          reserverReceived: false,
          assignedAt: new Date(),
          history: arrayUnion({
            date: new Date(),
            event: `Recibido por ${book.reservedByName}`
          })
        });
        alert("¡Traspaso completado! Has recuperado tu crédito.");
      } else {
        await updateDoc(bookRef, { holderDelivered: true });
        alert("Marcaste el libro como entregado. Esperando confirmación de la otra parte.");
      }
      fetchPersonalData();
    } catch (error) {
      alert("Error al confirmar entrega.");
    }
  };

  const handleConfirmReceipt = async (book) => {
    try {
      const bookRef = doc(db, "books", book.id);
      if (book.holderDelivered) {
        await restoreCreditToOldHolder(book.heldBy);
        await updateDoc(bookRef, {
          status: 'available',
          heldBy: user.uid,
          heldByName: user.displayName || dbUser.displayName,
          reservedBy: null,
          reservedByName: null,
          holderDelivered: false,
          reserverReceived: false,
          assignedAt: new Date(),
          history: arrayUnion({
            date: new Date(),
            event: `Recibido por ${user.displayName || dbUser.displayName}`
          })
        });
        alert("¡Libro recibido en tu poder!");
      } else {
        await updateDoc(bookRef, { reserverReceived: true });
        alert("Confirmaste la recepción. Esperando que la otra parte marque 'Entregado'.");
      }
      fetchPersonalData();
    } catch (error) {
      alert("Error al confirmar recepción.");
    }
  };

  const handleConfirmReceiptAsSede = async (book) => {
    if (!book.holderDelivered) {
      if(!window.confirm("El usuario aún no marcó 'Entregado'. ¿Recibir en la Sede de todos modos?")) return;
    }
    try {
      await restoreCreditToOldHolder(book.heldBy);
      await updateDoc(doc(db, "books", book.id), {
        status: 'available',
        heldBy: sedeUser.id,
        heldByName: sedeUser.displayName,
        reservedBy: null,
        reservedByName: null,
        holderDelivered: false,
        reserverReceived: false,
        assignedAt: new Date(),
        history: arrayUnion({
          date: new Date(),
          event: `Ingresado a Sede Central`
        })
      });
      alert("Libro ingresado a la Sede. El usuario recuperó su crédito.");
      fetchPersonalData();
    } catch (e) { alert("Error al ingresar a Sede"); }
  };

  const handleConfirmDeliveryAsSede = async (book) => {
    try {
      const bookRef = doc(db, "books", book.id);
      if (book.reserverReceived) {
        await updateDoc(bookRef, {
          status: 'available',
          heldBy: book.reservedBy,
          heldByName: book.reservedByName,
          reservedBy: null,
          reservedByName: null,
          holderDelivered: false,
          reserverReceived: false,
          assignedAt: new Date(),
          history: arrayUnion({
            date: new Date(),
            event: `Entregado por Sede a ${book.reservedByName}`
          })
        });
        alert("Traspaso desde Sede completado con éxito.");
      } else {
        await updateDoc(bookRef, { holderDelivered: true });
        alert("Marcado como entregado. Esperando que el usuario confirme recepción.");
      }
      fetchPersonalData();
    } catch (e) { alert("Error al entregar desde Sede"); }
  };

  const handleReturnBook = async (book) => {
    if (!window.confirm("¿Confirmas que quieres enviar este libro?")) return;
    try {
      const bookRef = doc(db, "books", book.id);
      
      if (book.waitlist && book.waitlist.length > 0) {
        const nextUserId = book.waitlist[0];
        const nextUserRef = doc(db, "users", nextUserId);
        const nextUserDoc = await getDoc(nextUserRef);
        
        if (nextUserDoc.exists()) {
          const nextUserData = nextUserDoc.data();
          const currentCredits = nextUserData.credits || 0;
          
          await updateDoc(nextUserRef, { credits: Math.max(0, currentCredits - 1) });
          await updateDoc(bookRef, {
            status: 'reserved',
            reservedBy: nextUserId,
            reservedByName: nextUserData.displayName,
            waitlist: arrayRemove(nextUserId),
            holderDelivered: false,
            reserverReceived: false,
            history: arrayUnion({
              date: new Date(),
              event: `Asignado a ${nextUserData.displayName} desde lista de espera`
            })
          });
          alert(`¡El libro fue asignado a ${nextUserData.displayName} que estaba en lista de espera! Coordiná la entrega.`);
        }
      } else {
        const currentSede = await getSedeHelper();
        if (!currentSede) return alert("La Sede Central no está configurada.");
        await updateDoc(bookRef, {
          status: 'reserved',
          reservedBy: currentSede.id,
          reservedByName: currentSede.displayName,
          holderDelivered: false,
          reserverReceived: false,
          history: arrayUnion({
            date: new Date(),
            event: `Enviado a Sede Central`
          })
        });
        alert("Libro asignado a Sede Central. Ve a 'Debes Entregar' y confirma cuando lo lleves.");
      }
      fetchPersonalData();
    } catch (error) {
      alert("Error al devolver el libro.");
    }
  };

  const cancelReservation = async (bookId) => {
    try {
      const bookRef = doc(db, "books", bookId);
      const userRef = doc(db, "users", user.uid);

      await updateDoc(bookRef, { 
        status: 'available', 
        reservedBy: null, 
        reservedByName: null,
        holderDelivered: false,
        reserverReceived: false
      });
      await updateDoc(userRef, { credits: 1 });
      fetchPersonalData(); 
    } catch (error) {
      alert("Error al cancelar.");
    }
  };

  const approveUser = async (uid, roleToAssign = 'user') => {
    const roleName = roleToAssign === 'admin' ? 'Administrador' : 'Lector';
    if (!window.confirm(`¿Aprobar a este usuario con el rol de ${roleName}?`)) return;
    try {
      await updateDoc(doc(db, "users", uid), { status: 'approved', role: roleToAssign });
      const snap = await getDocs(query(collection(db, "users"), where("status", "==", "approved")));
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      alert("Error al aprobar usuario.");
    }
  };

  // NUEVA FUNCIÓN: ELIMINAR ACCESO DE USUARIO
  const deleteUserAccess = async (uid, userName) => {
    if (!window.confirm(`¿Estás seguro que deseas eliminar el acceso de ${userName}? Perderá su cuenta y deberá registrarse nuevamente.`)) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      // Actualizamos la lista local sin necesidad de hacer otro fetch
      setAllUsers(prev => prev.filter(u => u.id !== uid));
      alert(`Acceso eliminado para ${userName}.`);
    } catch (error) {
      alert("Error al eliminar el usuario.");
    }
  };

  const assignSede = async () => {
    if (!selectedSedeId) return;
    try {
      if (sedeUser && sedeUser.id !== selectedSedeId) {
        await updateDoc(doc(db, "users", sedeUser.id), { role: 'user' });
      }
      await updateDoc(doc(db, "users", selectedSedeId), { role: 'sede', credits: 999 });
      const newSedeDoc = await getDoc(doc(db, "users", selectedSedeId));
      setSedeUser({ id: newSedeDoc.id, ...newSedeDoc.data() });
      setSelectedSedeId('');
    } catch (error) {
      alert("Error.");
    }
  };

  const approveBook = async (bookId, holderId, holderName) => {
    try {
      const donorDoc = await getDoc(doc(db, "users", holderId));
      if (donorDoc.exists()) {
        await updateDoc(doc(db, "users", holderId), { credits: 1 });
      }
      await updateDoc(doc(db, "books", bookId), {
        status: 'available',
        heldBy: holderId,
        heldByName: holderName,
        assignedAt: new Date(),
        history: [{
          date: new Date(),
          event: `Aprobado en sistema. En poder de ${holderName}`
        }]
      });
    } catch (error) {
      alert("Error.");
    }
  };

  const rejectBook = async (bookId) => {
    try {
      await deleteDoc(doc(db, "books", bookId));
    } catch (error) {
      alert("Error.");
    }
  };

  return (
    <div className="pb-28 animate-in fade-in duration-500 space-y-8">
      
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-[35px] text-white shadow-xl shadow-purple-200 mt-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><LibraryBig size={100} /></div>
        <h1 className="text-3xl font-black tracking-tighter mb-1 relative z-10">
          Hola, {dbUser?.displayName ? dbUser.displayName.split(' ')[0] : 'Lector'} 👋
        </h1>
        <p className="text-purple-200 font-medium text-sm mb-6 relative z-10">Este es tu resumen de actividad.</p>
        
        <div className="grid grid-cols-3 gap-2 relative z-10 mb-2">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center justify-center">
            <p className="text-xl font-black">{dbUser?.credits > 0 ? 1 : 0}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200 text-center">Créditos</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center justify-center">
            <p className="text-xl font-black">{stats.donated}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200 text-center">Donados</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center justify-center">
            <p className="text-xl font-black">{heldAvailable.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200 text-center">En mi poder</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 relative z-10">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center justify-center">
            <p className="text-xl font-black">{myReservations.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200 text-center">Reservados</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center justify-center">
            <p className="text-xl font-black">{waitlistedBooks.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-200 text-center">Lista de Espera</p>
          </div>
        </div>
      </div>

      {toDeliver.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Send size={20} className="text-purple-900" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Debes Entregar</h2>
          </div>
          <div className="flex flex-col gap-4">
            {toDeliver.map(book => {
              const isToSede = book.reservedBy === sedeUser?.id;
              const reserverPhone = contactsData[book.reservedBy]?.phone;
              const wpLink = generateWpLink(reserverPhone, book.title);
              return (
                <div key={book.id} className="bg-white p-4 rounded-3xl shadow-sm border-2 border-yellow-400 flex flex-col gap-3">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg inline-block mb-1">
                        A: {isToSede ? 'SEDE CENTRAL' : book.reservedByName}
                      </p>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
                    </div>
                  </div>
                  
                  {book.holderDelivered ? (
                    <div className="bg-purple-50 text-purple-900 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <Clock size={14} /> Esperando confirmación de {isToSede ? 'la Sede' : book.reservedByName}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {wpLink && !isToSede && (
                        <a href={wpLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-black px-4 py-3 rounded-xl flex items-center justify-center active:scale-95 transition">
                          <Phone size={16} />
                        </a>
                      )}
                      <button onClick={() => handleConfirmDelivery(book)} className="flex-1 bg-purple-900 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition">
                        Confirmar Entrega
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Inbox size={20} className="text-gray-900" />
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Mis Reservas</h2>
        </div>
        
        {myReservations.length === 0 ? (
          <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">No tienes reservas activas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myReservations.map(book => {
              const holderId = book.heldBy || book.donatedBy;
              const isFromSede = holderId === sedeUser?.id;
              const holderPhone = contactsData[holderId]?.phone;
              const wpLink = generateWpLink(holderPhone, book.title);
              return (
                <div key={book.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-24 bg-purple-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg inline-block mb-1">
                        Lo tiene: {isFromSede ? 'SEDE CENTRAL' : (book.heldByName || book.donatedByName)}
                      </p>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{book.title}</h3>
                    </div>
                  </div>
                  
                  {book.reserverReceived ? (
                    <div className="bg-purple-50 text-purple-900 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <Clock size={14} /> Esperando confirmación del otro usuario
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {wpLink && !isFromSede && (
                          <a href={wpLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition">
                            <Phone size={14} /> Contactar
                          </a>
                        )}
                        <button onClick={() => cancelReservation(book.id)} className="px-4 bg-red-50 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-xl active:scale-95 transition">
                          Cancelar
                        </button>
                      </div>
                      <button onClick={() => handleConfirmReceipt(book)} className="w-full bg-purple-900 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition shadow-sm shadow-purple-200">
                        <Check size={14} /> Confirmar Recepción
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4 px-2 mt-8">
          <Bookmark size={20} className="text-gray-900" />
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Libros en mi poder</h2>
        </div>

        {heldAvailable.length === 0 ? (
          <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">No tienes libros para leer en este momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {heldAvailable.map(book => {
              const isOwnDonation = book.heldBy === book.donatedBy;
              const daysHeld = getDaysHeld(book.assignedAt || book.createdAt);
              return (
                <div key={book.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
                      {isOwnDonation ? (
                        <p className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg mt-1 inline-block">
                          ✓ Disponible para reserva
                        </p>
                      ) : (
                        <p className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-1 rounded-lg mt-1 inline-flex items-center gap-1">
                          <Clock size={10} /> {daysHeld} / 10 días leyendo
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleReturnBook(book)} className="w-full bg-gray-100 text-gray-700 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition">
                    <ArrowRightLeft size={14} /> {isOwnDonation ? 'Enviar a Sede Central' : 'Devolver Libro'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dbUser?.role === 'admin' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 mt-8">
            <ShieldAlert size={20} className="text-yellow-600" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Panel de Control</h2>
          </div>

          {(sedeReceiving.length > 0 || sedeDelivering.length > 0) && (
            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-purple-200 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
               <h3 className="text-sm font-black tracking-widest uppercase text-purple-900 mb-4">Logística Sede Central</h3>
               
               {sedeReceiving.length > 0 && (
                   <div className="mb-4">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ingresos a la Sede (Devoluciones)</p>
                       {sedeReceiving.map(book => (
                           <div key={book.id} className="bg-purple-50 p-3 rounded-2xl mb-2 flex justify-between items-center gap-2">
                               <div className="overflow-hidden flex-1">
                                  <p className="text-sm font-bold text-gray-900 truncate">{book.title}</p>
                                  <p className="text-[10px] text-gray-500 truncate">De: {book.heldByName}</p>
                               </div>
                               <button onClick={() => handleConfirmReceiptAsSede(book)} className="bg-purple-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl shrink-0 uppercase tracking-widest active:scale-95">
                                  {book.holderDelivered ? 'Confirmar Ingreso' : 'Forzar Ingreso'}
                               </button>
                           </div>
                       ))}
                   </div>
               )}

               {sedeDelivering.length > 0 && (
                   <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Egresos de Sede (Entregas)</p>
                       {sedeDelivering.map(book => (
                           <div key={book.id} className="bg-yellow-50 p-3 rounded-2xl mb-2 flex justify-between items-center gap-2">
                               <div className="overflow-hidden flex-1">
                                  <p className="text-sm font-bold text-gray-900 truncate">{book.title}</p>
                                  <p className="text-[10px] text-gray-500 truncate">Para: {book.reservedByName}</p>
                               </div>
                               <button onClick={() => handleConfirmDeliveryAsSede(book)} className="bg-yellow-500 text-yellow-950 text-[10px] font-bold px-3 py-2 rounded-xl shrink-0 uppercase tracking-widest active:scale-95">
                                  {book.reserverReceived ? 'Confirmar Entrega' : 'Marcar Entregado'}
                               </button>
                           </div>
                       ))}
                   </div>
               )}
            </div>
          )}

          <div className="bg-purple-50 border border-purple-100 p-6 rounded-[35px]">
            <div className="flex gap-4 items-center mb-4">
              <div className="bg-purple-200 p-3 rounded-full text-purple-900"><Building size={24} /></div>
              <div>
                <h3 className="font-black text-purple-900">Configuración de Sede</h3>
                <p className="text-[11px] text-purple-700 font-medium">
                  {sedeUser ? `Actual: ${sedeUser.displayName}` : 'Ningún usuario es Sede Central.'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <select 
                className="w-full bg-white border border-purple-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-900"
                value={selectedSedeId}
                onChange={(e) => setSelectedSedeId(e.target.value)}
              >
                <option value="">Selecciona un usuario...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                ))}
              </select>
              <button onClick={assignSede} className="w-full bg-purple-900 text-white font-black py-3 rounded-2xl text-sm active:scale-95 transition shadow-lg shadow-purple-200">
                Asignar como Sede
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-yellow-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
            <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Validar Libros ({pendingBooks.length})</h3>

            {pendingBooks.length === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center py-6 bg-gray-50 rounded-2xl">
                No hay libros pendientes.
              </p>
            ) : (
              <div className="space-y-4">
                {pendingBooks.map(book => (
                  <div key={book.id} className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                        {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-black text-gray-900 truncate">{book.title}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">{book.author}</p>
                        <p className="text-[10px] text-purple-600 font-bold mt-1">Donado por: {book.donatedByName}</p>
                      </div>
                      <button onClick={() => rejectBook(book.id)} className="p-2 text-red-400 hover:text-red-600 bg-red-50 rounded-full transition">
                        <XCircle size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => approveBook(book.id, book.donatedBy, book.donatedByName)} className="bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider active:scale-95 transition shadow-sm">
                        Queda con donante
                      </button>
                      <button onClick={() => approveBook(book.id, sedeUser?.id, sedeUser?.displayName || "Sede Central")} disabled={!sedeUser} className={`py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider active:scale-95 transition shadow-sm ${sedeUser ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-gray-100 text-gray-400 opacity-50'}`}>
                        Mandar a Sede
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 mb-4">Validar Usuarios ({pendingUsers.length})</h3>

            {pendingUsers.length === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center py-6 bg-gray-50 rounded-2xl">
                No hay usuarios pendientes.
              </p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col gap-3">
                    <div className="flex gap-3 items-center">
                      <img src={u.photoUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-12 h-12 rounded-full border border-gray-200 object-cover" alt="" />
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-black text-gray-900 truncate">{u.displayName}</p>
                        <p className="text-[10px] text-gray-500 truncate font-medium">{u.email}</p>
                        <p className="text-[10px] text-purple-600 font-bold mt-0.5">📞 {u.phone || 'Sin teléfono'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 text-xs text-gray-600">
                      <p className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1">Zona:</p>
                      <p className="mb-2 font-medium">{u.locationText || 'No especificada'}</p>
                      <p className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1">Bio:</p>
                      <p className="italic text-[11px] leading-tight">{u.bio || 'Sin biografía'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button onClick={() => approveUser(u.id, 'user')} className="bg-purple-900 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition shadow-sm">
                        Aprobar Lector
                      </button>
                      <button onClick={() => approveUser(u.id, 'admin')} className="bg-yellow-400 text-yellow-950 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition shadow-sm">
                        Aprobar Admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NUEVA SECCIÓN: COMUNIDAD ACTIVA */}
          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-purple-900" />
              <h3 className="text-sm font-black tracking-widest uppercase text-gray-400">Comunidad Activa ({allUsers.length})</h3>
            </div>

            {allUsers.length === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center py-6 bg-gray-50 rounded-2xl">
                No hay usuarios activos.
              </p>
            ) : (
              <div className="space-y-3">
                {allUsers.map(u => (
                  <div key={u.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={u.photoUrl || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0" alt="" />
                      <div className="truncate">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {u.displayName} {u.role === 'admin' && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded ml-1 uppercase">Admin</span>}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate font-medium">{u.email}</p>
                      </div>
                    </div>
                    
                    {/* Evitamos que el admin se borre a sí mismo por accidente */}
                    {u.id !== user.uid && (
                      <button 
                        onClick={() => deleteUserAccess(u.id, u.displayName)} 
                        title="Revocar acceso"
                        className="p-2.5 bg-white border border-red-100 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-colors shrink-0 shadow-sm active:scale-90"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Dashboard;