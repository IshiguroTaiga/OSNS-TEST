
import React, { useState, useRef, useEffect } from 'react';
import { Message, College, ChatMode } from '../types';
import { getAIResponse } from '../services/gemini';
import { QuickActions } from './QuickActions';
import { LoginModal } from './LoginModal';

interface AIChatProps {
  college: College;
  studentId?: string;
  onUpdateStudentId: (id: string) => void;
  isDark: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ college, studentId, onUpdateStudentId, isDark, mode, onModeChange }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: `Welcome, Stallion! 🐎 I am your specialized academic assistant for the **${college}**. \n\nHow can I help you with your studies, enrollment, or campus navigation today?`, 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!text) setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const result = await getAIResponse(messageText, college, mode, studentId, history);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.text,
      timestamp: new Date(),
      groundingLinks: result.links
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode === 'TUTORING' && !studentId) {
      setShowLogin(true);
    } else {
      onModeChange(newMode);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] md:h-[750px] bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
      {/* Chat Header */}
      <div className={`px-8 py-5 flex items-center justify-between shadow-lg relative z-10 transition-colors ${
        mode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3 ${
            mode === 'TUTORING' ? 'bg-mmsu-green text-white' : 'bg-mmsu-gold text-mmsu-green'
          }`}>
            <i className={`fas ${mode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-xl`}></i>
          </div>
          <div>
            <h3 className="font-black text-lg leading-none">
              {mode === 'TUTORING' ? 'Stallion Tutor' : 'Stallion Assistant'}
            </h3>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 flex items-center ${
              mode === 'TUTORING' ? 'text-mmsu-green/70' : 'text-mmsu-gold'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                mode === 'TUTORING' ? 'bg-mmsu-green' : 'bg-mmsu-gold'
              }`}></span> 
              {mode === 'TUTORING' ? 'Academic Tutoring Active' : 'Virtual Counselor Online'}
            </p>
          </div>
        </div>
        
        {/* Mode Toggles */}
        <div className="flex bg-black/10 p-1 rounded-2xl border border-white/20 backdrop-blur-md">
          <button 
            onClick={() => handleModeChange('GENERAL')}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'GENERAL' ? 'bg-white text-mmsu-green shadow-md' : 'text-white/70 hover:text-white'
            }`}
          >
            General
          </button>
          <button 
            onClick={() => handleModeChange('TUTORING')}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'TUTORING' ? 'bg-mmsu-green text-white shadow-md' : 'text-white/70 hover:text-white'
            }`}
          >
            Tutor
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[88%]`}>
              <div className={`px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-mmsu-green text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                
                {/* Grounding Links */}
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Verified Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingLinks.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:scale-105 transition-all border border-blue-100 dark:border-blue-900/50"
                        >
                          <i className="fas fa-external-link-alt text-[10px]"></i>
                          <span className="truncate max-w-[150px]">{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-black uppercase text-gray-400 mt-2 px-2 tracking-tighter">
                {msg.role === 'user' ? 'Stallion User' : (mode === 'TUTORING' ? 'MMSU Tutor' : 'MMSU Assistant')} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-[2rem] rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${mode === 'TUTORING' ? 'bg-mmsu-green' : 'bg-mmsu-gold'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce delay-100 ${mode === 'TUTORING' ? 'bg-mmsu-green' : 'bg-mmsu-gold'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce delay-200 ${mode === 'TUTORING' ? 'bg-mmsu-green' : 'bg-mmsu-gold'}`}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-visible">
        <div className="px-6 md:px-8 bg-white dark:bg-gray-800">
          <QuickActions onAction={handleSend} mode={mode} isDark={isDark} />
        </div>
        
        <div className="p-6 md:p-8 pt-2 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] p-2 pl-6 focus-within:ring-2 focus-within:ring-mmsu-green transition-all border border-gray-200 dark:border-gray-700 shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={mode === 'TUTORING' ? "Describe your study problem..." : "Ask about admissions, courses, or tips..."}
              className="flex-1 bg-transparent border-none py-3 text-sm focus:ring-0 placeholder:text-gray-400 font-medium text-gray-900 dark:text-white"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl group ${
                mode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green hover:bg-yellow-400' : 'bg-mmsu-green hover:bg-mmsu-darkGreen shadow-mmsu-green/20'
              }`}
            >
              <i className={`fas fa-paper-plane text-lg transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform`}></i>
            </button>
          </div>
          <div className="flex justify-between items-center mt-4 px-2">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              Grounded Response Engine • Active Verification
            </p>
            {studentId && mode === 'TUTORING' && (
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-mmsu-gold' : 'text-mmsu-green'}`}>
                Student ID: {studentId}
              </span>
            )}
          </div>
        </div>
      </div>

      {showLogin && (
        <LoginModal 
          onLogin={(id) => {
            onUpdateStudentId(id);
            onModeChange('TUTORING');
            setShowLogin(false);
          }}
          onClose={() => setShowLogin(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
