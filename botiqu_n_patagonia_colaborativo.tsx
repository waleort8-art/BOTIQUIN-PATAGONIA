import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ShieldAlert, 
  Plus, 
  Users, 
  Activity, 
  Sparkles, 
  Compass, 
  Filter, 
  Search, 
  AlertTriangle, 
  PackageCheck, 
  Layers, 
  Info,
  Calendar,
  Mountain,
  Check,
  X,
  Share2,
  Trash2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';

// -------------------------------------------------------------
// Firebase Initialization & Config
// -------------------------------------------------------------
const appId = typeof __app_id !== 'undefined' ? __app_id : 'patagonia-botiquin-app';

let auth = null;
let db = null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase initialization skipped or error:", e);
}

// -------------------------------------------------------------
// Initial Data Blueprint
// -------------------------------------------------------------
const MEMBERS = [
  { id: 'pepe', name: 'Pepe', color: 'bg-emerald-600', ring: 'ring-emerald-500', light: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'toni', name: 'Toni', color: 'bg-blue-600', ring: 'ring-blue-500', light: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'rober', name: 'Rober', color: 'bg-amber-600', ring: 'ring-amber-500', light: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'ursu', name: 'Ursu', color: 'bg-purple-600', ring: 'ring-purple-500', light: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'miri', name: 'Miri', color: 'bg-rose-600', ring: 'ring-rose-500', light: 'bg-rose-50 text-rose-800 border-rose-200' },
];

const INITIAL_ITEMS = [
  // 1. Medicación General
  {
    id: 'med_personal',
    name: 'Medicación personal diaria',
    category: 'Medicación General',
    usage: 'Pauta individual de cada uno. Calcular para 18-20 días por posibles imprevistos.',
    requiredPerPerson: true,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Cada uno es responsable de la suya'
  },
  {
    id: 'ibuprofeno_paracetamol',
    name: 'Ibuprofeno 400/600mg o Paracetamol 1g',
    category: 'Medicación General',
    usage: 'Sobrecargas musculares de trekking, inflamación articular, cefalea o fiebre.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: '2-3 blísteres para el grupo'
  },
  {
    id: 'loperamida',
    name: 'Antidiarreico (Loperamida / Fortasec)',
    category: 'Medicación General',
    usage: 'Desajustes gastrointestinales en ruta y traslados largos en bus/avión.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: '1 caja de rescate'
  },
  {
    id: 'probioticos',
    name: 'Probióticos intestinales',
    category: 'Medicación General',
    usage: 'Regeneración y mantenimiento de la flora intestinal tras desajustes alimentarios.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: ''
  },
  {
    id: 'suero_oral',
    name: 'Sobres de sales de rehidratación oral',
    category: 'Medicación General',
    usage: 'Deshidratación por esfuerzo extenuante con viento seco o gastroenteritis.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Al menos 6-8 sobres'
  },
  {
    id: 'antihistaminico',
    name: 'Antihistamínico oral (Cetirizina / Loratadina)',
    category: 'Medicación General',
    usage: 'Alergias sobrevenidas, picaduras de insectos o urticaria por plantas.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: '1 blíster'
  },
  {
    id: 'biodramina',
    name: 'Biodramina (con o sin cafeína)',
    category: 'Medicación General',
    usage: 'Esencial para navegaciones en catamaranes (Canal Beagle, Glaciar Perito Moreno) y ripio.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Tomar 30 min antes de zarpar'
  },

  // 2. Antibióticos
  {
    id: 'antibiotico_topico',
    name: 'Antibiótico tópico dérmico (Mupirocina / Ác. Fusídico)',
    category: 'Antibióticos (Bajo Receta)',
    usage: 'Rozaduras graves, ampollas abiertas o cortes con sospecha de infección.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: '1 tubo pequeño de pomada'
  },
  {
    id: 'antibiotico_oral',
    name: 'Antibiótico oral de amplio espectro (Amoxicilina/Clavulánico)',
    category: 'Antibióticos (Bajo Receta)',
    usage: 'Infección bacteriana respiratoria o dérmica en zonas aisladas sin médico inmediato.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Consultar pauta y alergias previas'
  },
  {
    id: 'antibiotico_digestivo',
    name: 'Antibiótico intestinal (Rifaximina o Ciprofloxacino)',
    category: 'Antibióticos (Bajo Receta)',
    usage: 'Gastroenteritis bacteriana aguda severa del viajero con fiebre alta.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Uso de rescate'
  },

  // 3. Cura y Rozaduras
  {
    id: 'compeed_ampollas',
    name: 'Apósitos hidrocoloides (Compeed / apósitos de gel)',
    category: 'Cura de Heridas y Ampollas',
    usage: 'Talones, empeine y dedos de los pies. Alivio inmediato y protección de la piel viva.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Llevar varios formatos'
  },
  {
    id: 'esparadrapo_tela',
    name: 'Esparadrapo de tela resistente / Tape deportivo',
    category: 'Cura de Heridas y Ampollas',
    usage: 'Fijación de vendajes y prevención preventiva pegándolo antes de que salga la ampolla.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'El adhesivo debe resistir sudor'
  },
  {
    id: 'clorhexidina',
    name: 'Antiséptico en spray o toallitas (Clorhexidina)',
    category: 'Cura de Heridas y Ampollas',
    usage: 'Desinfección de heridas y raspones en plena montaña sin manchar.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Envase ligero que no gotee'
  },
  {
    id: 'gasas_tiritas',
    name: 'Gasas estériles y pack de tiritas surtidas',
    category: 'Cura de Heridas y Ampollas',
    usage: 'Cura seca de rozaduras o cortes en manos.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: ''
  },
  {
    id: 'venda_cohesiva',
    name: 'Venda elástica cohesiva (5-7 cm auto-adherente)',
    category: 'Cura de Heridas y Ampollas',
    usage: 'Inmovilización de tobillos o muñecas por torceduras en terreno pedregoso/raíces.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: '1-2 rollos'
  },

  // 4. Clima y Radiación
  {
    id: 'protector_labial',
    name: 'Protector labial con SPF 50+',
    category: 'Clima, Viento y Radiación',
    usage: 'El viento seco patagónico raja los labios en pocas horas. Reaplicar constantemente.',
    requiredPerPerson: true,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Imprescindible llevarlo en bolsillo a mano'
  },
  {
    id: 'crema_solar_50',
    name: 'Protector solar facial/corporal SPF 50+',
    category: 'Clima, Viento y Radiación',
    usage: 'Radiación UV extrema austral y reflejo sobre nieve, hielo y lagos.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Envase 100-200ml'
  },
  {
    id: 'lagrimas_artificiales',
    name: 'Gotas oftálmicas / Colirio humectante (Lágrimas)',
    category: 'Clima, Viento y Radiación',
    usage: 'Alivio instantáneo para ojos secos, arenilla y enrojecimiento causado por el viento.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Monodosis recomendadas'
  },
  {
    id: 'crema_reparadora',
    name: 'Crema reparadora / Bálsamo cicatrizante (Cicalfate/Cicaplast)',
    category: 'Clima, Viento y Radiación',
    usage: 'Para manos agrietadas, piel castigada por frío y viento en refugios.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: ''
  },

  // 5. Herramientas y Logística
  {
    id: 'pinzas_precision',
    name: 'Pinzas finas de precisión',
    category: 'Herramientas y Soporte',
    usage: 'Extracción de astillas de bosque de lenga, espinas o garrapatas.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Punta fina metálica'
  },
  {
    id: 'tijeras_punta_roma',
    name: 'Tijeras pequeñas de punta roma',
    category: 'Herramientas y Soporte',
    usage: 'Para cortar esparadrapos y apósitos a medida. (¡Facturar en bodega si se vuela!).',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Atención: No llevar en cabina'
  },
  {
    id: 'manta_termica',
    name: 'Manta térmica de emergencia aluminizada',
    category: 'Herramientas y Soporte',
    usage: 'Protección contra hipotermia o cambios bruscos repentinos en sendero.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Al menos 2 para el grupo'
  },
  {
    id: 'bolsa_estanca',
    name: 'Neceser impermeable o bolsa estanca estanca',
    category: 'Herramientas y Soporte',
    usage: 'Mantiene todo el material médico 100% seco frente a lluvias o nieve.',
    requiredPerPerson: false,
    assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false },
    notes: 'Resistente a rozaduras'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState('pepe');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'covered', 'pending'
  const [isSyncing, setIsSyncing] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New item modal form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Medicación General',
    usage: '',
    notes: '',
    requiredPerPerson: false
  });

  // Show temporary toast notification
  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // Firebase Auth & Realtime Sync Effect
  // -------------------------------------------------------------
  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Auth initialization error, running in local state mode:", err);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setFirebaseUser(usr);
    });

    return () => unsubscribe();
  }, []);

  // Sync with Firestore collection
  useEffect(() => {
    if (!db || !firebaseUser) return;

    setIsSyncing(true);
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'patagonia_botiquin');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        setIsSyncing(false);
        if (!snapshot.empty) {
          const loadedDocs = [];
          snapshot.forEach((docSnap) => {
            loadedDocs.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort items by original order or category
          setItems(loadedDocs);
        } else {
          // If Firestore is empty, seed it with the default list
          INITIAL_ITEMS.forEach(async (item) => {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'patagonia_botiquin', item.id);
            await setDoc(docRef, item).catch(() => {});
          });
        }
      },
      (err) => {
        console.error("Firestore sync error:", err);
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  // -------------------------------------------------------------
  // Toggle Checkbox Handler (Optimistic + Firestore)
  // -------------------------------------------------------------
  const toggleAssignment = async (itemId, memberId) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const currentVal = item.assignments?.[memberId] || false;
        const newAssignments = {
          ...item.assignments,
          [memberId]: !currentVal
        };
        return { ...item, assignments: newAssignments };
      }
      return item;
    });

    setItems(updatedItems);

    const changedItem = updatedItems.find((i) => i.id === itemId);
    const isNowChecked = changedItem?.assignments?.[memberId];
    const memberName = MEMBERS.find(m => m.id === memberId)?.name;

    notify(`${memberName} ${isNowChecked ? 'se encarga de' : 'desmarcó'}: ${changedItem.name}`);

    // Persist to Firestore if available
    if (db && firebaseUser && changedItem) {
      try {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'patagonia_botiquin', itemId);
        await setDoc(itemRef, changedItem, { merge: true });
      } catch (e) {
        console.error("Error writing to Firestore:", e);
      }
    }
  };

  // Add Custom Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const uniqueId = 'item_' + Date.now();
    const itemToAdd = {
      id: uniqueId,
      name: newItem.name.trim(),
      category: newItem.category,
      usage: newItem.usage.trim() || 'Uso específico acordado por el grupo.',
      notes: newItem.notes.trim() || '',
      requiredPerPerson: newItem.requiredPerPerson,
      assignments: { pepe: false, toni: false, rober: false, ursu: false, miri: false }
    };

    setItems((prev) => [...prev, itemToAdd]);
    setShowAddModal(false);
    setNewItem({
      name: '',
      category: 'Medicación General',
      usage: '',
      notes: '',
      requiredPerPerson: false
    });
    notify(`Elemento añadido: ${itemToAdd.name}`);

    if (db && firebaseUser) {
      try {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'patagonia_botiquin', uniqueId);
        await setDoc(itemRef, itemToAdd);
      } catch (err) {
        console.error("Error saving custom item:", err);
      }
    }
  };

  // Delete Custom Item
  const handleDeleteItem = async (itemId, itemName) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    notify(`Eliminado: ${itemName}`);

    if (db && firebaseUser) {
      try {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'patagonia_botiquin', itemId);
        await deleteDoc(itemRef);
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
  };

  // -------------------------------------------------------------
  // Computed Statistics & Filtering
  // -------------------------------------------------------------
  const categories = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.category)));
    return ['Todas', ...list];
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    let coveredCount = 0;

    const memberCounts = { pepe: 0, toni: 0, rober: 0, ursu: 0, miri: 0 };

    items.forEach((item) => {
      let isItemCovered = false;
      MEMBERS.forEach((m) => {
        if (item.assignments?.[m.id]) {
          memberCounts[m.id]++;
          isItemCovered = true;
        }
      });
      if (isItemCovered) coveredCount++;
    });

    const percent = total > 0 ? Math.round((coveredCount / total) * 100) : 0;
    return { total, coveredCount, percent, memberCounts };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search match
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.usage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCat = activeCategoryFilter === 'Todas' || item.category === activeCategoryFilter;

      // Status filter
      const hasAnyCheck = MEMBERS.some((m) => item.assignments?.[m.id]);
      let matchesStatus = true;
      if (statusFilter === 'covered') matchesStatus = hasAnyCheck;
      if (statusFilter === 'pending') matchesStatus = !hasAnyCheck;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, activeCategoryFilter, statusFilter]);

  const activeMemberObj = MEMBERS.find((m) => m.id === currentUser) || MEMBERS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Banner / Expedition Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-sky-800/40 px-4 py-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-inner">
              <Mountain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  Expedición Patagonia
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 17 Nov — 4 Dic
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Botiquín Colaborativo de Grupo
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Organización y reparto de material médico, apósitos, antibióticos y rescate de montaña.
              </p>
            </div>
          </div>

          {/* Quick sync status pill */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span className="text-slate-300">
                {isSyncing ? 'Sincronizando...' : 'Conectado en vivo'}
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Ítem</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* User Active Selector: "Quién está marcando ahora" */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm uppercase tracking-wider font-bold text-slate-200">
                ¿Quién eres tú en este momento?
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Selecciona tu nombre para marcar rápidamente o filtrar tus encargos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {MEMBERS.map((m) => {
              const isActive = currentUser === m.id;
              const count = stats.memberCounts[m.id] || 0;
              return (
                <button
                  key={m.id}
                  onClick={() => setCurrentUser(m.id)}
                  className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? `${m.color} text-white border-transparent shadow-lg shadow-cyan-950/50 scale-[1.02] ring-2 ring-cyan-400`
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm ${m.color}`}>
                      {m.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold truncate leading-tight">{m.name}</p>
                      <p className={`text-[11px] leading-tight ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {count} {count === 1 ? 'ítem' : 'ítems'}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="p-1 rounded-full bg-white/20">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Global Progress & Quick Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-cyan-400" />
                  Progreso Global del Botiquín
                </span>
                <span className="text-sm font-bold text-cyan-300">
                  {stats.coveredCount} de {stats.total} cubiertos ({stats.percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>

            {/* Micro avatar contribution breakdown */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">Reparto por persona:</span>
              <div className="flex items-center gap-3">
                {MEMBERS.map((m) => (
                  <div key={m.id} className="flex items-center gap-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.color}`}></span>
                    <span className="font-semibold text-slate-200">{m.name}:</span>
                    <span className="text-slate-400">{stats.memberCounts[m.id]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expedition Reminder Card */}
          <div className="bg-gradient-to-br from-slate-900 to-sky-950/60 border border-sky-800/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                <Info className="w-4 h-4" /> Recomendación Médica
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recuerda llevar la medicación habitual en equipaje de mano. Los antibióticos orales requieren prescripción previa y las tijeras metálicas deben ir en <strong>equipaje facturado</strong>.
              </p>
            </div>
            <div className="pt-3 border-t border-sky-800/30 flex items-center justify-between text-xs text-slate-400">
              <span>Usuario activo: <strong className="text-cyan-300">{activeMemberObj.name}</strong></span>
              <span className="text-[11px] bg-sky-950 px-2 py-0.5 rounded text-sky-200 border border-sky-800/50">
                Listo para marcar
              </span>
            </div>
          </div>
        </section>

        {/* Filter Controls & View Switcher */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por fármaco, síntoma, apósito, uso o nota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status & View Mode */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todos ({items.length})
                </button>
                <button
                  onClick={() => setStatusFilter('covered')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'covered' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Cubiertos
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'pending' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Pendientes
                </button>
              </div>

              {/* View switch */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  title="Vista Tabla Completa"
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  title="Vista Tarjetas"
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Categoría:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                  activeCategoryFilter === cat
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-semibold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Content View: Table or Cards */}
        {viewMode === 'table' ? (
          /* TABULAR MATRIX VIEW */
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-4 px-4 sm:px-6 font-semibold min-w-[280px]">Ítem y Especificación</th>
                    <th className="py-4 px-3 font-semibold min-w-[140px]">Categoría</th>
                    {MEMBERS.map((m) => {
                      const isCurrent = currentUser === m.id;
                      return (
                        <th 
                          key={m.id} 
                          className={`py-4 px-2 text-center font-semibold w-20 transition-colors ${
                            isCurrent ? 'bg-cyan-950/30 text-cyan-300' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${m.color}`}>
                              {m.name.charAt(0)}
                            </span>
                            <span className="text-[11px] font-bold">{m.name}</span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-4 px-3 text-center font-semibold w-16">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7 + MEMBERS.length} className="py-12 text-center text-slate-500">
                        No se encontraron ítems con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isCovered = MEMBERS.some((m) => item.assignments?.[m.id]);
                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-800/30 transition-colors ${
                            isCovered ? 'bg-slate-900/20' : 'bg-transparent'
                          }`}
                        >
                          {/* Item Name & Details */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5">
                                {isCovered ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium ${isCovered ? 'text-slate-100' : 'text-slate-200'}`}>
                                    {item.name}
                                  </span>
                                  {item.requiredPerPerson && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded font-medium">
                                      Cada persona
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 leading-normal">
                                  {item.usage}
                                </p>
                                {item.notes && (
                                  <p className="text-[11px] text-cyan-300/80 italic">
                                    Nota: {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-3">
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 inline-block whitespace-nowrap">
                              {item.category}
                            </span>
                          </td>

                          {/* 5 Member Checkbox Columns */}
                          {MEMBERS.map((m) => {
                            const checked = !!item.assignments?.[m.id];
                            const isCurrent = currentUser === m.id;
                            return (
                              <td 
                                key={m.id} 
                                className={`py-3.5 px-2 text-center align-middle transition-colors ${
                                  isCurrent ? 'bg-cyan-950/20' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleAssignment(item.id, m.id)}
                                  title={`${m.name}: ${checked ? 'Desmarcar' : 'Marcar como encargado/listo'}`}
                                  className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                    checked 
                                      ? `${m.color} text-white shadow-md shadow-cyan-950/40 scale-105 ring-2 ring-white/20`
                                      : 'border border-slate-700 bg-slate-950 hover:border-slate-500 text-transparent hover:text-slate-600'
                                  }`}
                                >
                                  <Check className={`w-4 h-4 stroke-[3] ${checked ? 'opacity-100' : 'opacity-0'}`} />
                                </button>
                              </td>
                            );
                          })}

                          {/* Action (Delete custom items) */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            {item.id.startsWith('item_') && (
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                title="Eliminar ítem personalizado"
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD / GROUPED VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isCovered = MEMBERS.some((m) => item.assignments?.[m.id]);
              return (
                <div 
                  key={item.id}
                  className={`bg-slate-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md ${
                    isCovered ? 'border-slate-800 hover:border-slate-700' : 'border-amber-900/30 bg-slate-900/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.category}
                      </span>
                      {item.requiredPerPerson ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          Cada uno
                        </span>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isCovered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-300'}`}>
                          {isCovered ? 'Cubierto' : 'Pendiente'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-100 text-base">
                      {item.name}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.usage}
                    </p>

                    {item.notes && (
                      <p className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 p-2 rounded-lg">
                        <strong>Nota:</strong> {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Checklist Buttons in Card */}
                  <div className="mt-4 pt-3 border-t border-slate-800/70">
                    <p className="text-[11px] text-slate-400 mb-2 font-medium">¿Quién lo lleva / tiene?</p>
                    <div className="flex items-center justify-between gap-1.5">
                      {MEMBERS.map((m) => {
                        const checked = !!item.assignments?.[m.id];
                        const isCurrent = currentUser === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleAssignment(item.id, m.id)}
                            className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                              checked 
                                ? `${m.color} text-white border-transparent shadow` 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            } ${isCurrent ? 'ring-1 ring-cyan-400' : ''}`}
                          >
                            <span className="text-[11px] font-bold">{m.name.slice(0, 3)}</span>
                            {checked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-700 block"></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Packing & Flight Protocol Footer Guide */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" /> Clima y Viento Patagónico
            </h4>
            <p className="leading-relaxed">
              En El Chaltén y lagos, el viento persistente de 40-70 km/h acelera la deshidratación y la irritación ocular. Mantened colirio y protector labial SPF 50+ siempre en los bolsillos accesibles.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Prescripción de Antibióticos
            </h4>
            <p className="leading-relaxed">
              Tanto la pomada tópica dérmica como el antibiótico oral de rescate requieren receta médica expedida por vuestro médico de cabecera antes del vuelo.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-400" /> Normativa de Vuelo
            </h4>
            <p className="leading-relaxed">
              Tijeras metálicas, pinzas cortantes y envases de líquidos superiores a 100 ml deben viajar facturados en bodega. La medicación personal diaria debe volar siempre en cabina.
            </p>
          </div>
        </section>

      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-lg">Añadir elemento al botiquín</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre del medicamento o material *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Termómetro digital, Colirio antibiótico..."
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Medicación General">Medicación General</option>
                  <option value="Antibióticos (Bajo Receta)">Antibióticos (Bajo Receta)</option>
                  <option value="Cura de Heridas y Ampollas">Cura de Heridas y Ampollas</option>
                  <option value="Clima, Viento y Radiación">Clima, Viento y Radiación</option>
                  <option value="Herramientas y Soporte">Herramientas y Soporte</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Uso recomendado / Especificación
                </label>
                <textarea 
                  rows={2}
                  placeholder="¿Para qué síntoma, lesión o situación de ruta sirve?"
                  value={newItem.usage}
                  onChange={(e) => setNewItem({ ...newItem, usage: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas adicionales / Cantidad
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. 1 caja, facturar en bodega, etc."
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="reqPerson"
                  checked={newItem.requiredPerPerson}
                  onChange={(e) => setNewItem({ ...newItem, requiredPerPerson: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="reqPerson" className="text-xs text-slate-300 cursor-pointer">
                  ¿Debe llevarlo <strong>cada persona individualmente</strong>? (ej. medicación propia)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition-colors"
                >
                  Guardar en el Botiquín
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}