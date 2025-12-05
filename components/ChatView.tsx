
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Character, Message, Author, SavedModel, UserPersona } from '../types';
import { geminiService } from '../services/geminiService';
import { DialogContext } from '../DialogContext';

interface ChatViewProps {
  character: Character;
  author?: Author;
  initialMessages: Message[];
  savedModels?: SavedModel[];
  currentUserId: string;
  isFavorited: boolean;
  userPersonas?: UserPersona[]; // New Prop
  historyRoundLimit?: number; // New Prop
  onBack: () => void;
  onEdit: () => void;
  onSaveMessages: (messages: Message[]) => void;
  onAuthorClick: (authorId: string) => void;
  onClearHistory: () => void;
  onToggleFavorite: () => void;
  onViewProfile: () => void;
  onUpdateCharacter: (character: Character) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  character, 
  author, 
  initialMessages, 
  savedModels = [],
  currentUserId,
  isFavorited,
  userPersonas = [],
  historyRoundLimit = 20,
  onBack, 
  onEdit, 
  onSaveMessages, 
  onAuthorClick,
  onClearHistory,
  onToggleFavorite,
  onViewProfile,
  onUpdateCharacter
}) => {
  const showDialog = useContext(DialogContext);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Animation States
  const [entranceStage, setEntranceStage] = useState(0); 

  // Model State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [showModelList, setShowModelList] = useState(false);

  // Persona State
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [showPersonaList, setShowPersonaList] = useState(false);

  // Menu State
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Construct unique background list
  const bgList = React.useMemo(() => {
     const list: string[] = [];
     if (character.backgroundImages && character.backgroundImages.length > 0) {
         list.push(...character.backgroundImages);
     } else if (character.backgroundImage) {
         list.push(character.backgroundImage);
     }
     // fallback
     if (list.length === 0) list.push(`https://picsum.photos/seed/${character.avatarSeed}/800/1200`);
     return Array.from(new Set(list)); // Dedupe
  }, [character]);

  // Background State - Initialize with the index of the current active background
  const [activeBgIndex, setActiveBgIndex] = useState(() => {
      const idx = bgList.findIndex(url => url === character.backgroundImage);
      return idx >= 0 ? idx : 0;
  });

  // Edit Message State
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check ownership
  const isOwner = character.authorId === currentUserId;

  // Construct display options for models
  const modelOptions = savedModels.length > 0 
    ? savedModels 
    : [
        { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
        { name: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro' }
      ];

  const currentModelName = modelOptions.find(m => m.name === selectedModel)?.displayName || selectedModel;
  
  const activePersona = userPersonas.find(p => p.id === activePersonaId);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, suggestions, loadingSuggestions, editingMessage]);

  // Entrance Animation Sequence
  useEffect(() => {
    // Only play if just mounted
    const t1 = setTimeout(() => setEntranceStage(1), 100); // Start
    const t2 = setTimeout(() => setEntranceStage(2), 800); // Flash
    const t3 = setTimeout(() => setEntranceStage(3), 1500); // UI Slide in
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Handle Opening Message logic
  useEffect(() => {
    if (initialMessages.length === 0 && character.openingMessage && messages.length === 0) {
        const openingMsg: Message = {
            id: crypto.randomUUID(),
            role: 'model',
            text: character.openingMessage,
            timestamp: Date.now()
        };
        setMessages([openingMsg]);
        onSaveMessages([openingMsg]);
    } else {
        setMessages(initialMessages);
    }
  }, [initialMessages, character.openingMessage]);

  // Initialize Gemini Session
  // Re-init when activePersona changes or model changes or history limit changes
  useEffect(() => {
    const initChat = async () => {
      try {
        const personaContext = activePersona ? activePersona.description : '';
        await geminiService.startChat(character.systemInstruction, messages, selectedModel, personaContext, historyRoundLimit);
        setHasInitialized(true);
      } catch (e) {
        console.error("Failed to start chat session", e);
        // We don't set hasInitialized to true here, so users will trigger lazy init or error on send
      }
    };
    // Initialize immediately if parameters change
    initChat();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, character.systemInstruction, selectedModel, activePersonaId, historyRoundLimit]); 

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const triggerSuggestions = async (botText: string) => {
    setLoadingSuggestions(true);
    try {
      const result = await geminiService.generateReplySuggestions(character.name, botText);
      setSuggestions(result);
    } catch (e) {
      console.error("Failed to get suggestions", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleMagicClick = () => {
    if (loadingSuggestions) return;
    const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
    if (lastModelMsg) {
       triggerSuggestions(lastModelMsg.text);
    } else if (messages.length > 0) {
       const lastMsg = messages[messages.length - 1];
       triggerSuggestions(lastMsg.text);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const userText = textOverride || inputText.trim();

    // REMOVED !hasInitialized from check to allow optimistic UI updates and lazy initialization
    if (!userText || isLoading) return;

    setInputText('');
    setSuggestions([]); 
    setShowModelList(false);
    setShowPersonaList(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    let currentHistory = messages;
    
    // === EDIT MODE LOGIC ===
    if (editingMessage) {
        const index = messages.findIndex(m => m.id === editingMessage.id);
        if (index !== -1) {
            currentHistory = messages.slice(0, index);
            const personaContext = activePersona ? activePersona.description : '';
            // Re-init session from cutoff point
            await geminiService.startChat(character.systemInstruction, currentHistory, selectedModel, personaContext, historyRoundLimit);
            setHasInitialized(true);
        }
        setEditingMessage(null);
    }
    // =======================

    const botMessageId = crypto.randomUUID();
    const botPlaceholder: Message = { 
      id: botMessageId, 
      role: 'model', 
      text: '', 
      timestamp: Date.now() 
    };

    const updatedMessages = [...currentHistory, userMessage, botPlaceholder];
    setMessages(updatedMessages);
    
    setIsLoading(true);

    try {
      // Lazy Initialization: If session wasn't ready, try to start it now before sending
      if (!hasInitialized) {
          try {
              const personaContext = activePersona ? activePersona.description : '';
              await geminiService.startChat(character.systemInstruction, currentHistory, selectedModel, personaContext, historyRoundLimit);
              setHasInitialized(true);
          } catch (initError) {
              console.warn("Lazy init failed, continuing to stream will likely fail:", initError);
              // We continue to sendMessageStream so it throws the specific error we can catch below
          }
      }

      const stream = geminiService.sendMessageStream(userText);
      
      let fullResponseText = '';

      for await (const chunk of stream) {
        fullResponseText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: fullResponseText }
            : msg
        ));
      }

      const finalMessages = updatedMessages.map(m => 
        m.id === botMessageId ? { ...m, text: fullResponseText } : m
      );
      
      if (finalMessages.length > 30) {
          const msgsToSummarize = finalMessages.slice(0, 20);
          const recentMsgs = finalMessages.slice(20);
          
          geminiService.summarizeMessages(msgsToSummarize, character.name).then(summary => {
             if (summary) {
                 const memoryNode: Message = {
                     id: crypto.randomUUID(),
                     role: 'model', 
                     text: summary,
                     timestamp: Date.now(),
                     isMemory: true
                 };
                 const compactedHistory = [memoryNode, ...recentMsgs];
                 setMessages(compactedHistory);
                 onSaveMessages(compactedHistory);
                 const personaContext = activePersona ? activePersona.description : '';
                 geminiService.startChat(character.systemInstruction, compactedHistory, selectedModel, personaContext, historyRoundLimit);
             } else {
                 onSaveMessages(finalMessages);
             }
          });
      } else {
          onSaveMessages(finalMessages);
      }

    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => prev.map(msg => 
         msg.id === botMessageId 
           ? { ...msg, text: "*(连接中断或出错，请检查API Key配置或网络连接。)*" } 
           : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'model') return;

    const userMsgIndex = messages.length - 2;
    if (userMsgIndex < 0) return; 

    const lastUserMsg = messages[userMsgIndex];
    const userText = lastUserMsg.text;

    const previousMessages = messages.slice(0, -1);
    
    const botMessageId = crypto.randomUUID();
    const botPlaceholder: Message = { 
      id: botMessageId, 
      role: 'model', 
      text: '', 
      timestamp: Date.now() 
    };

    setMessages([...previousMessages, botPlaceholder]);
    setIsLoading(true);

    try {
      const historyForSdk = previousMessages.slice(0, -1);
      const personaContext = activePersona ? activePersona.description : '';
      await geminiService.startChat(character.systemInstruction, historyForSdk, selectedModel, personaContext, historyRoundLimit);
      setHasInitialized(true);

      const stream = geminiService.sendMessageStream(userText);
      let fullResponseText = '';

      for await (const chunk of stream) {
        fullResponseText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: fullResponseText }
            : msg
        ));
      }
      
      const finalMessages = [
        ...previousMessages,
        { id: botMessageId, role: 'model', text: fullResponseText, timestamp: Date.now() }
      ] as Message[];
      onSaveMessages(finalMessages);

    } catch (e) {
      console.error("Regenerate failed", e);
      setMessages(prev => prev.map(msg => 
         msg.id === botMessageId 
           ? { ...msg, text: "*(重新生成失败，请检查连接)*" } 
           : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchBackground = () => {
      if (bgList.length > 1) {
          const nextIndex = (activeBgIndex + 1) % bgList.length;
          setActiveBgIndex(nextIndex);
          const nextBg = bgList[nextIndex];
          // Persist the change
          onUpdateCharacter({ ...character, backgroundImage: nextBg });
      }
      setShowMenu(false);
  };

  // --- Long Press Logic ---
  const handleTouchStart = (msg: Message) => {
    if (msg.role !== 'user') return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg?.id !== msg.id) return;

    longPressTimerRef.current = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
        setEditingMessage(msg);
        setInputText(msg.text);
        textareaRef.current?.focus();
    }, 600); // 600ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
  };
  
  const cancelEdit = () => {
      setEditingMessage(null);
      setInputText('');
  };
  // ------------------------

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const confirmClear = () => {
    onClearHistory();
    setSuggestions([]);
    setMessages([]);
    if (character.openingMessage) {
        const openingMsg: Message = {
            id: crypto.randomUUID(),
            role: 'model',
            text: character.openingMessage,
            timestamp: Date.now()
        };
        setMessages([openingMsg]);
    }
    const personaContext = activePersona ? activePersona.description : '';
    geminiService.startChat(character.systemInstruction, [], selectedModel, personaContext, historyRoundLimit);
    setHasInitialized(true);
    setShowMenu(false);
  };

  const triggerClearModal = () => {
    showDialog({
        type: 'confirm',
        title: '清空回忆',
        message: `确认清空回忆？这将抹去你与 ${character.name} 的所有羁绊点滴，且无法找回。`,
        confirmText: '确认遗忘',
        cancelText: '留下回忆',
        onConfirm: confirmClear
    });
    setShowMenu(false);
  };

  const handleExport = () => {
    if (messages.length === 0) {
      showDialog({ type: 'alert', message: "没有聊天记录可导出" });
      setShowMenu(false);
      return;
    }
    const content = messages.map(m => {
      const roleName = m.role === 'user' ? '我' : character.name;
      const time = new Date(m.timestamp).toLocaleString();
      return `[${time}] ${roleName}:\n${m.text}\n`;
    }).join('\n-------------------\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name}_聊天记录_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: `与 ${character.name} 的邂逅 - AI卿`,
      text: `快来 AI卿 和 ${character.name} 聊天吧！\n简介：${character.description}\n作者：${author?.name || '未知'}`,
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        .then(() => showDialog({ type: 'alert', title: '成功', message: "分享链接已复制到剪贴板！" }))
        .catch(() => showDialog({ type: 'alert', title: '失败', message: "复制失败" }));
    }
    setShowMenu(false);
  };

  const handleToggleFavoriteAction = () => {
      onToggleFavorite();
      setShowMenu(false);
  };

  const renderMessageContent = (text: string) => {
    const regex = /(\([\s\S]*?\)|（[\s\S]*?）|".*?"|“.*?”)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith('"') || part.startsWith('“')) {
        return <span key={i} className="text-pink-300 font-bold">{part}</span>;
      }
      if (part.startsWith('(') || part.startsWith('（')) {
        return <span key={i} className="text-gray-200 italic text-[0.9em]">{part}</span>;
      }
      return <span key={i} className="text-slate-200">{part}</span>;
    });
  };

  const bgSrc = bgList[activeBgIndex];

  // Animation Styles
  const getBgStyle = () => {
      if (entranceStage < 1) return 'opacity-0 scale-110 blur-xl'; 
      if (entranceStage === 1) return 'opacity-100 scale-105 blur-sm';
      return 'opacity-80 scale-100 blur-0';
  };

  const getUIStyle = () => {
      if (entranceStage < 3) return 'opacity-0 translate-y-10 pointer-events-none';
      return 'opacity-100 translate-y-0 pointer-events-auto';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-full overflow-hidden bg-[#1a1a2e] font-sans" onClick={() => { showModelList && setShowModelList(false); showPersonaList && setShowPersonaList(false); }}>
      
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 bg-[#1a1a2e]">
        <img 
          src={bgSrc} 
          className={`w-full h-full object-cover transition-all duration-[1500ms] ease-out ${getBgStyle()}`}
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/40 via-[#1a1a2e]/20 to-[#1a1a2e]" />
      </div>

      {/* Intro Overlay */}
      <div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${entranceStage === 1 || entranceStage === 2 ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-pink-400 animate-spin-slow"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>
            <p className="text-pink-200/90 text-sm tracking-[0.3em] font-light animate-pulse">
                开启与 {character.name} 的邂逅...
            </p>
         </div>
      </div>

      <div className={`absolute inset-0 z-50 bg-pink-500/10 pointer-events-none transition-opacity duration-500 ${entranceStage === 2 ? 'opacity-100' : 'opacity-0'}`} />

      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 sticky top-0 z-30 bg-gradient-to-b from-[#1a1a2e]/90 to-transparent backdrop-blur-[2px] transition-all duration-1000 ${getUIStyle()}`}>
        <div className="flex items-center gap-2">
            <button 
                onClick={onBack} 
                className="p-2 -ml-2 text-white/90 hover:text-white transition rounded-full hover:bg-white/10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div 
                onClick={onViewProfile}
                className="flex items-center gap-2 cursor-pointer group"
            >
                 <span className="text-xl font-bold text-white tracking-wide shadow-black/50 drop-shadow-md group-hover:text-pink-200 transition-colors">{character.name}</span>
                 {isLoading && (
                    <span className="text-[10px] text-pink-300 font-medium tracking-wider animate-pulse flex items-center">
                       <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-1"></span>
                       思考中
                    </span>
                 )}
            </div>
        </div>

        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-white/90 hover:text-white transition rounded-full hover:bg-white/10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn z-50">
                    <div className="py-1">
                        {bgList.length > 1 && (
                            <button onClick={handleSwitchBackground} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                换背景图
                            </button>
                        )}
                        <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            分享角色
                        </button>
                        <button onClick={handleToggleFavoriteAction} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "#ec4899" : "none"} stroke={isFavorited ? "#ec4899" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            {isFavorited ? '取消收藏' : '收藏角色'}
                        </button>
                        <button onClick={handleExport} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            导出记录
                        </button>
                        {isOwner && (
                            <button onClick={onEdit} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                编辑角色
                            </button>
                        )}
                        <div className="h-px bg-white/10 my-1 mx-2"></div>
                        <button onClick={triggerClearModal} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 flex items-center gap-3 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            重置/清空
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto px-4 py-2 space-y-6 z-10 scrollbar-hide overscroll-contain transition-opacity duration-1000 ${entranceStage === 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-4"></div>
        
        {messages.map((msg, index) => {
          if (msg.isMemory) {
             return (
               <div key={msg.id} className="flex justify-center my-4 animate-fadeIn">
                 <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 max-w-[80%] text-center">
                   <p className="text-[10px] text-pink-300 font-bold mb-1 uppercase tracking-widest">--- 历史回忆 ---</p>
                   <p className="text-xs text-gray-400 italic line-clamp-3">{msg.text}</p>
                 </div>
               </div>
             );
          }

          const isUser = msg.role === 'user';
          const isStreaming = !isUser && isLoading && index === messages.length - 1;
          const isThinking = isStreaming && (!msg.text || msg.text.length === 0);
          const isLastAndModel = !isUser && index === messages.length - 1 && !isLoading;
          
          const isBeingEdited = editingMessage?.id === msg.id;
          
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn group select-none transition-opacity duration-300 ${isBeingEdited ? 'opacity-50' : 'opacity-100'}`}
            >
              <div 
                className={`
                  relative px-5 py-3.5 text-[15px] leading-7 shadow-lg backdrop-blur-md max-w-[88%] active:scale-95 transition-transform
                  ${isUser 
                    ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-2xl rounded-tr-sm shadow-purple-900/30' 
                    : 'glass-panel text-slate-100 rounded-2xl rounded-tl-sm shadow-black/20'}
                `}
                onTouchStart={() => handleTouchStart(msg)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(msg)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                {isThinking ? (
                   <div className="flex items-center gap-1.5 h-6 px-1">
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                   </div>
                ) : (
                  <div className="whitespace-pre-wrap tracking-wide select-text">
                     {isUser ? msg.text : renderMessageContent(msg.text)}
                     {isStreaming && (
                       <span className="inline-block w-1.5 h-4 ml-0.5 bg-pink-400 animate-pulse align-text-bottom rounded-full" />
                     )}
                  </div>
                )}
              </div>
              
              {isLastAndModel && (
                 <div className="mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <button 
                     onClick={handleRegenerate}
                     className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/20 hover:bg-black/40 text-[10px] text-gray-300 hover:text-white transition-all backdrop-blur-sm"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                     <span>重来</span>
                   </button>
                 </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Suggestion & Input */}
      <div className={`px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-2 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/90 to-transparent transition-all duration-1000 ${getUIStyle()}`}>
        
        {/* Tool Bar */}
        <div className="flex justify-between items-center px-1 pb-2">
           {/* Left: Model Switcher */}
           <div className="relative" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowModelList(!showModelList)}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-full text-xs transition-all backdrop-blur-sm shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></span>
                <span className="max-w-[100px] truncate">{currentModelName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showModelList ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
              </button>

              {showModelList && (
                <div className="absolute bottom-full left-0 mb-2 w-48 glass-panel rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn bg-[#1a1a2e]/90">
                   <div className="p-1 max-h-48 overflow-y-auto scrollbar-hide">
                      {modelOptions.map(model => (
                        <button 
                          key={model.name}
                          onClick={() => { setSelectedModel(model.name); setShowModelList(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition truncate flex items-center justify-between group rounded-lg ${selectedModel === model.name ? 'bg-pink-500/20 text-pink-300 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                        >
                          <span>{model.displayName}</span>
                          {selectedModel === model.name && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Center Right: Actions */}
           <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
               
               {/* Persona Mask Selector */}
               <div className="relative">
                   <button 
                      onClick={() => setShowPersonaList(!showPersonaList)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all backdrop-blur-sm shadow-sm border ${activePersonaId ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                   >
                        <span className="text-lg">🎭</span>
                        {activePersona && <span className="max-w-[60px] truncate font-bold">{activePersona.name}</span>}
                   </button>
                   
                   {showPersonaList && (
                       <div className="absolute bottom-full right-0 mb-2 w-48 glass-panel rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn bg-[#1a1a2e]/90">
                           <div className="p-1 max-h-48 overflow-y-auto scrollbar-hide">
                               <button
                                  onClick={() => { setActivePersonaId(null); setShowPersonaList(false); }}
                                  className={`w-full text-left px-3 py-2 text-xs transition truncate flex items-center gap-2 rounded-lg ${!activePersonaId ? 'bg-pink-500/20 text-pink-300 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                               >
                                   <span>🚫</span>
                                   <span>默认身份 (无)</span>
                               </button>
                               {userPersonas.map(p => (
                                   <button 
                                      key={p.id}
                                      onClick={() => { setActivePersonaId(p.id); setShowPersonaList(false); }}
                                      className={`w-full text-left px-3 py-2 text-xs transition truncate flex items-center gap-2 rounded-lg ${activePersonaId === p.id ? 'bg-pink-500/20 text-pink-300 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                                   >
                                       <span>🎭</span>
                                       <span>{p.name}</span>
                                   </button>
                               ))}
                               {userPersonas.length === 0 && (
                                   <div className="px-3 py-2 text-[10px] text-gray-500 text-center">
                                       暂无身份设定，请去“我的”页面添加
                                   </div>
                               )}
                           </div>
                       </div>
                   )}
               </div>

               {/* Magic Wand */}
               {!isLoading && !suggestions.length && messages.length > 0 && !editingMessage && (
                 <button 
                    onClick={handleMagicClick}
                    disabled={loadingSuggestions}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-pink-300 border border-pink-500/20 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 backdrop-blur-sm shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                 >
                    {loadingSuggestions ? (
                       <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                       <div className="flex items-center gap-1">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                         <span>帮我回</span>
                       </div>
                    )}
                 </button>
               )}
           </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !isLoading && !editingMessage && (
          <div className="flex flex-col gap-2 items-end px-1 pb-2">
             {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  className="bg-white/10 hover:bg-pink-600/20 backdrop-blur-md border border-white/10 hover:border-pink-500/50 text-slate-200 hover:text-white px-4 py-2 rounded-2xl text-sm transition-all duration-300 shadow-sm animate-fadeIn active:scale-95 max-w-[90%] text-left"
                >
                  {suggestion}
                </button>
             ))}
          </div>
        )}
        
        {/* Editing Bar */}
        {editingMessage && (
          <div className="flex justify-between items-center bg-black/40 border border-white/10 rounded-xl px-4 py-2 mb-1 backdrop-blur-md animate-fadeIn">
            <span className="text-xs text-pink-300 font-bold flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
               正在修改消息...
            </span>
            <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-white font-medium px-2 py-1">取消</button>
          </div>
        )}

        {/* Input Bar */}
        <div className={`glass-panel rounded-[2rem] px-2 py-2 flex items-end shadow-2xl transition-all duration-300 bg-[#1a1a2e]/60 ${editingMessage ? 'ring-1 ring-pink-500/50 bg-pink-900/10' : ''}`}>
          <button className="p-3 text-gray-400 hover:text-pink-300 transition rounded-full hover:bg-white/5 mb-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>

          <form 
            onSubmit={handleFormSubmit}
            className="flex-1 flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={editingMessage ? "修改内容..." : `给 ${character.name} 发消息...`}
              rows={1}
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 px-2 py-3 outline-none border-none text-base resize-none overflow-y-auto max-h-32 scrollbar-hide"
              disabled={isLoading}
            />
            
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className={`
                p-3 rounded-full transition-all duration-300 flex items-center justify-center mr-1 mb-0.5 shadow-lg
                ${inputText.trim() && !isLoading 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 shadow-pink-500/30' 
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transform ${inputText.trim() ? '-rotate-45 translate-x-0.5 translate-y-0.5' : ''}`}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatView;