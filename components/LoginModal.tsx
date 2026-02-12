
import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (studentId: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose, isDark }) => {
  const [id, setId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // MMSU Student ID Format typically YY-XXXXXX
    const idRegex = /^\d{2}-\d{6}$/;
    if (!idRegex.test(id)) {
      setError('Please enter valid MMSU Student Number (Format: YY-XXXXXX)');
      return;
    }
    onLogin(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'
      }`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-mmsu-green rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-mmsu-green/20">
            <i className="fas fa-id-card text-2xl"></i>
          </div>
          <h3 className="text-2xl font-black mb-2">Tutoring Access</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please provide your official student number to unlock personalized academic tutoring.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Student Number</label>
            <input
              type="text"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setError('');
              }}
              placeholder="e.g. 21-123456"
              className={`w-full rounded-2xl p-4 text-center text-lg font-black tracking-widest border transition-all ${
                isDark ? 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-700' : 'bg-gray-50 border-gray-200 placeholder:text-gray-300'
              } ${error ? 'border-red-500 ring-2 ring-red-500/10' : 'focus:ring-2 focus:ring-mmsu-green focus:border-mmsu-green'}`}
              autoFocus
            />
            {error && <p className="text-red-600 dark:text-red-400 text-[10px] mt-2 font-bold uppercase text-center">{error}</p>}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                isDark ? 'bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-800' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-mmsu-green text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-mmsu-green/20 hover:bg-mmsu-darkGreen"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
