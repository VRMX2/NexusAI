
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, MoreVertical, Clock, X, Loader2 } from 'lucide-react';
import { db } from '../lib/supabase';
import { Project } from '../types';

const Projects: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await db.projects.list();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const proj = await db.projects.create(newProjectName);
      setProjects([proj, ...projects]);
      setNewProjectName('');
      setShowCreateModal(false);
      navigate(`/chat/${proj.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold text-slate-900">Your Projects</h1><p className="text-slate-500">Manage your AI workflows.</p></div>
        <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Create Project</button>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" />
      </div>
      {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(proj => (
            <div key={proj.id} onClick={() => navigate(`/chat/${proj.id}`)} className="bg-white border border-slate-200 p-5 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-lg flex items-center justify-center transition-colors"><FolderKanban className="w-5 h-5" /></div>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">{proj.name}</h3>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Clock className="w-3.5 h-3.5" /> {new Date(proj.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold">New Project</h3><button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input autoFocus type="text" required placeholder="Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
              <div className="flex gap-3"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
