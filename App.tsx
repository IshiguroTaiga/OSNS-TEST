
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation } from './components/Navigation.tsx';
import { Home } from './components/Home.tsx';
import { AIChat } from './components/AIChat.tsx';
import { CourseExplorer } from './components/CourseExplorer.tsx';
import { TutorNetwork } from './components/TutorNetwork.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { UserProfile, College, ChatMode } from './types.ts';

type Tab = 'chat' | 'courses' | 'tutors' | 'home';

const App: React.FC = () => {
  // PERSISTENCE LAYER
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_stallion_v3');
    return saved ? JSON.parse(saved) : {
      name: 'Stallion Guest',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      isLoggedIn: false,
      theme: 'light',
      studentId: ''
    };
  });

  // APPLICATION LAYER
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('mmsu_stallion_v3', JSON.stringify(user));
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user]);

  const handleUpdateUser = (updates: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...updates }));
  const toggleTheme = () => setUser(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));

  return (
    <div className={`min-h-screen flex flex-col pb-20 md:pb-0 transition-colors duration-300 ${
      user.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* PRESENTATION LAYER */}
      <Header 
        userCollege={user.college} 
        onCollegeChange={(c) => handleUpdateUser({ college: c })}
        onOpenSettings={() => setShowSettings(true)}
        isDark={user.theme === 'dark'}
        toggleTheme={toggleTheme}
      />
      
      <div className={`border-b sticky top-[72px] z-40 hidden md:block backdrop-blur-md ${
        user.theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'
      }`}>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'home' && (
          <Home 
            user={user} 
            onNavigateToChat={() => { setChatMode('GENERAL'); setActiveTab('chat'); }} 
          />
        )}
        {activeTab === 'chat' && (
          <AIChat 
            college={user.college} 
            studentId={user.studentId} 
            onUpdateStudentId={(id) => handleUpdateUser({ studentId: id })}
            isDark={user.theme === 'dark'}
            mode={chatMode}
            onModeChange={setChatMode}
          />
        )}
        {activeTab === 'courses' && <CourseExplorer selectedCollege={user.college} />}
        {activeTab === 'tutors' && (
          <TutorNetwork 
            selectedCollege={user.college} 
            onStartAiTutor={() => { setChatMode('TUTORING'); setActiveTab('chat'); }} 
            isDark={user.theme === 'dark'} 
          />
        )}
      </main>

      <div className="md:hidden">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {showSettings && (
        <SettingsModal 
          user={user} 
          onUpdate={handleUpdateUser} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
