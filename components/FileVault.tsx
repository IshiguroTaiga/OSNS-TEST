// import React, { useState, useEffect, useRef } from 'react';
// import { VaultFile } from '../types';

// interface FileVaultProps {
//   isDark: boolean;
// }

// export const FileVault: React.FC<FileVaultProps> = ({ isDark }) => {
//   const [files, setFiles] = useState<VaultFile[]>(() => {
//     const saved = localStorage.getItem('mmsu_stallion_vault');
//     return saved ? JSON.parse(saved) : [];
//   });
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     localStorage.setItem('mmsu_stallion_vault', JSON.stringify(files));
//   }, [files]);

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     // Fix: Explicitly cast the resulting array to File[] so TypeScript recognizes properties like 'type', 'name', and 'size'.
//     const uploadedFiles = Array.from(e.target.files || []) as File[];
//     const validFiles = uploadedFiles.filter(f => 
//       ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type)
//     );

//     if (validFiles.length < uploadedFiles.length) {
//       alert("Only documents (PDF, Word, TXT) are allowed.");
//     }

//     const newFiles = validFiles.map(f => ({
//       id: Math.random().toString(36).substr(2, 9),
//       name: f.name,
//       size: (f.size / 1024).toFixed(1) + ' KB',
//       type: f.type.split('/')[1].toUpperCase(),
//       date: new Date().toLocaleDateString()
//     }));

//     setFiles(prev => [...newFiles, ...prev]);
//     // Reset input value to allow re-uploading the same file
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   };

//   const deleteFile = (id: string) => {
//     setFiles(prev => prev.filter(f => f.id !== id));
//   };

//   return (
//     <div className="space-y-8 animate-fadeIn">
//       <div className="flex flex-col md:flex-row justify-between items-end gap-6">
//         <div>
//           <h2 className="text-3xl font-black dark:text-white">Digital Vault</h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personal Academic Storage</p>
//         </div>
//       </div>

//       <div 
//         onClick={() => fileInputRef.current?.click()}
//         className={`p-12 border-4 border-dashed rounded-[3rem] text-center cursor-pointer transition-all ${
//           isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-mmsu-green/20 bg-mmsu-green/5 hover:bg-mmsu-green/10'
//         }`}
//       >
//         <div className="w-20 h-20 bg-mmsu-gold rounded-full flex items-center justify-center text-mmsu-green mx-auto mb-4 shadow-xl">
//           <i className="fas fa-file-upload text-2xl"></i>
//         </div>
//         <h4 className="font-black text-xl dark:text-white">Upload Documents</h4>
//         <p className="text-xs text-slate-500 mt-2">Accepted: PDF, DOCX, TXT only</p>
//         <input 
//           type="file" 
//           ref={fileInputRef} 
//           onChange={handleFileUpload} 
//           className="hidden" 
//           accept=".pdf,.doc,.docx,.txt" 
//           multiple 
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {files.map(f => (
//           <div key={f.id} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-mmsu-gold transition-all group">
//             <div className="flex items-start justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-mmsu-green dark:text-mmsu-gold font-black text-[10px]">
//                   {f.type.includes('DOC') ? 'DOC' : f.type}
//                 </div>
//                 <div className="overflow-hidden">
//                   <h5 className="font-bold text-sm dark:text-white truncate max-w-[150px]">{f.name}</h5>
//                   <p className="text-[10px] text-slate-400 font-bold">{f.size} • {f.date}</p>
//                 </div>
//               </div>
//               <button onClick={() => deleteFile(f.id)} className="text-slate-300 hover:text-red-500 transition-colors">
//                 <i className="fas fa-times-circle"></i>
//               </button>
//             </div>
//             <div className="mt-6 flex gap-2">
//               <button className="flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Preview</button>
//               <button className="flex-1 py-2 rounded-xl bg-mmsu-green/10 text-mmsu-green dark:text-mmsu-gold text-[10px] font-black uppercase tracking-widest hover:bg-mmsu-green/20 transition-colors">Open</button>
//             </div>
//           </div>
//         ))}
//         {files.length === 0 && (
//           <div className="col-span-full py-16 text-center opacity-50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
//             <i className="fas fa-folder-open text-5xl mb-4 text-slate-300"></i>
//             <p className="text-sm font-bold dark:text-white">Your vault is empty</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
