"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Building2, ChevronRight, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EnterprisesPage() {
  const { enterprises, companyId, loading } = useAuth();
  const [switching, setSwitching] = useState<string | null>(null);

  async function handleSwitch(entId: string) {
    setSwitching(entId);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { active_company_id: entId, company_id: entId }
      });
      if (error) throw error;
      
      // Force reload to update all contexts
      window.location.href = "/catalog";
    } catch (err) {
      console.error("Error switching enterprise:", err);
      setSwitching(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#7C4DFF]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-40 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 px-6 py-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C4DFF]/10 text-[#7C4DFF] text-xs font-bold uppercase tracking-wider">
            <Building2 size={14} />
            Espace de Travail
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Mes Entreprises
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Basculez entre vos différentes entités pour gérer leurs catalogues, 
            inventaires et paramètres spécifiques.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enterprises.map((ent, idx) => (
            <div
              key={ent.id}
              className={`
                relative group overflow-hidden
                bg-white dark:bg-[#121212] 
                rounded-[2rem] border transition-all duration-500
                ${ent.id === companyId 
                  ? 'border-[#7C4DFF] ring-4 ring-[#7C4DFF]/5 shadow-2xl shadow-[#7C4DFF]/10' 
                  : 'border-gray-100 dark:border-white/5 hover:border-[#7C4DFF]/50 hover:shadow-2xl hover:-translate-y-1'}
              `}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              {/* Active indicator */}
              {ent.id === companyId && (
                <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-[#7C4DFF] text-white text-[10px] font-black uppercase tracking-widest rounded-full z-10 shadow-lg shadow-[#7C4DFF]/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Active
                </div>
              )}

              <div className="p-8 space-y-6">
                <div className={`
                  flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500 
                  ${ent.id === companyId 
                    ? 'bg-[#7C4DFF] text-white shadow-xl shadow-[#7C4DFF]/40 rotate-3' 
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:bg-[#7C4DFF]/10 group-hover:text-[#7C4DFF] group-hover:rotate-6'}
                `}>
                  <Building2 size={32} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-[#7C4DFF] transition-colors leading-tight truncate">
                    {ent.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500">
                    <Shield size={14} className={ent.id === companyId ? 'text-[#7C4DFF]' : ''} />
                    <span>Rôle {ent.role}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    onClick={() => handleSwitch(ent.id)}
                    disabled={switching !== null}
                    className={`
                      w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300
                      ${ent.id === companyId
                        ? 'bg-gray-100 dark:bg-white/[0.03] text-gray-400 cursor-default'
                        : 'bg-black dark:bg-white text-white dark:text-black hover:bg-[#7C4DFF] dark:hover:bg-[#7C4DFF] hover:border-[#7C4DFF] hover:text-white dark:hover:text-white shadow-xl shadow-black/5 dark:shadow-white/5'}
                    `}
                  >
                    {switching === ent.id ? (
                      <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : ent.id === companyId ? (
                      'Espace de travail actuel'
                    ) : (
                      <>
                        Accéder
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  {ent.id === companyId && (
                    <Link
                      href="/catalog"
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border-2 border-[#7C4DFF] text-[#7C4DFF] hover:bg-[#7C4DFF] hover:text-white shadow-lg shadow-[#7C4DFF]/10 transition-all duration-300"
                    >
                      Voir le Catalogue Base de Donnée
                      <ChevronRight size={18} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#7C4DFF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}

          {/* New Company card */}
          <Link
            href="/create-enterprise"
            className="
              relative flex flex-col items-center justify-center p-8 min-h-[300px]
              bg-gray-50/50 dark:bg-white/[0.01] border-2 border-dashed border-gray-200 dark:border-white/5
              rounded-[2rem] hover:border-[#7C4DFF] hover:bg-white dark:hover:bg-[#121212] transition-all duration-500 group
            "
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5 shadow-sm group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#7C4DFF]/10 transition-all duration-500">
              <Plus size={32} className="text-gray-300 group-hover:text-[#7C4DFF] transition-colors" />
            </div>
            <div className="text-center mt-6 space-y-2">
              <p className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle Entreprise</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 px-6 leading-relaxed">
                Connectez une nouvelle entité pour étendre vos activités.
              </p>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-transparent via-transparent to-[#7C4DFF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {enterprises.length === 0 && (
          <div className="relative overflow-hidden bg-amber-50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/10 p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 text-center md:text-left transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full" />
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-900/20 text-amber-500">
              <Shield size={40} />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black text-amber-900 dark:text-amber-200">Prêt à démarrer ?</h4>
              <p className="text-amber-700/80 dark:text-amber-400/80 text-lg leading-relaxed max-w-xl">
                Vous n'êtes membre d'aucune entreprise pour le moment. Créez votre première entreprise pour accéder au catalogue de produits.
              </p>
              <Link 
                href="/create-enterprise"
                className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-xl shadow-amber-500/20 transition-all"
              >
                Créer mon entreprise
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

