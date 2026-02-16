
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Home } from './components/Home';
import { AIChat } from './components/AIChat';
import { CourseExplorer } from './components/CourseExplorer';
import { TutorNetwork } from './components/TutorNetwork';
import { SettingsModal } from './components/SettingsModal';
import { UserProfile, College, ChatMode } from './types';

type Tab = 'home' | 'chat' | 'courses' | 'tutors';

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_stallion_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Stallion Guest',
      email: '',
      college: 'College of Computing and Information Sciences',
      campus: 'Batac',
      isLoggedIn: false,
      theme: 'dark',
      studentId: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('mmsu_stallion_profile', JSON.stringify(user));
    if (user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  const toggleTheme = () => {
    setUser(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home user={user} onNavigateToChat={() => setActiveTab('chat')} />;
      case 'chat':
        return (
          <AIChat 
            college={user.college} 
            studentId={user.studentId} 
            onUpdateStudentId={(id) => handleUpdateProfile({ studentId: id })}
            isDark={user.theme === 'dark'}
            mode={chatMode}
            onModeChange={setChatMode}
          />
        );
      case 'courses':
        return <CourseExplorer selectedCollege={user.college} />;
      case 'tutors':
        return (
          <TutorNetwork 
            selectedCollege={user.college} 
            isDark={user.theme === 'dark'}
            onStartAiTutor={() => {
              setChatMode('TUTORING');
              setActiveTab('chat');
            }} 
          />
        );
      default:
        return <Home user={user} onNavigateToChat={() => setActiveTab('chat')} />;
    }
  };

  return (
    <div className={`min-h-screen pb-20 md:pb-0 ${user.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header 
        userCollege={user.college} 
        onCollegeChange={(college) => handleUpdateProfile({ college })}
        onOpenSettings={() => setShowSettings(true)}
        isDark={user.theme === 'dark'}
        toggleTheme={toggleTheme}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Navigation activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as Tab)} />
        <div className="mt-8">
          {renderContent()}
        </div>
      </main>

      {showSettings && (
        <SettingsModal 
          user={user} 
          onUpdate={handleUpdateProfile} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
