
import React, { useState, useContext } from 'react';
import { Character, Author, Message } from '../types';
import { DialogContext } from '../DialogContext';

interface CharacterProfileViewProps {
  character: Character;
  author?: Author;
  messages: Message[]; // Chat history for "Memories"
  onBack: () => void;
  onChat: () => void;
  onEdit: () => void;
  currentUserId: string;
  onToggleFavorite: () => void;
  isFavorited: boolean;
  onAuthorClick: (id: string) => void;
  onRegenerateMemory: () => Promise<void>;
  onDeleteMemory: (id: string) => void;
}

const CharacterProfileView: React.FC<CharacterProfileViewProps> = ({
  character,
  author,
  messages,
  onBack,
  onChat,
  onEdit,
  currentUserId,
  onToggleFavorite,
  isFavorited,
  onAuthorClick,
  onRegenerateMemory,
  onDeleteMemory
}) => {
  const showDialog = useContext(DialogContext);
  const [activeTab, setActiveTab] = useState<'MEMORY' | 'WHISPER' | 'DYNAMIC'>('MEMORY');
  const [isGeneratingMemory, setIsGeneratingMemory] = useState(false);

  const isOwner = character.authorId === currentUserId;
  const bgSrc = character.backgroundImage || (character.backgroundImages && character.backgroundImages[0]) || `https://picsum.photos/seed/${character.avatarSeed}/800/1200`;
  const avatarSrc = character.avatar || bgSrc;

  // Calculate Heat (Mock logic: likes * 3 + chatCount)
  const heatValue = (character.likes || 0) * 3 + (character.chatCount || 0);

  // Filter memories from messages
  const memories = messages.filter(m => m.isMemory);

  const handleRegenerateClick = async () => {
    setIsGeneratingMemory(true);
    await onRegenerateMemory();
    setIsGeneratingMemory(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showDialog({
        type: 'confirm',
        title: '确认遗忘？',
        message: '删除这条记忆后，角色可能会忘记相关的对话细节。',
        confirmText: '确认删除',
        onConfirm: () => onDeleteMemory(id)
    });
  };

  // Mock Data for Whispers and Dynamics (Since backend doesn't exist for these yet)
  const mockWhispers = [
    { id: 1, type: 'audio', duration: '12"', content: '其实第一次见到你的时候...', locked: false, date: '昨天' },
    { id: 2, type: 'text', content: '这是一条只有亲密度达到 50 才能看到的秘密日记。', locked: (character.affinityLevel || 0) < 50, date: '3天前' },
    { id: 3, type: 'audio', duration: '08"', content: '晚安...', locked: true, date: '1周前' }
  ];

  const mockDynamics = [
    { id: 1, content: '今天的天气真不错，想去散步。', image: bgSrc, date: '2小时前', likes: 24, comments: 5 },
    { id: 2, content: '有些事情，还是埋在心里比较好。', date: '1天前', likes: 12, comments: 0 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e] text-slate-100 font-sans overflow-hidden">
      
      {/* --- Immersive Background (Standing Picture) --- */}
      <div className="absolute inset-0 z-0">
         <img src={bgSrc} className="w-full h-full object-cover" alt="Background" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/60 to-transparent opacity-90" />
         <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* --- Navbar --- */}
      <div className="absolute top-0 w-full z-20 flex justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button 
          onClick={onBack}
          className="bg-black/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/50 transition border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex gap-3">
             {isOwner && (
                <button 
                    onClick={onEdit}
                    className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full text-white hover:bg-black/50 transition border border-white/10 text-xs font-bold flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    编辑
                </button>
             )}
            <button 
              onClick={onToggleFavorite}
              className={`bg-black/30 backdrop-blur-md p-2 rounded-full transition border border-white/10 ${isFavorited ? 'text-pink-500' : 'text-white hover:bg-black/50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
        </div>
      </div>

      {/* --- Main Content Scrollable Area --- */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide pt-[40vh]">
         <div className="min-h-[60vh] bg-gradient-to-b from-transparent to-[#1a1a2e] flex flex-col px-5 pb-20">
            
            {/* Header Info */}
            <div className="mb-6 animate-slideUp">
                <div className="flex items-end justify-between mb-2">
                    <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-wide">{character.name}</h1>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-xs text-pink-300 font-bold">亲密度 Lv.{character.affinityLevel || 0}</span>
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${Math.min((character.affinityLevel || 0), 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {character.gender && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            character.gender === 'male' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 
                            character.gender === 'female' ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        }`}>
                            {character.gender === 'male' ? 'Male ♂' : character.gender === 'female' ? 'Female ♀' : 'Secret ⚥'}
                        </span>
                    )}
                    {character.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] bg-white/10 text-gray-300 border border-white/5">
                            # {tag}
                        </span>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <StatBox label="热度" value={heatValue} icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.113.25-2.127.687-3"/></svg>} />
                    <StatBox label="获赞" value={character.likes || 0} icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>} />
                    <StatBox label="私语" value={character.chatCount || 0} icon={<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
                </div>

                {/* Description */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm mb-6">
                    <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-wrap">
                        {character.description}
                    </p>
                    {author && (
                        <div 
                            onClick={() => onAuthorClick(author.id)}
                            className="mt-3 flex items-center gap-2 pt-3 border-t border-white/5 cursor-pointer hover:opacity-80 transition"
                        >
                            <img src={`https://picsum.photos/seed/${author.avatar}/50/50`} className="w-5 h-5 rounded-full" alt={author.name} />
                            <span className="text-xs text-gray-500">Created by <span className="text-gray-300 font-bold">{author.name}</span></span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 ml-auto"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/10 mb-4 px-2">
                <TabButton label="记忆碎片" isActive={activeTab === 'MEMORY'} onClick={() => setActiveTab('MEMORY')} />
                <TabButton label="悄悄话" isActive={activeTab === 'WHISPER'} onClick={() => setActiveTab('WHISPER')} />
                <TabButton label="动态" isActive={activeTab === 'DYNAMIC'} onClick={() => setActiveTab('DYNAMIC')} />
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
                {activeTab === 'MEMORY' && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Generate Button */}
                        <button 
                            onClick={handleRegenerateClick}
                            disabled={isGeneratingMemory}
                            className="w-full py-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-pink-500/20 rounded-xl text-pink-300 text-sm font-bold flex items-center justify-center gap-2 hover:bg-pink-500/10 transition active:scale-[0.98] disabled:opacity-50"
                        >
                            {isGeneratingMemory ? (
                                 <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                            )}
                            {isGeneratingMemory ? '正在梳理记忆...' : '基于当前对话重新生成记忆'}
                        </button>

                        {memories.length > 0 ? (
                            memories.map(m => (
                                <div key={m.id} className="bg-white/5 p-4 rounded-xl border border-white/5 relative group">
                                    <div className="flex gap-3">
                                         <div className="mt-1 text-pink-400 shrink-0">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="m3 9 3 3-3 3"/><path d="M14 8V6c0-1 1-2 2-2h4c1 0 2 1 2 2v12c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-2"/></svg>
                                         </div>
                                         <div className="flex-1">
                                             <p className="text-xs text-gray-500 mb-1.5">{new Date(m.timestamp).toLocaleString()}</p>
                                             <p className="text-sm text-gray-300 italic leading-relaxed">{m.text}</p>
                                         </div>
                                    </div>
                                    
                                    {/* Delete Button */}
                                    <button 
                                        onClick={(e) => handleDeleteClick(m.id, e)}
                                        className="absolute top-2 right-2 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full"
                                        title="遗忘这段记忆"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <EmptyState text="还没有生成任何关键记忆..." icon="memory" />
                        )}
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 opacity-50">
                            <p className="text-xs text-center text-gray-500">记忆碎片有助于角色记住你们之间发生的重要事情</p>
                        </div>
                    </div>
                )}

                {activeTab === 'WHISPER' && (
                    <div className="space-y-3 animate-fadeIn">
                        {mockWhispers.map(w => (
                            <div key={w.id} className={`p-3 rounded-xl border flex items-center gap-3 ${w.locked ? 'bg-black/20 border-white/5' : 'bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-pink-500/20'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w.locked ? 'bg-white/5 text-gray-500' : 'bg-pink-500/20 text-pink-400'}`}>
                                    {w.locked ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    ) : w.type === 'audio' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    {w.locked ? (
                                        <p className="text-sm text-gray-500">需要更高亲密度解锁</p>
                                    ) : (
                                        <div>
                                            {w.type === 'audio' && <div className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full inline-block mb-1">语音 {w.duration}</div>}
                                            <p className="text-sm text-gray-200">{w.content}</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-600 mt-1">{w.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'DYNAMIC' && (
                    <div className="space-y-4 animate-fadeIn">
                        {mockDynamics.map(d => (
                            <div key={d.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                {d.image && <div className="h-32 bg-gray-800"><img src={d.image} className="w-full h-full object-cover opacity-80" alt="post" /></div>}
                                <div className="p-3">
                                    <p className="text-sm text-gray-200 mb-2">{d.content}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>{d.date}</span>
                                        <div className="flex gap-3">
                                            <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> {d.likes}</span>
                                            <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {d.comments}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                         <EmptyState text="更多动态更新中..." icon="dynamic" />
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* --- Floating Chat Button --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e] to-transparent z-40">
         <button 
           onClick={onChat}
           className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl shadow-lg shadow-purple-900/30 text-white font-bold tracking-widest hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            发消息
         </button>
      </div>

    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/5 flex flex-col items-center">
        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">
            {icon} {label}
        </div>
        <span className="text-lg font-bold text-white font-mono">{value > 1000 ? (value/1000).toFixed(1)+'k' : value}</span>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`pb-3 text-sm font-bold transition-all relative ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
    >
        {label}
        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]" />}
    </button>
);

const EmptyState: React.FC<{ text: string; icon: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-600">
        <p className="text-xs">{text}</p>
    </div>
);

export default CharacterProfileView;