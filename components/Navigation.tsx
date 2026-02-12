
import React from 'react';

type Tab = 'chat' | 'courses' | 'tutors' | 'home';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: 'fas fa-home', label: 'Home' },
    { id: 'chat', icon: 'fas fa-comments', label: 'AI Chat' },
    { id: 'courses', icon: 'fas fa-book', label: 'Courses' },
    { id: 'tutors', icon: 'fas fa-user-graduate', label: 'Tutors' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:relative md:border-t-0 md:bg-transparent">
      <div className="max-w-7xl mx-auto flex justify-around md:justify-start md:space-x-8 md:px-4 md:py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 py-3 px-4 transition-all duration-200 ${
              activeTab === tab.id 
                ? 'text-mmsu-green border-t-2 md:border-t-0 md:border-b-2 border-mmsu-green font-bold' 
                : 'text-gray-500 hover:text-mmsu-green'
            }`}
          >
            <i className={`${tab.icon} text-xl md:text-base`}></i>
            <span className="text-[10px] md:text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
