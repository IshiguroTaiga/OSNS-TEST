
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

// --- Constants ---
const COLLEGES = [
  'College of Agriculture, Food and Sustainable Development',
  'College of Aquatic Science and Applied Technology',
  'College of Arts and Sciences',
  'College of Business, Economics and Accountancy',
  'College of Computing and Information Sciences',
  'College of Engineering',
  'College of Health Sciences',
  'College of Industrial Technology',
  'College of Teacher Education',
  'College of Medicine',
  'College of Law'
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'Jan 12, 2026', content: 'Final week for adding/dropping subjects at the Registrar.', category: 'Enrollment' },
  { id: 'a2', title: 'Scholarship Renewal Notice', date: 'Jan 18, 2026', content: 'Submit grades to OSA for 2nd semester renewal.', category: 'Scholarship' },
  { id: 'a3', title: '48th Foundation Anniversary', date: 'Jan 20, 2026', content: 'Happy Foundation Day, Stallions! See you at the Sunken Garden.', category: 'Event' }
];

const MOCK_COURSES = [
  { code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', desc: 'Basic hardware and software concepts.' },
  { code: 'AGRI 101', title: 'Crop Science', college: 'College of Agriculture, Food and Sustainable Development', desc: 'Principles of plant production.' },
  { code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', desc: 'Study of living organisms.' }
];

// --- AI Service ---
async function fetchAIResponse(prompt, college, mode, studentId, history) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `
      You are the "MMSU Stallion AI Companion" for Mariano Marcos State University.
      Current Context: 2nd Semester AY 2025-2026. Today is Jan 20 (Foundation Day).
      User College: ${college}. Student ID: ${studentId || 'N/A'}.
      Mode: ${mode === 'TUTORING' ? 'Academic Tutoring' : 'General Assistant'}.
      Constraint: Strictly MMSU-related. Formal English. No asterisks.
    `;

    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7
      }
    });

    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(c => c.web).map(c => ({ title: c.web.title, uri: c.web.uri })) || [];

    return { text: response.text || "I couldn't process that.", links };
  } catch (e) {
    console.error(e);
    return { text: "Stallion Network Timeout. Please try again.", links: [] };
  }
}

// --- Components ---
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    name: 'Stallion Guest',
    college: 'College of Computing and Information Sciences',
    campus: 'Batac',
    theme: 'dark',
    studentId: ''
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState('GENERAL');
  const [showSettings, setShowSettings] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
  }, [user.theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fix: Added optional parameter 'customText' to handleSend to resolve "Expected 1 arguments, but got 0" errors on lines 234 and 238.
  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const result = await fetchAIResponse(text, user.college, chatMode, user.studentId, messages);
    setMessages(prev => [...prev, { role: 'assistant', content: result.text, links: result.links, id: Date.now() + 1 }]);
    setIsTyping(false);
  };

  return html`
    <div class="min-h-screen flex flex-col ${user.theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}">
      
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-mmsu-green text-white shadow-lg border-b border-mmsu-gold/30">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center space-x-3 cursor-pointer" onClick=${() => setActiveTab('home')}>
            <div class="w-12 h-12 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green text-2xl shadow-inner">
              <i class="fas fa-horse"></i>
            </div>
            <div>
              <h1 class="font-black text-xl leading-none uppercase tracking-tight">MMSU Stallion</h1>
              <p class="text-[10px] text-mmsu-gold uppercase tracking-[0.2em] font-bold">Companion</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button onClick=${() => setUser({ ...user, theme: user.theme === 'dark' ? 'light' : 'dark' })} class="p-2 hover:bg-white/10 rounded-xl">
              <i class="fas ${user.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
            </button>
            <button onClick=${() => setShowSettings(true)} class="w-10 h-10 rounded-full border border-mmsu-gold/50 flex items-center justify-center bg-white/10">
              <i class="fas fa-user"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 max-w-7xl mx-auto w-full p-6 pb-24">
        
        ${activeTab === 'home' && html`
          <div class="space-y-10 animate-fadeIn">
            <section class="bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen text-white p-10 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10">
              <div class="relative z-10 space-y-6">
                <div class="inline-flex items-center space-x-2 bg-mmsu-gold/20 px-4 py-1.5 rounded-full border border-mmsu-gold/30">
                  <span class="w-2 h-2 bg-mmsu-gold rounded-full animate-pulse"></span>
                  <span class="text-mmsu-gold text-xs font-bold uppercase tracking-wider">Jan 20, 2026 • Foundation Day</span>
                </div>
                <h2 class="text-4xl md:text-6xl font-black tracking-tight leading-tight">Rise Higher, <span class="text-mmsu-gold block">Stallion ${user.name.split(' ')[0]}!</span></h2>
                <p class="text-base opacity-90 max-w-2xl font-medium">Dashboard for <span class="text-mmsu-gold">${user.college}</span></p>
                <button onClick=${() => setActiveTab('chat')} class="bg-mmsu-gold text-mmsu-green px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Launch Assistant</button>
              </div>
              <i class="fas fa-graduation-cap absolute top-0 right-0 text-[18rem] opacity-5 -rotate-12 transform translate-x-20"></i>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div class="lg:col-span-2 space-y-6">
                <h3 class="text-xl font-black flex items-center"><span class="w-1.5 h-6 bg-mmsu-green rounded-full mr-3"></span> Bulletins</h3>
                <div class="grid gap-4">
                  ${MOCK_ANNOUNCEMENTS.map(ann => html`
                    <div key=${ann.id} class="p-6 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-mmsu-gold/10 text-mmsu-green font-bold uppercase">${ann.category}</span>
                        <span class="text-[10px] text-gray-400">${ann.date}</span>
                      </div>
                      <h4 class="font-bold mb-2">${ann.title}</h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">${ann.content}</p>
                    </div>
                  `)}
                </div>
              </div>
              <div class="space-y-6">
                <h3 class="text-xl font-black flex items-center"><span class="w-1.5 h-6 bg-mmsu-gold rounded-full mr-3"></span> Tools</h3>
                <div class="grid gap-4">
                  ${[
                    { icon: 'fa-globe-asia', label: 'Official Site', url: 'https://mmsu.edu.ph' },
                    { icon: 'fa-graduation-cap', label: 'MVLE Learning', url: 'https://mvle4.mmsu.edu.ph' },
                    { icon: 'fa-user-circle', label: 'Student Portal', url: 'https://mys.mmsu.edu.ph' },
                  ].map(tool => html`
                    <button key=${tool.label} onClick=${() => window.open(tool.url, '_blank')} class="flex items-center p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-mmsu-gold transition-all group">
                      <div class="w-12 h-12 bg-mmsu-green text-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                        <i class="fas ${tool.icon}"></i>
                      </div>
                      <span class="font-black text-sm uppercase tracking-widest">${tool.label}</span>
                    </button>
                  `)}
                </div>
              </div>
            </div>
          </div>
        `}

        ${activeTab === 'chat' && html`
          <div class="flex flex-col h-[calc(100vh-280px)] bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            <div class="px-8 py-5 flex items-center justify-between ${chatMode === 'TUTORING' ? 'bg-mmsu-gold text-mmsu-green' : 'bg-mmsu-green text-white'}">
              <div class="flex items-center space-x-3">
                <i class="fas ${chatMode === 'TUTORING' ? 'fa-user-graduate' : 'fa-robot'} text-xl"></i>
                <span class="font-black uppercase text-sm tracking-widest">${chatMode === 'TUTORING' ? 'Tutor Mode' : 'Assistant Mode'}</span>
              </div>
              <div class="flex bg-black/10 p-1 rounded-xl">
                <button onClick=${() => setChatMode('GENERAL')} class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${chatMode === 'GENERAL' ? 'bg-white text-mmsu-green' : 'text-white/70'}">General</button>
                <button onClick=${() => setChatMode('TUTORING')} class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${chatMode === 'TUTORING' ? 'bg-white text-mmsu-green' : 'text-white/70'}">Tutor</button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
              ${messages.map(m => html`
                <div key=${m.id} class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-[85%] space-y-2">
                    <div class="p-5 rounded-3xl ${m.role === 'user' ? 'bg-mmsu-green text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 rounded-tl-none border border-gray-100 dark:border-slate-700'}">
                      <p class="text-sm">${m.content}</p>
                      ${m.links && m.links.length > 0 && html`
                        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                          <div class="flex flex-wrap gap-2">
                            ${m.links.map((l, i) => html`
                              <a key=${i} href=${l.uri} target="_blank" class="text-[9px] bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-xl font-bold flex items-center gap-2 hover:bg-mmsu-gold transition-colors">
                                <i class="fas fa-link scale-75"></i> ${l.title}
                              </a>
                            `)}
                          </div>
                        </div>
                      `}
                    </div>
                  </div>
                </div>
              `)}
              ${isTyping && html`<div class="text-[10px] font-black uppercase opacity-40 animate-pulse">Thinking...</div>`}
              <div ref=${chatEndRef}></div>
            </div>
            <div class="p-8 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-4">
              <input 
                value=${input} 
                onChange=${(e) => setInput(e.target.value)}
                onKeyDown=${(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about MMSU..."
                class="flex-1 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-mmsu-green"
              />
              <button onClick=${() => handleSend()} class="w-14 h-14 bg-mmsu-green text-white rounded-2xl flex items-center justify-center shadow-xl">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        `}

        ${activeTab === 'courses' && html`
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            ${MOCK_COURSES.map(c => html`
              <div class="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-200 dark:border-gray-700 shadow-sm">
                <span class="text-[10px] font-black bg-mmsu-gold/20 text-mmsu-green px-3 py-1 rounded-full border border-mmsu-gold/30">${c.code}</span>
                <h4 class="font-bold text-xl mt-6">${c.title}</h4>
                <p class="text-sm text-gray-500 mt-4 italic">"${c.desc}"</p>
                <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                  <span>3 Units</span>
                  <span class="text-mmsu-green">Details <i class="fas fa-chevron-right ml-1"></i></span>
                </div>
              </div>
            `)}
          </div>
        `}

        ${activeTab === 'tutors' && html`
          <div class="max-w-4xl mx-auto p-12 md:p-24 bg-mmsu-darkGreen rounded-[4rem] text-center text-white space-y-10 animate-fadeIn">
            <i class="fas fa-user-graduate text-[8rem] text-mmsu-gold"></i>
            <h2 class="text-5xl font-black">Stallion Tutor Room</h2>
            <p class="text-lg text-mmsu-gold/80 max-w-xl mx-auto font-medium">Expert academic deep-dives grounded in MMSU curriculum data.</p>
            <button onClick=${() => { setChatMode('TUTORING'); setActiveTab('chat'); }} class="bg-white text-mmsu-green px-12 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl">Start Session</button>
          </div>
        `}
      </main>

      <!-- Navigation Dock -->
      <nav class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-2xl border border-gray-100 dark:border-slate-700 flex space-x-2 z-[60]">
        ${[
          { id: 'home', icon: 'fa-home', label: 'Home' },
          { id: 'chat', icon: 'fa-comments', label: 'Chat' },
          { id: 'courses', icon: 'fa-book', label: 'Catalog' },
          { id: 'tutors', icon: 'fa-user-graduate', label: 'Tutor' },
        ].map(t => html`
          <button 
            key=${t.id}
            onClick=${() => setActiveTab(t.id)}
            class="flex items-center space-x-3 px-6 py-3 rounded-full transition-all ${activeTab === t.id ? 'bg-mmsu-green text-white shadow-xl' : 'text-gray-400 hover:text-mmsu-green'}"
          >
            <i class="fas ${t.icon}"></i>
            <span class="text-[10px] font-black uppercase tracking-widest ${activeTab === t.id ? 'block' : 'hidden md:block'}">${t.label}</span>
          </button>
        `)}
      </nav>

      <!-- Settings Modal -->
      ${showSettings && html`
        <div class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div class="bg-white dark:bg-slate-900 p-10 rounded-[3rem] max-w-lg w-full border border-gray-100 dark:border-gray-800 shadow-2xl space-y-8 animate-fadeIn">
            <div class="flex justify-between items-center">
              <h3 class="text-2xl font-black tracking-tighter">Academic Profile</h3>
              <button onClick=${() => setShowSettings(false)} class="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><i class="fas fa-times"></i></button>
            </div>
            <div class="space-y-6">
              <input class="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold" value=${user.name} onChange=${e => setUser({ ...user, name: e.target.value })} placeholder="Full Name" />
              <select class="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold text-sm" value=${user.college} onChange=${e => setUser({ ...user, college: e.target.value })}>
                ${COLLEGES.map(c => html`<option key=${c} value=${c}>${c}</option>`)}
              </select>
            </div>
            <button onClick=${() => setShowSettings(false)} class="w-full bg-mmsu-green text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">Update Stallion Profile</button>
          </div>
        </div>
      `}
    </div>
  `;
};

const root = createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
