import React, { useState, useEffect } from 'react';
import { UserProfile, Tab, ChatMode } from './types';
import { Header } from './Components/Header';
import { Navigation } from './Components/Navigation';
import { Home } from './Components/Home';
import { AIChat } from './Components/AIChat';
import { CourseExplorer } from './Components/CourseExplorer';
import { TutorNetwork } from './Components/TutorNetwork';
import { SettingsModal } from './Components/SettingsModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [chatMode, setChatMode] = useState<ChatMode>('GENERAL');
  const [showSettings, setShowSettings] = useState(false);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mmsu_stallion_user');
    return saved ? JSON.parse(saved) : {
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
    localStorage.setItem('mmsu_stallion_user', JSON.stringify(user));
    if (user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
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
            onUpdateStudentId={(id) => handleUpdateUser({ studentId: id })}
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
            onStartAiTutor={() => {
              setChatMode('TUTORING');
              setActiveTab('chat');
            }} 
            isDark={user.theme === 'dark'}
          />
        );
      default:
        return <Home user={user} onNavigateToChat={() => setActiveTab('chat')} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${user.theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header 
        userCollege={user.college} 
        onCollegeChange={(college) => handleUpdateUser({ college })}
        onOpenSettings={() => setShowSettings(true)}
        isDark={user.theme === 'dark'}
        toggleTheme={() => handleUpdateUser({ theme: user.theme === 'dark' ? 'light' : 'dark' })}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {renderContent()}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {showSettings && (
        <SettingsModal 
          user={user} 
          onUpdate={(updates) => handleUpdateUser(updates)} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default App;
