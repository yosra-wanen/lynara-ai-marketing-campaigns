"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Enterprise {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN';
}

interface AuthState {
  userId: string | null;
  userName: string | null;
  companyId: string | null;
  companyName: string | null;
  enterprises: Enterprise[];
  loading: boolean;
}

/**
 * Hook qui expose l'utilisateur connecté et ses entreprises (company_members).
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    userName: null,
    companyId: null,
    companyName: null,
    enterprises: [],
    loading: true,
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setState({ userId: null, userName: null, companyId: null, companyName: null, enterprises: [], loading: false });
          return;
        }

        // 1. Récupérer toutes les entreprises dont l'utilisateur est membre
        const { data: members, error: memError } = await supabase
          .schema("core")
          .from("company_members")
          .select("company_id, role, companies:companies(legal_name)")
          .eq("user_id", user.id);

        let enterprises: Enterprise[] = [];
        if (members && members.length > 0) {
          enterprises = members.map((m: any) => ({
            id: m.company_id,
            name: m.companies?.legal_name || "Entreprise inconnue",
            role: (m.role?.toUpperCase() === 'OWNER' ? 'OWNER' : 'ADMIN') as 'OWNER' | 'ADMIN'
          }));
        }

        // 2. Déterminer la compagnie active
        let activeId = user.user_metadata?.active_company_id || user.user_metadata?.company_id;
        
        // Si aucune compagnie active dans les métadonnées, prendre la première de la liste des membres
        if (!activeId && enterprises.length > 0) {
          activeId = enterprises[0].id;
        }

        const activeEnterprise = enterprises.find(e => e.id === activeId) || enterprises[0];

        setState({ 
          userId: user.id, 
          userName: user.user_metadata?.full_name || user.email,
          companyId: activeEnterprise?.id || null, 
          companyName: activeEnterprise?.name || null,
          enterprises,
          loading: false 
        });
      } catch (err) {
        console.error("useAuth error:", err);
        setState({ userId: null, userName: null, companyId: null, companyName: null, enterprises: [], loading: false });
      }
    }


    loadUser();

    // Écouter les changements de session
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return state;
}
