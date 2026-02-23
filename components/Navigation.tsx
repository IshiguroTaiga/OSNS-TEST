import React from 'react';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: 'fas fa-home', label: 'Home' },
    { id: 'chat', icon: 'fas fa-comments', label: 'AI Chat' },
    { id: 'courses', icon: 'fas fa-book', label: 'Catalog' },
    { id: 'tutors', icon: 'fas fa-user-graduate', label: 'AI Tutor' },
    { id: 'files', icon: 'fas fa-folder-open', label: 'Vault' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-2 shadow-sm">
      <div className="flex flex-wrap items-center justify-around md:justify-start md:space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-3 py-3 px-6 rounded-2xl transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-mmsu-green text-white dark:bg-mmsu-gold dark:text-mmsu-green font-bold shadow-lg shadow-mmsu-green/20 dark:shadow-mmsu-gold/10' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <i className={`${tab.icon} text-sm`}></i>
            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};