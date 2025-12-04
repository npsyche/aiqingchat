import React, { useContext } from 'react';
import { Author, Character } from '../types';
import { DialogContext } from '../DialogContext';

interface AuthorProfileViewProps {
  author: Author;
  characters: Character[];
  isFollowing: boolean;
  onBack: () => void;
  onSelectCharacter: (char: Character) => void;
  onToggleFollow: () => void;
}

const AuthorProfileView: React.FC<AuthorProfileViewProps> = ({ 
    author, 
    characters, 
    isFollowing,
    onBack, 
    onSelectCharacter,
    onToggleFollow
}) => {
  const showDialog = useContext(DialogContext);
  
  const handleShare = async () => {
    const shareData = {
      title: `${author.name} 的主页 - AI卿`,
      text: `来看看创作者 ${author.name}！\n简介：${author.description}\n粉丝数：${author.followers}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn("Share canceled or failed", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        .then(() => showDialog({ type: 'alert', title: '成功', message: "分享链接已复制到剪贴板！" }))
        .catch(() => showDialog({ type: 'alert', title: '失败', message: "复制失败" }));
    }
  };

  // Visually adjust followers count based on local follow state
  // (Assuming mock data doesn't update, we simulate the +1)
  const displayFollowers = isFollowing ? author.followers + 1 : author.followers;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-[#1a1a2e] to-[#0f172a] text-slate-100 font-sans pb-10">
      {/* Navbar */}
      <div className="absolute top-0 w-full z-20 flex justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button 
          onClick={onBack}
          className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/40 transition border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button 
          onClick={handleShare}
          className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/40 transition border border-white/10"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="h-72 relative shrink-0">
         <img src={`https://picsum.photos/seed/${author.avatar}bg/800/600`} alt="Banner" className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/40 to-transparent" />
      </div>

      {/* Info Section */}
      <div className="px-6 -mt-12 relative z-10 flex flex-col items-center text-center">
        <img 
          src={`https://picsum.photos/seed/${author.avatar}/200/200`} 
          alt={author.name}
          className="w-24 h-24 rounded-full border-4 border-[#1a1a2e] shadow-2xl mb-3"
        />
        <h1 className="text-2xl font-bold text-white mb-1 tracking-wide">{author.name}</h1>
        <p className="text-gray-400 text-sm max-w-xs">{author.description}</p>
        
        {/* Interaction Buttons */}
        <div className="flex gap-4 mt-6 w-full max-w-xs">
          <button 
            onClick={onToggleFollow}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm shadow-lg transition active:scale-95 ${isFollowing 
                ? 'bg-transparent border border-white/20 text-gray-300 hover:bg-white/10' 
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-purple-500/30 hover:scale-[1.02]'
            }`}
          >
            {isFollowing ? '已关注' : '关注'}
          </button>
           <button className="flex-1 glass-panel text-white py-2.5 rounded-full font-bold text-sm hover:bg-white/10 transition active:scale-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            打赏
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-10 mt-8 pb-8 border-b border-white/5 w-full">
           <div className="text-center">
              <span className="block text-lg font-bold text-white">{formatNumber(displayFollowers)}</span>
              <span className="text-xs text-gray-500 font-medium">粉丝</span>
           </div>
           <div className="text-center">
              <span className="block text-lg font-bold text-white">{formatNumber(author.likes)}</span>
              <span className="text-xs text-gray-500 font-medium">获赞</span>
           </div>
           <div className="text-center">
              <span className="block text-lg font-bold text-white">{characters.length}</span>
              <span className="text-xs text-gray-500 font-medium">作品</span>
           </div>
        </div>
      </div>

      {/* Characters List */}
      <div className="p-4 flex-1">
        <h3 className="text-lg font-bold text-white mb-4 px-2">全部作品</h3>
        <div className="grid grid-cols-2 gap-4">
          {characters.map(char => {
             const avatarSrc = char.avatar || `https://picsum.photos/seed/${char.avatarSeed}/400/600`;
             return (
               <div
                  key={char.id}
                  className="relative rounded-2xl overflow-hidden bg-white/5 aspect-[2/3] group shadow-lg cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                  onClick={() => onSelectCharacter(char)}
                >
                  <img
                    src={avatarSrc}
                    alt={char.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                     <h4 className="text-sm font-bold text-white font-serif tracking-wide">{char.name}</h4>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-300 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          {formatNumber(char.likes || 0)}
                        </span>
                     </div>
                  </div>
                </div>
             );
          })}
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

export default AuthorProfileView;
