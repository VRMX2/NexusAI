
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, Plus, MessageSquare, Clock, ArrowUpRight, Zap, Star, ChevronRight, Sparkles } from 'lucide-react';
import { db } from '../lib/supabase';
import { Project, Subscription, SubscriptionPlan } from '../types';

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ totalProjects: 0, totalMessages: 0 });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projs = await db.projects.list();
        const sub = await db.subscriptions.get();
        setProjects(projs);
        setSubscription(sub);
        setStats({ totalProjects: projs.length, totalMessages: 0 }); // In real app, might want a dedicated count endpoint
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Clock className="w-8 h-8 text-slate-300 animate-pulse" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back!</h1><p className="text-slate-500 mt-1">Here's an overview of your AI projects.</p></div>
        <button onClick={() => navigate('/projects')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"><Plus className="w-4 h-4" /> New Project</button>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><FolderKanban className="w-5 h-5" /></div><span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span></div>
          <div className="mt-4"><h3 className="text-slate-500 text-sm font-medium">Total Projects</h3><p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalProjects}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5" /></div><span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Total</span></div>
          <div className="mt-4"><h3 className="text-slate-500 text-sm font-medium">Interactions</h3><p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalMessages}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3"><Star className="text-yellow-400 w-5 h-5 fill-yellow-400" /></div>
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Zap className="w-5 h-5" /></div></div>
          <div className="mt-4"><h3 className="text-slate-500 text-sm font-medium">Plan</h3><div className="flex items-center gap-2 mt-1"><p className="text-2xl font-bold text-slate-900 uppercase">{subscription?.plan === SubscriptionPlan.PRO ? 'Nexus Pro' : 'Starter'}</p></div></div>
          <Link to="/billing" className="mt-4 text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline">Manage Plan <ArrowUpRight className="w-3 h-3" /></Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Recent Projects</h2><Link to="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link></div>
        <div className="divide-y divide-slate-100">
          {projects.length > 0 ? projects.slice(0, 5).map(proj => (
            <div key={proj.id} onClick={() => navigate(`/chat/${proj.id}`)} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"><FolderKanban className="w-5 h-5" /></div><div><h4 className="font-semibold text-slate-900">{proj.name}</h4><p className="text-xs text-slate-500">Created {new Date(proj.created_at).toLocaleDateString()}</p></div></div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
            </div>
          )) : <div className="p-12 text-center text-slate-400">No projects yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
