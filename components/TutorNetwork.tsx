
import React from 'react';
import { College } from '../types';

interface TutorNetworkProps {
  selectedCollege: College;
  onStartAiTutor: () => void;
  isDark: boolean;
}

export const TutorNetwork: React.FC<TutorNetworkProps> = ({ selectedCollege, onStartAiTutor, isDark }) => {
  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      {/* Primary AI Tutor Hero */}
      <div className={`p-8 md:p-16 rounded-[3.5rem] border-2 transition-all relative overflow-hidden group shadow-2xl ${
        isDark ? 'bg-mmsu-darkGreen border-mmsu-gold/30' : 'bg-gradient-to-br from-mmsu-green to-mmsu-darkGreen border-mmsu-gold/20 text-white'
      }`}>
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="w-28 h-28 md:w-36 md:h-36 bg-mmsu-gold rounded-[2.5rem] flex items-center justify-center text-mmsu-green shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <i className="fas fa-robot text-5xl md:text-6xl"></i>
          </div>
          
          <div className="space-y-4">
            <div className="inline-block bg-mmsu-gold text-mmsu-green px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.25em] shadow-lg">
              Next-Gen Learning
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">AI Stallion Tutor</h2>
            <p className="text-base md:text-xl text-mmsu-gold font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
              Experience specialized academic assistance powered by Gemini. Grounded in <span className="underline decoration-white underline-offset-4">{selectedCollege}</span> specific knowledge and university-wide data.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
            <button 
              onClick={onStartAiTutor}
              className="bg-white text-mmsu-green px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-mmsu-gold transition-all shadow-2xl shadow-black/30 hover:scale-105 active:scale-95"
            >
              Enter AI Tutor Room <i className="fas fa-bolt ml-2 text-mmsu-gold group-hover:text-mmsu-green transition-colors"></i>
            </button>
          </div>
        </div>
        
        {/* Background Decorative Icons */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <i className="fas fa-brain text-[18rem] transform translate-x-1/4 -translate-y-1/4"></i>
        </div>
        <div className="absolute bottom-0 left-0 p-8 opacity-5 pointer-events-none">
          <i className="fas fa-atom text-[12rem] transform -translate-x-1/4 translate-y-1/4"></i>
        </div>
      </div>

      {/* Feature Grid for AI Tutor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2.5rem] border transition-all ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
            <i className="fas fa-search-plus text-xl"></i>
          </div>
          <h4 className={`font-black text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Grounded Search</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Unlike generic AI, Stallion Tutor verifies facts using real-time Google search grounding for up-to-date university policies.
          </p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border transition-all ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
            <i className="fas fa-graduation-cap text-xl"></i>
          </div>
          <h4 className={`font-black text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>College Focused</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            The tutor adapts its explanations based on your selected department's specific curriculum and academic requirements.
          </p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border transition-all ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="w-12 h-12 bg-mmsu-gold/20 text-mmsu-green dark:text-mmsu-gold rounded-xl flex items-center justify-center mb-6">
            <i className="fas fa-clock text-xl"></i>
          </div>
          <h4 className={`font-black text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>24/7 Availability</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Get instant help with complex concepts or assignment guidance any time of the day, even during the holiday breaks.
          </p>
        </div>
      </div>

      <div className={`p-10 rounded-[3rem] text-center border-2 border-dashed ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="max-w-xl mx-auto space-y-4">
          <i className="fas fa-shield-alt text-3xl text-mmsu-green dark:text-mmsu-gold opacity-50"></i>
          <h5 className={`font-black text-lg uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-800'}`}>Academic Integrity</h5>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            The Stallion AI Tutor is designed to assist and explain, not to complete your work. Use it to deepen your understanding and clarify difficult topics in your {selectedCollege} courses.
          </p>
        </div>
      </div>
    </div>
  );
};
