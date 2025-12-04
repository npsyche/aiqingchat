
import React from 'react';
import { Character, Message } from '../types';

interface MessageListProps {
  characters: Character[];
  messagesMap: Record<string, Message[]>;
  onSelect: (character: Character) => void;
}

const MessageList: React.FC<MessageListProps> = ({ characters, messagesMap, onSelect }) => {
  // Get characters that have at least one message
  const activeChats = characters.filter(c => messagesMap[c.id] && messagesMap[c.id].length > 0);
  
  // Sort by latest message timestamp
  activeChats.sort((a, b) => {
    const lastMsgA = messagesMap[a.id][messagesMap[a.id].length - 1];
    const lastMsgB = messagesMap[b.id][messagesMap[b.id].length - 1];
    return lastMsgB.timestamp - lastMsgA.timestamp;
  });

  if (activeChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 min-h-[50vh]">
        <div className="bg-white/5 p-6 rounded-full mb-4 border border-white/5 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <p className="font-bold text-lg text-slate-300">暂无私语</p>
        <p className="text-sm mt-2 text-gray-500">快去邂逅心仪的角色吧！</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-transparent">
      <div className="p-4 border-b border-white/5 bg-[#1a1a2e]/80 sticky top-0 z-10 backdrop-blur-md pt-[calc(1rem+env(safe-area-inset-top))]">
        <h2 className="text-xl font-bold text-white tracking-wide">私语列表</h2>
      </div>
      
      <div className="flex-1">
        {activeChats.map(char => {
          const lastMsg = messagesMap[char.id][messagesMap[char.id].length - 1];
          const avatarSrc = char.avatar || `https://picsum.photos/seed/${char.avatarSeed}/100/100`;

          const displayText = lastMsg.isMemory ? "[历史回忆]" : lastMsg.text;

          return (
            <div 
              key={char.id}
              onClick={() => onSelect(char)}
              className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5"
            >
              <div className="relative">
                <img 
                  src={avatarSrc} 
                  alt={char.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
                />
                {/* Online indicator mock */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1a1a2e] rounded-full shadow-sm"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-white truncate text-base">{char.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-sm text-gray-400 truncate pr-2 font-light">
                  {lastMsg.role === 'user' ? <span className="text-pink-400/80">我: </span> : ''}{displayText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageList;
