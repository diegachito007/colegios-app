/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  rol:
    | "super_admin"
    | "admin_colegio"
    | "docente"
    | "vicerrector"
    | "inspector";
  status: "pending" | "active" | "blocked" | "rejected" | "deleted";
  colegio_id: string | null;
  display_name: string | null;
  cargo_especifico: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("id, rol, status, colegio_id, display_name, cargo_especifico")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const user = userData as UserProfile;

      if (user.colegio_id) {
        const { data: colegioData } = await supabase
          .from("colegios")
          .select("activo")
          .eq("id", user.colegio_id)
          .single();

        const colegio = colegioData as { activo: boolean } | null;

        if (colegio && !colegio.activo) {
          setProfile({ ...user, status: "blocked" });
          return;
        }
      }

      setProfile(user);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // ✅ Realtime: si el admin cambia MI rol, refresco mi perfil al instante
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("cambios-mi-perfil")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "usuarios",
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchUserProfile(user.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        const { data: userData } = await supabase
          .from("usuarios")
          .select("colegio_id")
          .eq("id", data.user.id)
          .single();

        const user = userData as { colegio_id: string | null } | null;

        if (user?.colegio_id) {
          const { data: colegioData } = await supabase
            .from("colegios")
            .select("activo")
            .eq("id", user.colegio_id)
            .single();

          const colegio = colegioData as { activo: boolean } | null;

          if (colegio && !colegio.activo) {
            return {
              error: new Error("El colegio al que perteneces está inactivo."),
            };
          }
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
