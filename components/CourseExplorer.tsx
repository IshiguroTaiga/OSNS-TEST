
import React, { useState } from 'react';
import { MOCK_COURSES } from '../constants';
import { College } from '../types';

interface CourseExplorerProps {
  selectedCollege: College;
}

export const CourseExplorer: React.FC<CourseExplorerProps> = ({ selectedCollege }) => {
  const [search, setSearch] = useState('');

  const filteredCourses = MOCK_COURSES.filter(course => {
    const matchesCollege = course.college === selectedCollege;
    const matchesSearch = course.code.toLowerCase().includes(search.toLowerCase()) || 
                          course.title.toLowerCase().includes(search.toLowerCase());
    return matchesCollege && matchesSearch;
  });

  const handlePortalRedirect = () => {
    window.open('https://mys.mmsu.edu.ph/v2/profile/prospectus', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black">Course Catalog</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Browsing: {selectedCollege}</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search catalog code or title..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-mmsu-green text-sm transition-all text-gray-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:border-mmsu-gold transition-all group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-mmsu-gold/10 text-mmsu-green dark:text-mmsu-gold text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-mmsu-gold/20">
                {course.code}
              </span>
              <div className="flex items-center space-x-1 text-gray-400">
                <i className="fas fa-layer-group text-[10px]"></i>
                <span className="text-[10px] font-bold uppercase">{course.credits} Credits</span>
              </div>
            </div>
            
            <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3 group-hover:text-mmsu-green dark:group-hover:text-mmsu-gold transition-colors">
              {course.title}
            </h4>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-6 flex-1 italic">
              "{course.description}"
            </p>
            
            <div className="pt-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate max-w-[150px]">
                Active Syllabus
              </span>
              <button className="bg-gray-50 dark:bg-gray-900 text-mmsu-green dark:text-mmsu-gold p-2 rounded-xl text-xs font-black hover:bg-mmsu-gold hover:text-mmsu-green transition-all shadow-sm">
                View Full Info
              </button>
            </div>
          </div>
        ))}

        {/* Portal Redirect Card */}
        <div 
          onClick={handlePortalRedirect}
          className="bg-mmsu-gold/5 dark:bg-mmsu-gold/10 p-6 rounded-3xl border-2 border-dashed border-mmsu-gold/30 hover:border-mmsu-gold hover:bg-mmsu-gold/10 transition-all group flex flex-col justify-center items-center text-center cursor-pointer min-h-[250px]"
        >
          <div className="w-16 h-16 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <i className="fas fa-external-link-alt text-2xl"></i>
          </div>
          <h4 className="font-black text-lg text-mmsu-green dark:text-mmsu-gold mb-2">Missing something?</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
            If a course isn't listed here, you can check your official Prospectus on the Student Portal.
          </p>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-mmsu-gold text-mmsu-green px-4 py-2 rounded-full shadow-md group-hover:shadow-lg transition-all">
            Open Student Portal
          </span>
        </div>

        {filteredCourses.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <i className="fas fa-book-open text-4xl"></i>
            </div>
            <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white">No Results Found</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">Try searching for a different keyword or check if you've selected the correct college department.</p>
            <button 
              onClick={handlePortalRedirect}
              className="bg-mmsu-green text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-mmsu-darkGreen transition-all shadow-lg shadow-mmsu-green/20"
            >
              Check Student Portal instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
