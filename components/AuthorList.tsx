import React from 'react';
import { Author } from '../types';

interface AuthorListProps {
  authors: Author[];
  onAuthorClick: (authorId: string) => void;
}

const AuthorList: React.FC<AuthorListProps> = ({ authors, onAuthorClick }) => {
  // Sort authors by popularity (followers + likes)
  const sortedAuthors = [...authors].sort((a, b) => 
    (b.followers + b.likes) - (a.followers + a.likes)
  );

  return (
    <div className="flex flex-col bg-transparent">
      <div className="p-4 border-b border-white/5 bg-[#1a1a2e]/80 sticky top-0 z-10 backdrop-blur-md pt-[calc(1rem+env(safe-area-inset-top))]">
        <h2 className="text-xl font-bold text-white tracking-wide">发现创作者</h2>
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        {sortedAuthors.map((author) => (
          <div 
            key={author.id}
            onClick={() => onAuthorClick(author.id)}
            className="flex items-center gap-4 p-4 glass-panel rounded-2xl cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98] shadow-lg"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img 
                src={`https://picsum.photos/seed/${author.avatar}/150/150`} 
                alt={author.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1a1a2e] shadow-sm">
                Lv.{(author.followers / 1000).toFixed(0)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate mb-1">{author.name}</h3>
              <p className="text-sm text-gray-400 line-clamp-1 mb-2">{author.description}</p>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {formatNumber(author.likes)} 获赞
                </span>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {formatNumber(author.followers)} 粉丝
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-gray-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        ))}

        <div className="text-center text-gray-500 text-xs py-4">
          — 更多星级创作者正在加入 —
        </div>
      </div>
    </div>
  );
};

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num;
};

export default AuthorList;