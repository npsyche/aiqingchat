import React from 'react';
import { Author } from '../types';

interface UserListProps {
  title: string;
  users: Author[];
  onBack: () => void;
  onUserClick: (id: string) => void;
}

const UserList: React.FC<UserListProps> = ({ title, users, onBack, onUserClick }) => {
  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-slate-100 font-sans animate-fadeIn">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-[#1a1a2e]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 text-white/90 hover:text-white transition rounded-full hover:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-lg font-bold tracking-wide ml-2">{title}</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {users.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-2">
             <div className="bg-white/5 p-4 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             </div>
             <p className="text-sm">暂无用户</p>
           </div>
        ) : (
          users.map((user) => (
            <div 
              key={user.id}
              onClick={() => onUserClick(user.id)}
              className="flex items-center gap-4 p-4 glass-panel rounded-2xl cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${user.avatar}/150/150`} 
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-1">{user.description}</p>
              </div>

              {/* Follow Button (Mock) */}
              <button className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium text-gray-300 hover:bg-white/20">
                 查看
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;
