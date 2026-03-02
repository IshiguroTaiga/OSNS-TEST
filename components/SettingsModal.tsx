
import React, { useState } from 'react';
import { UserProfile, College, Campus } from '../types';
import { COLLEGES } from '../constants';

interface SettingsModalProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onUpdate, onClose }) => {
  const [name, setName] = useState(user.name);
  const [studentId, setStudentId] = useState(user.studentId || '');
  const [college, setCollege] = useState<College>(user.college);
  const [campus, setCampus] = useState<Campus>(user.campus);

  const handleSave = () => {
    onUpdate({ name, studentId, college, campus });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn">
      <div className={`rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl overflow-hidden border ${
        user.theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black tracking-tight">Student Profile</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-500/10 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} font-bold focus:ring-2 focus:ring-mmsu-green outline-none transition-all`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Student Number (Format: YY-XXXXXX)</label>
            <input 
              type="text" 
              placeholder="e.g. 21-123456"
              value={studentId} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9-]/g, '');
                setStudentId(val);
              }}
              className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} font-black tracking-widest focus:ring-2 focus:ring-mmsu-green outline-none transition-all`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Campus</label>
              <select 
                value={campus} 
                onChange={(e) => setCampus(e.target.value as Campus)}
                className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} font-bold focus:ring-2 focus:ring-mmsu-green outline-none transition-all`}
              >
                <option value="Batac">Batac</option>
                <option value="Laoag">Laoag</option>
                <option value="Currimao">Currimao</option>
                <option value="Dingras">Dingras</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">College</label>
              <select 
                value={college} 
                onChange={(e) => setCollege(e.target.value as College)}
                className={`w-full p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} font-bold focus:ring-2 focus:ring-mmsu-green outline-none transition-all text-xs`}
              >
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <button 
            onClick={onClose}
            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${user.theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 bg-mmsu-green text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-mmsu-green/20 hover:bg-mmsu-darkGreen transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
