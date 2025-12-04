import React from 'react';
import { TabState } from '../types';

interface BottomNavProps {
  currentTab: TabState;
  onSwitch: (tab: TabState) => void;
  onCreate: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSwitch, onCreate }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
       <div className="glass-panel rounded-3xl shadow-2xl grid grid-cols-5 items-center px-2 py-3 backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10">
        
        {/* 1. Characters */}
        <NavItem 
          label="邂逅" 
          isActive={currentTab === 'CHARS'} 
          onClick={() => onSwitch('CHARS')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={currentTab === 'CHARS' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}
        />
        
        {/* 2. Authors */}
        <NavItem 
          label="创作者" 
          isActive={currentTab === 'AUTHORS'} 
          onClick={() => onSwitch('AUTHORS')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={currentTab === 'AUTHORS' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>}
        />

        {/* 3. Create (Center) */}
        <div className="flex flex-col items-center justify-center -mt-8">
          <button 
            onClick={onCreate}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-purple-500/40 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border-4 border-[#1a1a2e]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {/* 4. Messages */}
        <NavItem 
          label="私语" 
          isActive={currentTab === 'MSGS'} 
          onClick={() => onSwitch('MSGS')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={currentTab === 'MSGS' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>}
        />

        {/* 5. Me */}
        <NavItem 
          label="我的" 
          isActive={currentTab === 'ME'} 
          onClick={() => onSwitch('ME')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={currentTab === 'ME' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
        
      </div>
    </div>
  );
};

const NavItem: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 transition-all w-full h-full group ${isActive ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'}`}
  >
    <div className={`transform transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]' : 'group-hover:scale-105'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'opacity-100 font-bold' : 'opacity-70'}`}>{label}</span>
  </button>
);

export default BottomNav;