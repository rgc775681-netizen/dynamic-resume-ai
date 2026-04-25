import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "recruiter" | "candidate" | null;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role;
  availableRoles: Role[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  setActiveRole: (r: Role) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, availableRoles: [], loading: true,
  signOut: async () => {}, refreshRole: async () => {}, setActiveRole: () => {},
});

const ACTIVE_ROLE_KEY = "talentai.activeRole";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const roles = (data || []).map((r: any) => r.role as Role);
    setAvailableRoles(roles);
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY) as Role | null;
    const picked = (stored && roles.includes(stored)) ? stored
      : roles.includes("recruiter" as Role) ? "recruiter"
      : roles[0] ?? null;
    setRole((picked as Role) ?? null);
    if (picked) localStorage.setItem(ACTIVE_ROLE_KEY, picked);
  };

  const setActiveRole = (r: Role) => {
    if (!r) return;
    localStorage.setItem(ACTIVE_ROLE_KEY, r);
    setRole(r);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchRole(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    await supabase.auth.signOut();
  };
  const refreshRole = async () => { if (user) await fetchRole(user.id); };

  return <Ctx.Provider value={{ user, session, role, availableRoles, loading, signOut, refreshRole, setActiveRole }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
