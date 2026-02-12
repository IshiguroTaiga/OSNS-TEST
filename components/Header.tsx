
import React from 'react';
import { College } from '../types';
import { COLLEGES } from '../constants';

interface HeaderProps {
  userCollege: College;
  onCollegeChange: (college: College) => void;
  onOpenSettings: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  userCollege, 
  onCollegeChange, 
  onOpenSettings,
  isDark,
  toggleTheme
}) => {
  return (
    <header className={`${isDark ? 'bg-mmsu-darkGreen' : 'bg-mmsu-green'} text-white sticky top-0 z-50 shadow-lg border-b border-mmsu-gold/30`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green font-bold text-2xl shadow-inner border-2 border-white/20">
            <i className="fas fa-horse"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight leading-none uppercase">MMSU Stallion</h1>
            <p className="text-[10px] text-mmsu-gold uppercase tracking-[0.2em] font-bold">Academic Companion</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <label className="text-[10px] text-mmsu-gold uppercase font-bold block mb-1">Select College</label>
            <select 
              value={userCollege}
              onChange={(e) => onCollegeChange(e.target.value as College)}
              className={`text-xs p-2 rounded-lg border-none focus:ring-2 focus:ring-mmsu-gold w-full transition-colors ${
                isDark ? 'bg-black/40 text-white' : 'bg-white/10 text-white'
              }`}
            >
              {COLLEGES.map(c => (
                <option key={c} value={c} className="text-gray-900">{c}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-90"
              title="Toggle Theme"
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                onOpenSettings();
              }}
              className="relative z-[60] w-10 h-10 rounded-full border-2 border-mmsu-gold/50 hover:border-mmsu-gold transition-all flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 cursor-pointer pointer-events-auto"
              title="Student Profile"
            >
              <i className="fas fa-user text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
