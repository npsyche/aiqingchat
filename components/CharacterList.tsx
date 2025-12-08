
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Character, Author } from '../types';

interface CharacterListProps {
  characters: Character[];
  authors: Author[];
  currentUserId: string;
  favoriteIds: Set<string>;
  onSelect: (character: Character) => void;
  onAuthorClick: (authorId: string) => void;
  onToggleFavorite: (charId: string) => void;
  onDelete?: (charId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const CharacterList: React.FC<CharacterListProps> = ({ 
    characters, 
    authors, 
    currentUserId, 
    favoriteIds,
    onSelect, 
    onAuthorClick,
    onToggleFavorite,
    onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'HOT' | 'NEW'>('HOT');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filters change
  useEffect(() => {
      setPage(1);
      window.scrollTo(0, 0);
  }, [activeTab, genderFilter, searchQuery]);

  // Filter logic
  const filteredCharacters = useMemo(() => {
    let filtered = characters.filter(c => {
        // Show if published OR if user is the author
        return c.isPublished || c.authorId === currentUserId;
    });

    // Search Filter
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.description.toLowerCase().includes(q) ||
            (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
        );
    }

    // Gender Filter
    if (genderFilter !== 'ALL') {
      filtered = filtered.filter(c => 
        genderFilter === 'MALE' ? c.gender === 'male' :
        genderFilter === 'FEMALE' ? c.gender === 'female' : true
      );
    }

    // Sort
    if (activeTab === 'HOT') {
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      filtered.sort((a, b) => (b.isCustom ? 1 : 0) - (a.isCustom ? 1 : 0));
    }

    return filtered;
  }, [characters, activeTab, genderFilter, currentUserId, searchQuery]);

  // Pagination Logic
  const displayedCharacters = useMemo(() => {
      return filteredCharacters.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredCharacters, page]);

  const hasMore = displayedCharacters.length < filteredCharacters.length;

  useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore) {
              // Add a small delay for smoother UX or simulate network
              setTimeout(() => {
                  setPage(prev => prev + 1);
              }, 300);
          }
      }, { threshold: 0.5, rootMargin: '100px' });

      if (loadMoreRef.current) {
          observer.observe(loadMoreRef.current);
      }

      return () => observer.disconnect();
  }, [hasMore, displayedCharacters.length]);

  const getAuthor = (authorId: string) => authors.find(a => a.id === authorId);

  return (
    <div className="flex flex-col bg-transparent">
      {/* Filters Header - Sticky to top (document level) */}
      <div className="sticky top-0 z-20 bg-[#1a1a2e]/80 backdrop-blur-md border-b border-white/5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        
        {/* Search Bar */}
        <div className="px-4 pt-3 pb-1">
            <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索角色、标签..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-9 text-sm text-white placeholder-gray-500 focus:bg-white/10 focus:border-pink-500/30 outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                )}
            </div>
        </div>

        <div className="flex items-center px-6 pt-2 gap-8 justify-center">
          <button 
            onClick={() => setActiveTab('HOT')}
            className={`pb-3 text-lg font-bold transition-all relative tracking-widest ${activeTab === 'HOT' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/40 hover:text-white/70'}`}
          >
            热门
            {activeTab === 'HOT' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]" />}
          </button>
          <button 
             onClick={() => setActiveTab('NEW')}
             className={`pb-3 text-lg font-bold transition-all relative tracking-widest ${activeTab === 'NEW' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/40 hover:text-white/70'}`}
          >
            最新
            {activeTab === 'NEW' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]" />}
          </button>
        </div>
        
        <div className="flex items-center justify-center px-4 py-4 gap-4 overflow-x-auto scrollbar-hide">
          <FilterPill label="全部" active={genderFilter === 'ALL'} onClick={() => setGenderFilter('ALL')} />
          <FilterPill label="女" active={genderFilter === 'FEMALE'} onClick={() => setGenderFilter('FEMALE')} />
          <FilterPill label="男" active={genderFilter === 'MALE'} onClick={() => setGenderFilter('MALE')} />
        </div>
      </div>

      {/* Grid Content */}
      <div className="px-4 pt-4 pb-4 min-h-screen">
        {filteredCharacters.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
               <p className="text-gray-400">没有找到相关角色</p>
           </div>
        ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Character Cards */}
            {displayedCharacters.map((char) => {
              const author = getAuthor(char.authorId);
              const cardImageSrc = char.backgroundImage || (char.backgroundImages && char.backgroundImages[0]) || char.avatar || `https://picsum.photos/seed/${char.avatarSeed}/400/600`;
              const isDraft = !char.isPublished;
              const isFav = favoriteIds.has(char.id);
              // const isOwner = char.authorId === currentUserId; // Removed ownership check for delete button
              
              // Gender Icon Logic
              let genderIcon = null;
              if (char.gender === 'male') {
                  genderIcon = <span title="男" className="ml-1.5 text-blue-400 text-sm align-middle opacity-90 font-sans shadow-black/50 drop-shadow-sm">♂</span>;
              } else if (char.gender === 'female') {
                  genderIcon = <span title="女" className="ml-1.5 text-pink-400 text-sm align-middle opacity-90 font-sans shadow-black/50 drop-shadow-sm">♀</span>;
              } else if (char.gender === 'other') {
                  genderIcon = <span title="无性别" className="ml-1.5 text-purple-400 text-lg align-middle leading-none opacity-90 font-sans shadow-black/50 drop-shadow-sm">⚥</span>;
              }

              return (
                <div
                  key={char.id}
                  className="relative rounded-2xl overflow-hidden bg-white/5 aspect-[2/3] group shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 hover:ring-pink-500/30"
                >
                  {/* Click area for character */}
                  <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => onSelect(char)}>
                    <img
                      src={cardImageSrc}
                      alt={char.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Actions (Top Right) */}
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                      {/* Favorite Button */}
                      <button 
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite(char.id); }}
                          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition hover:bg-black/60 active:scale-90"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "#ec4899" : "none"} stroke={isFav ? "#ec4899" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </button>
                  </div>

                  {/* Draft Badge */}
                  {isDraft && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur border border-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-10">
                          私密
                      </div>
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md translate-y-0 group-hover:-translate-y-0.5 transition-transform duration-300 font-serif tracking-wide flex items-center mb-1">
                        <span className="truncate">{char.name}</span>
                        {genderIcon}
                    </h3>

                    {/* Tags - Moved below name */}
                    {char.tags && char.tags.length > 0 && (
                        <div className="mt-0.5 mb-1">
                            <p className="text-[10px] text-pink-200/90 truncate opacity-90 font-medium">
                                {char.tags.map(t => `#${t}`).join('  ')}
                            </p>
                        </div>
                    )}

                    <p className="text-[10px] text-gray-300 line-clamp-1 mt-1 opacity-80 group-hover:text-pink-200 transition-colors">{char.description}</p>
                    
                    {/* Stats Row */}
                    <div className="flex items-center gap-3 mt-3 mb-2">
                      <div className="flex items-center gap-1 text-[10px] text-slate-200 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-red-500 drop-shadow-sm"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span className="font-bold">{formatNumber(char.likes || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-200 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400 drop-shadow-sm"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span className="font-bold">{formatNumber(char.chatCount || 0)}</span>
                      </div>
                    </div>

                    {/* Author Row */}
                    {author && (
                       <div 
                         className="flex items-center gap-1.5 pointer-events-auto cursor-pointer active:opacity-70 transition-opacity"
                         onClick={(e) => {
                           e.stopPropagation();
                           onAuthorClick(author.id);
                         }}
                       >
                          <img 
                            src={`https://picsum.photos/seed/${author.avatar}/50/50`} 
                            alt={author.name} 
                            className="w-4 h-4 rounded-full border border-white/30"
                          />
                          <span className="text-[10px] text-gray-400 hover:text-white truncate max-w-[80px]">by {author.name}</span>
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Loading / Sentinel */}
          <div ref={loadMoreRef} className="py-8 flex justify-center items-center h-20">
              {hasMore ? (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      正在加载更多...
                  </div>
              ) : (
                  <div className="text-gray-600 text-xs flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      已经到底啦
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  </div>
              )}
          </div>
        </>
        )}
      </div>
    </div>
  );
};

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-5 py-1.5 rounded-full text-xs font-bold transition-all border ${
      active 
        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-[0_0_12px_rgba(236,72,153,0.4)]' 
        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num;
};

export default CharacterList;
