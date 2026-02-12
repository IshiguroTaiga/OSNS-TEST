
import React from 'react';
import { ChatMode } from '../types';

interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
}

const generalActions: QuickAction[] = [
  { label: 'Enrollment', prompt: 'What are the current enrollment dates and requirements for the first semester?', icon: '📝' },
  { label: 'Scholarships', prompt: 'What scholarship programs are available for MMSU students?', icon: '💰' },
  { label: 'Campus Map', prompt: 'Show me important landmarks and buildings at MMSU Batac Main Campus.', icon: '🗺️' },
];

const tutoringActions: QuickAction[] = [
  { label: 'Study Tips', prompt: 'Provide effective study techniques and time management tips for my major.', icon: '📚' },
  { label: 'Thesis Help', prompt: 'Explain the general research methodology guidelines for MMSU students.', icon: '✍️' },
  { label: 'Academic Policies', prompt: 'What are the rules regarding grading systems and scholastic delinquency at MMSU?', icon: '⚖️' },
];

export const QuickActions: React.FC<{ 
  onAction: (prompt: string) => void; 
  mode: ChatMode;
  isDark: boolean;
}> = ({ onAction, mode, isDark }) => {
  const actions = mode === 'TUTORING' ? tutoringActions : generalActions;
  
  return (
    <div className="flex flex-wrap gap-2 py-3 px-1">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onAction(action.prompt)}
          className={`flex items-center gap-2 border px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap ${
            isDark 
              ? 'bg-gray-800 border-gray-700 hover:border-mmsu-gold text-white' 
              : 'bg-white border-gray-100 hover:bg-mmsu-gold hover:text-mmsu-green'
          }`}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};
