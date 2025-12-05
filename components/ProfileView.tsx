
import React, { useState, useContext } from 'react';
import { Character, Author, UserPersona } from '../types';
import { DialogContext } from '../DialogContext';

interface ProfileViewProps {
  currentUser: Author;
  characters: Character[];
  myCharacters: Character[];
  favoriteIds: Set<string>;
  followingIds: Set<string>;
  authors: Author[];
  userPersonas: UserPersona[];
  onSelectCharacter: (char: Character) => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onDelete: (charId: string) => void;
  onToggleFavorite: (charId: string) => void;
  onAuthorClick: (authorId: string) => void;
  onEditProfile: () => void;
  onViewFollowers: () => void;
  onViewLikes: () => void;
  onSavePersona: (p: UserPersona) => void;
  onDeletePersona: (id: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
    currentUser, 
    characters,
    myCharacters, 
    favoriteIds,
    followingIds,
    authors,
    userPersonas,
    onSelectCharacter, 
    onSettingsClick, 
    onLogout,
    onDelete,
    onToggleFavorite,
    onAuthorClick,
    onEditProfile,
    onViewFollowers,
    onViewLikes,
    onSavePersona,
    onDeletePersona
}) => {
  const showDialog = useContext(DialogContext);
  const [subView, setSubView] = useState<'OVERVIEW' | 'WORKS' | 'FAVS' | 'FOLLOWING' | 'PERSONAS'>('OVERVIEW');
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null);
  const [personaName, setPersonaName] = useState('');
  const [personaDesc, setPersonaDesc] = useState('');

  // Filter favorite characters
  const favoriteCharacters = characters.filter(c => favoriteIds.has(c.id));
  
  // Filter followed authors
  const followedAuthors = authors.filter(a => followingIds.has(a.id));

  // Top 3 works for overview (Newest first)
  const latestWorks = [...myCharacters].reverse().slice(0, 2);
  
  const displayAvatar = currentUser.avatar.startsWith('data:') 
    ? currentUser.avatar 
    : `https://picsum.photos/seed/${currentUser.avatar}/200/200`;

  const coverSrc = currentUser.avatar.startsWith('data:')
    ? currentUser.avatar
    : `https://picsum.photos/seed/${currentUser.avatar}cover/800/400`;

  const handleEditPersonaClick = (p: UserPersona) => {
      setEditingPersona(p);
      setPersonaName(p.name);
      setPersonaDesc(p.description);
      setSubView('PERSONAS'); // Ensure we are in view
  };

  const handleCreatePersonaClick = () => {
      if (userPersonas.length >= 5) {
          showDialog({ type: 'alert', message: "最多只能创建 5 个身份设定" });
          return;
      }
      setEditingPersona({ id: '', name: '', description: '' });
      setPersonaName('');
      setPersonaDesc('');
      setSubView('PERSONAS');
  };

  const handleSavePersonaForm = () => {
      if (!personaName.trim()) {
          showDialog({ type: 'alert', message: "请填写身份名称" });
          return;
      }
      if (personaDesc.length > 1000) {
          showDialog({ type: 'alert', message: "描述不能超过 1000 字" });
          return;
      }
      
      const newPersona: UserPersona = {
          id: editingPersona?.id || crypto.randomUUID(),
          name: personaName.trim(),
          description: personaDesc.trim()
      };
      
      onSavePersona(newPersona);
      setEditingPersona(null);
  };

  const handleDeletePersonaClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      showDialog({
          type: 'confirm',
          message: '确定删除这个身份设定吗？',
          onConfirm: () => onDeletePersona(id)
      });
  };

  const renderCharacterCard = (char: Character, isOwner: boolean) => {
      const avatarSrc = char.avatar || `https://picsum.photos/seed/${char.avatarSeed}/400/600`;
      const isFav = favoriteIds.has(char.id);
      
      // Gender Icon
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
          className="relative rounded-2xl overflow-hidden bg-white/5 aspect-[2/3] group shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
          onClick={() => onSelectCharacter(char)}
        >
          <img
            src={avatarSrc}
            alt={char.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/30 to-transparent opacity-90 group-hover:opacity-100" />
          
          {/* Actions */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
              <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(char.id); }}
                  className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition hover:bg-black/60 active:scale-90"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isFav ? "#ec4899" : "none"} stroke={isFav ? "#ec4899" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
              {isOwner && (
                  <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(char.id); }}
                      className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition hover:bg-red-900/60 active:scale-90 text-gray-300 hover:text-red-400"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
              )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
            <h3 className="text-sm font-bold text-white leading-tight drop-shadow-md font-serif tracking-wide flex items-center">
                <span className="truncate">{char.name}</span>
                {genderIcon}
            </h3>
            
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-200 bg-white/10 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span className="font-bold">{formatNumber(char.likes || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      );
  };

  const renderHeader = () => (
      <>
        {/* Header Image */}
        <div className="h-48 bg-gradient-to-r from-indigo-900 to-purple-900 relative shrink-0">
            <img 
                src={coverSrc} 
                className="w-full h-full object-cover opacity-60 blur-[2px]" 
                alt="cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a2e]"></div>
        </div>
        
        {/* Profile Info */}
        <div className="px-6 -mt-12 relative z-10">
            <div className="flex justify-between items-end">
                <div className="w-24 h-24 rounded-full bg-[#1a1a2e] p-1 shadow-2xl">
                    <img src={displayAvatar} alt="User" className="w-full h-full object-cover rounded-full border-2 border-white/20" />
                </div>
                <button 
                    onClick={onEditProfile}
                    className="glass-panel hover:bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold transition shadow-lg active:scale-95 border border-white/10"
                >
                    编辑资料
                </button>
            </div>
            
            <div className="mt-3">
                <h2 className="text-2xl font-bold text-white tracking-wide">{currentUser.name}</h2>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{currentUser.description || "暂无签名"}</p>
            </div>
        </div>
      </>
  );

  // Sub-View Layouts
  if (subView !== 'OVERVIEW') {
      let title = '';
      let content = null;

      if (subView === 'PERSONAS') {
          title = '我的身份';
          content = editingPersona ? (
              <div className="p-4 space-y-4 animate-fadeIn">
                  <div>
                      <label className="text-xs text-purple-300 font-bold mb-1 block">身份名称</label>
                      <input 
                         value={personaName} 
                         onChange={e => setPersonaName(e.target.value)} 
                         className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500/50 outline-none"
                         placeholder="例如：旅行者、指挥官..."
                      />
                  </div>
                  <div>
                      <div className="flex justify-between">
                          <label className="text-xs text-purple-300 font-bold mb-1 block">身份详情设定</label>
                          <span className={`text-xs ${personaDesc.length > 1000 ? 'text-red-400' : 'text-gray-500'}`}>{personaDesc.length}/1000</span>
                      </div>
                      <textarea 
                         value={personaDesc} 
                         onChange={e => setPersonaDesc(e.target.value)} 
                         className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500/50 outline-none resize-none"
                         placeholder="在此描述你的身份背景、性格、能力或与角色的特殊关系..."
                      />
                  </div>
                  <div className="flex gap-3 pt-2">
                      <button onClick={() => setEditingPersona(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold text-sm">取消</button>
                      <button onClick={handleSavePersonaForm} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm shadow-lg">保存设定</button>
                  </div>
              </div>
          ) : (
             <div className="flex flex-col gap-3 p-4">
                 <button 
                    onClick={handleCreatePersonaClick}
                    className="w-full py-4 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-pink-500/50 hover:bg-white/5 transition mb-2"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                     新建身份设定 ({userPersonas.length}/5)
                 </button>
                 
                 {userPersonas.map(p => (
                     <div key={p.id} className="glass-panel p-4 rounded-xl group relative hover:bg-white/10 transition" onClick={() => handleEditPersonaClick(p)}>
                         <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-pink-300">{p.name}</h4>
                             <button onClick={(e) => handleDeletePersonaClick(p.id, e)} className="text-gray-500 hover:text-red-400 p-1">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                             </button>
                         </div>
                         <p className="text-sm text-gray-300 line-clamp-2">{p.description}</p>
                     </div>
                 ))}
                 
                 {userPersonas.length === 0 && <EmptyState text="暂无身份设定，去创建一个吧！" />}
             </div>
          );
      } else if (subView === 'WORKS') {
          title = '我的作品';
          content = (
             <div className="grid grid-cols-2 gap-4 p-4">
                 {[...myCharacters].reverse().map(char => renderCharacterCard(char, true))}
                 {myCharacters.length === 0 && <EmptyState text="暂无作品" />}
             </div>
          );
      } else if (subView === 'FAVS') {
          title = '我的收藏';
          content = (
             <div className="grid grid-cols-2 gap-4 p-4">
                 {favoriteCharacters.map(char => renderCharacterCard(char, false))}
                 {favoriteCharacters.length === 0 && <EmptyState text="暂无收藏" />}
             </div>
          );
      } else if (subView === 'FOLLOWING') {
          title = '我的关注';
          content = (
            <div className="flex flex-col gap-3 p-4">
               {followedAuthors.map(author => (
                  <div 
                     key={author.id}
                     onClick={() => onAuthorClick(author.id)}
                     className="flex items-center gap-4 p-3 glass-panel rounded-xl cursor-pointer hover:bg-white/10 transition"
                  >
                     <img 
                        src={`https://picsum.photos/seed/${author.avatar}/100/100`} 
                        className="w-12 h-12 rounded-full border border-white/20"
                        alt={author.name}
                     />
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{author.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{author.description}</p>
                     </div>
                     <button className="text-xs px-3 py-1 bg-white/10 rounded-full text-gray-300">
                        已关注
                     </button>
                  </div>
               ))}
               {followedAuthors.length === 0 && <EmptyState text="暂无关注" />}
            </div>
          );
      }

      return (
          <div className="flex flex-col h-full bg-[#1a1a2e] text-slate-100 font-sans animate-fadeIn">
              <div className="flex items-center px-4 py-4 bg-[#1a1a2e]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 pt-[calc(1rem+env(safe-area-inset-top))]">
                <button 
                  onClick={() => setSubView('OVERVIEW')} 
                  className="p-2 -ml-2 text-white/90 hover:text-white transition rounded-full hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2 className="text-lg font-bold tracking-wide ml-2">{title}</h2>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {content}
              </div>
          </div>
      );
  }

  // Overview Layout
  return (
    <div className="flex flex-col bg-transparent relative scrollbar-hide pb-20">
      {renderHeader()}

      {/* Unified Stats Row */}
      <div className="flex justify-between items-center px-6 py-6 mt-2 border-b border-white/5 mx-2">
         <StatItem label="作品" count={myCharacters.length} onClick={() => setSubView('WORKS')} />
         <StatItem label="关注" count={followingIds.size} onClick={() => setSubView('FOLLOWING')} />
         <StatItem label="粉丝" count={currentUser.followers} onClick={onViewFollowers} />
         <StatItem label="获赞" count={currentUser.likes} onClick={onViewLikes} />
         <StatItem label="收藏" count={favoriteIds.size} onClick={() => setSubView('FAVS')} />
      </div>

      {/* Latest Works Section */}
      <div className="px-4 mt-6">
         <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="text-base font-bold text-white flex items-center gap-2">
                 最新作品
                 <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">{myCharacters.length}</span>
             </h3>
             <button 
                onClick={() => setSubView('WORKS')} 
                className="text-xs text-gray-400 hover:text-white flex items-center gap-0.5 transition-colors"
             >
                查看全部
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
             </button>
         </div>
         
         {latestWorks.length > 0 ? (
             <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                 {latestWorks.map(char => renderCharacterCard(char, true))}
             </div>
         ) : (
             <div className="bg-white/5 rounded-xl p-8 text-center border border-dashed border-white/10">
                 <p className="text-xs text-gray-500 mb-2">还未创造任何角色</p>
                 <button onClick={() => { /* Ideally navigate to create, but we are in profile view */ }} className="text-xs text-pink-400 font-bold">去创造</button>
             </div>
         )}
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-8 space-y-2">
        <MenuItem 
          onClick={() => setSubView('PERSONAS')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} 
          label="我的身份设定" 
          highlight={true}
        />
        <MenuItem 
          onClick={onSettingsClick}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} 
          label="设置" 
        />
        <MenuItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} label="帮助与支持" />
        
        <MenuItem 
          onClick={onLogout}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} 
          label="退出登录" 
          textClassName="text-red-400 group-hover:text-red-300"
        />
      </div>

      {/* VIP Banner */}
       <div className="mx-4 mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-700/10 border border-amber-500/20 flex justify-between items-center shadow-lg mb-8">
         <div>
           <h3 className="font-bold text-amber-300 flex items-center gap-1 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              升级 VIP
           </h3>
           <p className="text-[10px] text-amber-500/80 mt-1">解锁无限对话次数 & 专属模型</p>
         </div>
         <button className="bg-amber-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-amber-500 transition">立即升级</button>
       </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; count: number; onClick: () => void }> = ({ label, count, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer group flex-1">
        <span className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors font-mono">{formatNumber(count)}</span>
        <span className="text-xs text-gray-500 group-hover:text-pink-300/80 transition-colors mt-1">{label}</span>
    </div>
);

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; textClassName?: string; highlight?: boolean }> = ({ icon, label, onClick, textClassName, highlight }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all group border border-transparent hover:border-white/5 ${highlight ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/20 hover:from-pink-500/20' : 'hover:bg-white/5'}`}
  >
    <div className={`text-gray-400 group-hover:text-gray-300 transition-colors ${textClassName?.includes('red') ? 'text-red-400' : ''} ${highlight ? 'text-pink-400' : ''}`}>{icon}</div>
    <span className={`text-sm font-medium transition-colors ${textClassName || 'text-slate-300'} ${highlight ? 'text-pink-100 font-bold' : ''}`}>{label}</span>
    <svg className="ml-auto text-gray-600 group-hover:text-gray-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  </button>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
    <div className="col-span-2 flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
        <p className="text-gray-500 text-xs">{text}</p>
    </div>
);

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num;
};

export default ProfileView;
