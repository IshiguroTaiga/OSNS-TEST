
import React from 'react';
import { MOCK_ANNOUNCEMENTS } from '../constants';
import { UserProfile } from '../types';

interface HomeProps {
  user: UserProfile;
  onNavigateToChat: () => void;
}

export const Home: React.FC<HomeProps> = ({ user, onNavigateToChat }) => {
  const isDark = user.theme === 'dark';

  const stallionTools = [
    { icon: 'fa-globe-asia', label: 'MMSU Official Site', desc: 'Main university web', color: 'bg-mmsu-green', url: 'https://www.mmsu.edu.ph/' },
    { icon: 'fa-receipt', label: 'Tuition Assessment', desc: '2nd Sem Balance', color: 'bg-emerald-600', url: 'https://my.mmsu.edu.ph/' },
    { icon: 'fa-graduation-cap', label: 'MVLE Learning', desc: 'Online Class Portal', color: 'bg-orange-600', url: 'https://mvle4.mmsu.edu.ph/my/' },
    { icon: 'fa-file-signature', label: 'Registrar Requests', desc: 'TOR, Certifications', color: 'bg-rose-600', url: 'https://registrar.mmsu.edu.ph/' },
  ];

  const handleToolClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`space-y-8 animate-fadeIn ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Welcome Banner */}
      <section className="stallion-gradient text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
            <span className="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
            <span className="text-mmsu-gold text-[10px] font-black uppercase tracking-widest">2nd Semester Portal Active</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Rise Higher, <span className="text-mmsu-gold block mt-1">Stallion {user.name.split(' ')[0] || 'Guest'}!</span>
          </h2>
          
          <p className="text-sm md:text-lg opacity-90 max-w-2xl font-medium leading-relaxed">
            You are viewing the specialized dashboard for the <br/>
            <span className="bg-white/10 px-2 py-0.5 rounded text-mmsu-gold font-bold">{user.college}</span>
          </p>
          
          <div className="flex flex-wrap gap-5 pt-4">
            <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl flex items-center space-x-4 border border-white/20 min-w-[160px]">
              <div className="w-12 h-12 bg-mmsu-gold rounded-xl flex items-center justify-center text-mmsu-green shadow-lg">
                <i className="fas fa-calendar-alt text-xl"></i>
              </div>
              <div>
                <p className="text-[10px] text-mmsu-gold font-bold uppercase tracking-tighter">Academic Year</p>
                <p className="text-sm font-bold text-white">2025 - 2026</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl flex items-center space-x-4 border border-white/20 min-w-[160px]">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-map-marker-alt text-xl"></i>
              </div>
              <div>
                <p className="text-[10px] text-mmsu-gold font-bold uppercase tracking-tighter">Campus Location</p>
                <p className="text-sm font-bold text-white">{user.campus}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <i className="fas fa-graduation-cap text-[15rem] transform -rotate-12 translate-x-20 -translate-y-10"></i>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black flex items-center">
              <span className="w-1.5 h-6 bg-mmsu-green dark:bg-mmsu-gold rounded-full mr-3"></span>
              Latest Bulletins
            </h3>
            <button type="button" className="text-mmsu-green dark:text-mmsu-gold text-xs font-black uppercase tracking-widest hover:underline transition-all">
              See All <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {MOCK_ANNOUNCEMENTS.map(ann => (
              <div 
                key={ann.id} 
                className="p-6 rounded-3xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                    ann.category === 'Scholarship' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                    ann.category === 'Enrollment' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                  }`}>
                    {ann.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{ann.date}</span>
                </div>
                <h4 className="font-bold text-lg mb-2 group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold transition-colors">
                  {ann.title}
                </h4>
                <p className="text-sm leading-relaxed line-clamp-2 text-gray-500 dark:text-gray-400">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black flex items-center px-2">
            <span className="w-1.5 h-6 bg-mmsu-gold rounded-full mr-3"></span>
            Stallion Tools
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {stallionTools.map(tool => (
              <button 
                key={tool.label} 
                type="button"
                onClick={(e) => handleToolClick(e, tool.url)}
                className="flex items-center p-5 rounded-2xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 transition-all hover:scale-[1.02] hover:border-mmsu-green dark:hover:border-mmsu-gold group text-left shadow-sm"
              >
                <div className={`${tool.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mr-5 shadow-lg shadow-gray-400/20 group-hover:rotate-6 transition-transform`}>
                  <i className={`fas ${tool.icon} text-lg`}></i>
                </div>
                <div className="pointer-events-none">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold">{tool.label}</h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mt-0.5">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-8 p-8 rounded-[2.5rem] border-2 border-dashed border-mmsu-gold/30 bg-mmsu-gold/5 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green shadow-lg">
              <i className="fas fa-robot text-2xl"></i>
            </div>
            <div>
              <h5 className="font-black text-sm uppercase tracking-wider text-mmsu-green dark:text-mmsu-gold">Need Help?</h5>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Chat with our Stallion AI</p>
            </div>
            <button 
              type="button"
              onClick={onNavigateToChat}
              className="bg-mmsu-green text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-mmsu-darkGreen transition-all w-full shadow-lg"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
