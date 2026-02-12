
import React from 'react';
import { MOCK_ANNOUNCEMENTS } from '../constants';
import { UserProfile } from '../types';

interface HomeProps {
  user: UserProfile;
  onNavigateToChat: () => void;
}

export const Home: React.FC<HomeProps> = ({ user, onNavigateToChat }) => {
  const isDark = user.theme === 'dark';
  const displayName = user.studentId || 'Guest';

  const stallionTools = [
    { icon: 'fa-user-graduate', label: 'Admission Portal', desc: 'Apply for SY 2026-2027', color: 'bg-indigo-600', url: 'https://pams.mmsu.edu.ph/' },
    { icon: 'fa-graduation-cap', label: 'MVLE Learning', desc: 'Online Class Portal', color: 'bg-orange-600', url: 'https://mvle4.mmsu.edu.ph/my/' },
    { icon: 'fa-hospital-user', label: 'Health Services', desc: 'Clinic & Wellness', color: 'bg-emerald-600', url: 'https://www.mmsu.edu.ph/' },
    { icon: 'fa-users', label: 'Student Affairs', desc: 'Orgs & Scholarships', color: 'bg-rose-600', url: 'https://www.mmsu.edu.ph/' },
    { icon: 'fa-globe-asia', label: 'University Site', desc: 'MMSU Main Web', color: 'bg-mmsu-green', url: 'https://www.mmsu.edu.ph/' }
  ];

  const handleToolClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`space-y-8 animate-fadeIn ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-mmsu-gold/20 px-4 py-1.5 rounded-full border border-mmsu-gold/30">
            <span className="text-mmsu-gold text-[10px] font-black uppercase tracking-widest">Academic Year 2025-2026</span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none opacity-90">Welcome,</h2>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-mmsu-gold">
              {displayName} Stallion!
            </h2>
          </div>
          
          <p className="text-sm opacity-80 font-medium max-w-lg">
            Serving the <span className="font-bold text-mmsu-gold">{user.college}</span> at the {user.campus} Campus.
          </p>
        </div>
        
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <i className="fas fa-horse-head text-[12rem] transform rotate-12"></i>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black flex items-center px-2">
            <span className="w-1.5 h-6 bg-mmsu-green rounded-full mr-3"></span>
            University Bulletins
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {MOCK_ANNOUNCEMENTS.slice(0, 4).map(ann => (
              <div key={ann.id} className={`p-6 rounded-3xl border transition-all hover:scale-[1.01] ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-3">
                   <span className="text-[9px] font-black uppercase bg-mmsu-gold/10 text-mmsu-green px-3 py-1 rounded-full border border-mmsu-gold/20">{ann.category}</span>
                   <span className="text-[10px] text-gray-400">{ann.date}</span>
                </div>
                <h4 className="font-bold text-base mb-2">{ann.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black flex items-center px-2">
            <span className="w-1.5 h-6 bg-mmsu-gold rounded-full mr-3"></span>
            Quick Access
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {stallionTools.map(tool => (
              <button 
                key={tool.label} 
                onClick={() => handleToolClick(tool.url)}
                className={`flex items-center p-4 rounded-2xl border transition-all text-left ${
                  isDark ? 'bg-gray-800/50 border-gray-700 hover:border-mmsu-gold' : 'bg-white border-gray-100 hover:border-mmsu-green shadow-sm'
                }`}
              >
                <div className={`${tool.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mr-4 shadow-md`}><i className={`fas ${tool.icon}`}></i></div>
                <div>
                  <h4 className="font-bold text-xs">{tool.label}</h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{tool.desc}</p>
                </div>
              </button>
            ))}
            <button 
              onClick={onNavigateToChat}
              className="w-full bg-mmsu-green text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 shadow-lg shadow-mmsu-green/20"
            >
              Consult Stallion AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
