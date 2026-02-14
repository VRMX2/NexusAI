
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  CreditCard, 
  LogOut, 
  Plus, 
  User as UserIcon,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Loader2,
  Palette,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

import { supabase, db } from './lib/supabase';
import { User, Profile } from './types';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Chat from './pages/Chat';
import SettingsPage from './pages/Settings';
import Billing from './pages/Billing';
import Login from './pages/Login';
import Register from './pages/Register';
import { MediaLab } from './pages/MediaLab';

const MainLayout: React.FC<{ children: React.ReactNode, user: any, onLogout: () => void }> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      db.profiles.get(user.id).then(setProfile).catch(console.error);
    }
  }, [user]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Projects', icon: FolderKanban, path: '/projects' },
    { name: 'Media Lab', icon: Palette, path: '/media-lab' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Billing', icon: CreditCard, path: '/billing' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">NexusAI</h1>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <img src={profile?.avatar_url || `https://picsum.photos/seed/${user.id}/200`} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{profile?.full_name || user.email}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Sign Out">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Sparkles className="text-white w-5 h-5" /></div>
            <span className="font-bold">NexusAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:text-slate-900"><Menu className="w-6 h-6" /></button>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const user = session?.user;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={user ? <MainLayout user={user} onLogout={handleLogout}><Dashboard user={user} /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/projects" element={user ? <MainLayout user={user} onLogout={handleLogout}><Projects user={user} /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/media-lab" element={user ? <MainLayout user={user} onLogout={handleLogout}><MediaLab /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/chat/:projectId" element={user ? <MainLayout user={user} onLogout={handleLogout}><Chat user={user} /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <MainLayout user={user} onLogout={handleLogout}><SettingsPage user={user} /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/billing" element={user ? <MainLayout user={user} onLogout={handleLogout}><Billing user={user} /></MainLayout> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
