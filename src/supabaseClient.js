import { createClient } from '@supabase/supabase-js';

// Leggiamo le variabili d'ambiente (definite in .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verifichiamo se le chiavi Supabase sono reali e valide
const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'IL_TUO_SUPABASE_URL' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'LA_TUA_SUPABASE_ANON_KEY';

let supabaseInstance = null;

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Errore durante l\'inizializzazione di Supabase:', error);
  }
}

// Se non configurato o in caso di errore, utilizziamo il Mock Client basato su LocalStorage
const isSupabaseConfigured = supabaseInstance !== null;

// --- EMULATORE LOCALSTORAGE (MOCK CLIENT) ---
const mockAuthListeners = new Set();

const triggerAuthChange = (event, session) => {
  mockAuthListeners.forEach(listener => listener(event, session));
};

const mockSupabase = {
  isMock: true,
  auth: {
    async getSession() {
      const sessionStr = localStorage.getItem('workhours_local_session');
      if (sessionStr) {
        try {
          return { data: { session: JSON.parse(sessionStr) }, error: null };
        } catch (e) {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    async signInWithPassword({ email, password }) {
      // Gestione Password Locale
      let storedPassword = localStorage.getItem('workhours_local_password');
      
      if (!storedPassword) {
        // Al primo login, la password inserita diventa la password principale
        localStorage.setItem('workhours_local_password', password);
        storedPassword = password;
      }
      
      if (password === storedPassword) {
        const session = {
          user: {
            id: 'local-user-id',
            email: email || 'utente@locale.it',
          },
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365, // 1 anno
        };
        localStorage.setItem('workhours_local_session', JSON.stringify(session));
        triggerAuthChange('SIGNED_IN', session);
        return { data: { session, user: session.user }, error: null };
      } else {
        return { data: null, error: { message: 'Password errata per questo dispositivo.' } };
      }
    },

    async signOut() {
      localStorage.removeItem('workhours_local_session');
      triggerAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange(callback) {
      mockAuthListeners.add(callback);
      // Eseguiamo immediatamente il callback con lo stato corrente
      this.getSession().then(({ data }) => {
        callback(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session);
      });

      return {
        data: {
          subscription: {
            unsubscribe() {
              mockAuthListeners.delete(callback);
            }
          }
        }
      };
    }
  },

  from(tableName) {
    const filters = [];
    const orderings = [];
    let isSingle = false;
    let insertData = null;
    let updateData = null;
    let isDelete = false;

    // Helper per leggere e scrivere i dati locali
    const getLocalData = () => {
      const dataStr = localStorage.getItem(`workhours_local_${tableName}`);
      if (!dataStr) {
        // Dati di default
        if (tableName === 'profiles') {
          return [{ id: 'local-user-id', hourly_rate: 2.50 }];
        }
        return [];
      }
      try {
        return JSON.parse(dataStr);
      } catch (e) {
        return [];
      }
    };

    const saveLocalData = (data) => {
      localStorage.setItem(`workhours_local_${tableName}`, JSON.stringify(data));
    };

    const builder = {
      select() {
        return builder;
      },
      eq(field, value) {
        filters.push({ field, value });
        return builder;
      },
      order(field, options = {}) {
        orderings.push({ field, ascending: options.ascending !== false });
        return builder;
      },
      single() {
        isSingle = true;
        return builder;
      },
      insert(data) {
        insertData = data;
        return builder;
      },
      update(data) {
        updateData = data;
        return builder;
      },
      delete() {
        isDelete = true;
        return builder;
      },

      // Metodo che rende il builder "awaitable"
      async then(resolve) {
        let items = getLocalData();

        // 1. Filtraggio
        if (filters.length > 0) {
          items = items.filter(item => {
            return filters.every(f => String(item[f.field]) === String(f.value));
          });
        }

        // 2. Operazione: DELETE
        if (isDelete) {
          const allItems = getLocalData();
          const remainingItems = allItems.filter(item => {
            // Rimuovi quelli che corrispondono ai filtri
            return !filters.every(f => String(item[f.field]) === String(f.value));
          });
          saveLocalData(remainingItems);
          return resolve({ data: items, error: null });
        }

        // 3. Operazione: INSERT
        if (insertData) {
          const allItems = getLocalData();
          const newItems = Array.isArray(insertData) ? insertData : [insertData];
          
          const preparedItems = newItems.map(item => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            user_id: item.user_id || 'local-user-id',
            created_at: new Date().toISOString(),
            ...item
          }));

          allItems.push(...preparedItems);
          saveLocalData(allItems);
          return resolve({ data: preparedItems, error: null });
        }

        // 4. Operazione: UPDATE
        if (updateData) {
          const allItems = getLocalData();
          let updatedCount = 0;
          const updatedItems = allItems.map(item => {
            // Controlla se corrisponde ai filtri
            const match = filters.every(f => String(item[f.field]) === String(f.value));
            if (match) {
              updatedCount++;
              return { ...item, ...updateData, updated_at: new Date().toISOString() };
            }
            return item;
          });
          saveLocalData(updatedItems);
          
          const filteredUpdated = updatedItems.filter(item => {
            return filters.every(f => String(item[f.field]) === String(f.value));
          });

          return resolve({ data: filteredUpdated, error: null });
        }

        // 5. Ordinamento (solo per query di SELECT)
        if (orderings.length > 0) {
          items.sort((a, b) => {
            for (const order of orderings) {
              const valA = a[order.field];
              const valB = b[order.field];
              if (valA === valB) continue;
              
              const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
              return order.ascending ? comparison : -comparison;
            }
            return 0;
          });
        }

        // 6. Ritorno singolo o multiplo
        if (isSingle) {
          if (items.length === 0) {
            // Se profiles non esiste, restituiamo un default
            if (tableName === 'profiles') {
              const defaultProfile = { id: 'local-user-id', hourly_rate: 2.50 };
              const all = getLocalData();
              if (all.length === 0) {
                saveLocalData([defaultProfile]);
              }
              return resolve({ data: defaultProfile, error: null });
            }
            return resolve({ data: null, error: { message: 'Elemento non trovato' } });
          }
          return resolve({ data: items[0], error: null });
        }

        return resolve({ data: items, error: null });
      }
    };

    return builder;
  }
};

export const supabase = isSupabaseConfigured ? supabaseInstance : mockSupabase;
export { isSupabaseConfigured };
