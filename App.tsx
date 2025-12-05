
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Character, Message, ViewState, TabState, Author, SavedModel, DialogConfig, UserPersona } from './types';
import { DEFAULT_CHARACTERS, MOCK_AUTHORS } from './constants';
import CharacterList from './components/CharacterList';
import AuthorList from './components/AuthorList';
import CreateView from './components/CreateView';
import ChatView from './components/ChatView';
import LoginView from './components/LoginView';
import BottomNav from './components/BottomNav';
import MessageList from './components/MessageList';
import ProfileView from './components/ProfileView';
import ProfileEditView from './components/ProfileEditView';
import AuthorProfileView from './components/AuthorProfileView';
import CharacterProfileView from './components/CharacterProfileView';
import SettingsView from './components/SettingsView';
import ConfirmDialog from './components/ConfirmDialog';
import UserList from './components/UserList';
import { geminiService } from './services/geminiService';
import { DialogContext } from './DialogContext';

const STORAGE_KEY_CHARS = 'soulsync_characters';
const STORAGE_KEY_MSGS = 'soulsync_messages';
const STORAGE_KEY_AUTH = 'soulsync_is_logged_in';
const STORAGE_KEY_USER_ID = 'soulsync_current_user_id';
const STORAGE_KEY_MODELS = 'soulsync_saved_models';
const STORAGE_KEY_FAVS = 'soulsync_favorites';
const STORAGE_KEY_FOLLOWING = 'soulsync_following';
const STORAGE_KEY_PERSONAS = 'soulsync_user_personas';
const STORAGE_KEY_HISTORY_LIMIT = 'soulsync_history_limit';

export default function App() {
  // State
  const [view, setView] = useState<ViewState>('LOGIN'); // Default to login
  const [activeTab, setActiveTab] = useState<TabState>('CHARS');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [authors, setAuthors] = useState<Author[]>(MOCK_AUTHORS);
  const [currentUserId, setCurrentUserId] = useState<string>('user_current');
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [activeAuthorId, setActiveAuthorId] = useState<string | null>(null);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  
  // New State for Personas and Settings
  const [userPersonas, setUserPersonas] = useState<UserPersona[]>([]);
  const [historyRoundLimit, setHistoryRoundLimit] = useState<number>(20);
  
  // Track previous view for navigation
  const [prevView, setPrevView] = useState<ViewState | null>(null);

  // Global Dialog State
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({ isOpen: false, message: '' });

  const showDialog = useCallback((config: Omit<DialogConfig, 'isOpen'>) => {
    setDialogConfig({ ...config, isOpen: true });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Get current user object
  const currentUser = authors.find(a => a.id === currentUserId) || authors[0];

  // Mock User Lists for Followers/Likes
  const mockUserList = useMemo(() => {
     // Generate a pseudo-random list of users based on mock authors
     return authors.filter(a => a.id !== currentUser.id);
  }, [authors, currentUser.id]);

  // Load Data on Mount
  useEffect(() => {
    const loadedChars = localStorage.getItem(STORAGE_KEY_CHARS);
    const loadedMsgs = localStorage.getItem(STORAGE_KEY_MSGS);
    const isLoggedIn = localStorage.getItem(STORAGE_KEY_AUTH);
    const loadedModels = localStorage.getItem(STORAGE_KEY_MODELS);
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const loadedFavs = localStorage.getItem(STORAGE_KEY_FAVS);
    const loadedFollowing = localStorage.getItem(STORAGE_KEY_FOLLOWING);
    const loadedPersonas = localStorage.getItem(STORAGE_KEY_PERSONAS);
    const loadedHistoryLimit = localStorage.getItem(STORAGE_KEY_HISTORY_LIMIT);

    // Initialize API Config from LocalStorage if available
    const savedApiKey = localStorage.getItem('soulsync_api_key');
    const savedBaseUrl = localStorage.getItem('soulsync_api_base');
    
    // Update if either exists, otherwise service uses defaults
    if (savedApiKey || savedBaseUrl) {
      geminiService.updateConfig(savedApiKey || undefined, savedBaseUrl || undefined);
    }

    if (loadedChars) {
      setCharacters(JSON.parse(loadedChars));
    } else {
      setCharacters(DEFAULT_CHARACTERS);
    }

    if (loadedMsgs) {
      setMessagesMap(JSON.parse(loadedMsgs));
    }

    if (loadedModels) {
      try {
        setSavedModels(JSON.parse(loadedModels));
      } catch (e) { console.error("Failed to load models", e); }
    }
    
    if (savedUserId) {
        setCurrentUserId(savedUserId);
    }

    if (loadedFavs) {
        try { setFavoriteIds(new Set(JSON.parse(loadedFavs))); } catch(e){}
    }

    if (loadedFollowing) {
        try { setFollowingIds(new Set(JSON.parse(loadedFollowing))); } catch(e){}
    }

    if (loadedPersonas) {
        try { setUserPersonas(JSON.parse(loadedPersonas)); } catch(e){}
    }

    if (loadedHistoryLimit) {
        try { setHistoryRoundLimit(parseInt(loadedHistoryLimit, 10)); } catch(e){}
    }

    if (isLoggedIn === 'true') {
      setView('LIST');
    }
  }, []);

  // Save Data when changed
  useEffect(() => {
    if (characters.length > 0) {
      localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify(characters));
    }
  }, [characters]);

  useEffect(() => {
    if (Object.keys(messagesMap).length > 0) {
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messagesMap));
    }
  }, [messagesMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(Array.from(favoriteIds)));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FOLLOWING, JSON.stringify(Array.from(followingIds)));
  }, [followingIds]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_PERSONAS, JSON.stringify(userPersonas));
  }, [userPersonas]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_HISTORY_LIMIT, historyRoundLimit.toString());
  }, [historyRoundLimit]);

  // Handlers
  const handleLogin = (phone: string) => {
    // Logic to switch test users
    let uid = 'user_current';
    if (phone === '10000') uid = 'user_test';
    if (phone === '20000') uid = 'user_test_2';
    
    setCurrentUserId(uid);
    localStorage.setItem(STORAGE_KEY_USER_ID, uid);
    localStorage.setItem(STORAGE_KEY_AUTH, 'true');
    setView('LIST');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setView('LOGIN');
    setActiveTab('CHARS'); // Reset tab
  };

  const handleSelectCharacter = (char: Character) => {
    setActiveCharId(char.id);
    setPrevView('LIST');
    setView('CHAT');
  };

  const handleSelectAuthor = (authorId: string) => {
    setActiveAuthorId(authorId);
    setPrevView(view);
    setView('AUTHOR');
  };

  const handleEditCharacter = (charOverride?: Character) => {
    const char = charOverride || characters.find(c => c.id === activeCharId);
    if (char) {
      if (char.authorId !== currentUser.id) {
        showDialog({
            type: 'alert',
            title: '权限不足',
            message: "你只能编辑自己创建的角色"
        });
        return;
      }
      setEditingChar(char);
      setPrevView(view);
      setView('CREATE');
    }
  };

  const handleCreateNew = () => {
    setEditingChar(null);
    setPrevView(view);
    setView('CREATE');
  };

  const handleSaveCharacter = (newChar: Character) => {
    setCharacters(prev => {
      const existingIndex = prev.findIndex(c => c.id === newChar.id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = newChar;
        return updated;
      } else {
        // Add new
        return [...prev, newChar];
      }
    });
    setEditingChar(null);
    setView('LIST');
    setActiveTab('CHARS'); // Go back to list
  };
  
  const handleSilentUpdateCharacter = (updatedChar: Character) => {
      setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleSaveProfile = (updatedData: Partial<Author>) => {
     setAuthors(prev => prev.map(a => 
        a.id === currentUserId ? { ...a, ...updatedData } : a
     ));
     
     showDialog({
         type: 'alert',
         title: '保存成功',
         message: '个人资料已更新',
         confirmText: '好的',
         onConfirm: () => {
             setView('LIST');
             setActiveTab('ME');
         }
     });
  };

  const handleDeleteCharacter = (charId: string, confirmed: boolean = false) => {
      const performDelete = () => {
        setCharacters(prev => prev.filter(c => c.id !== charId));
        setMessagesMap(prev => {
            const next = { ...prev };
            delete next[charId];
            return next;
        });
        // Also remove from favorites if it was there
        setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(charId);
            return next;
        });
        
        // If we are currently viewing/editing this character, go back to list
        if (view === 'CREATE' || view === 'CHAT' || view === 'CHAR_PROFILE') {
            setView('LIST');
            setEditingChar(null);
        }
      };

      if (confirmed) {
          performDelete();
      } else {
          showDialog({
              type: 'confirm',
              title: '确认删除',
              message: "确定要删除这个角色吗？删除后无法恢复，聊天记录也会被清空。",
              confirmText: "确认删除",
              cancelText: "再想想",
              onConfirm: performDelete
          });
      }
  };

  const handleToggleFavorite = (charId: string) => {
      setFavoriteIds(prev => {
          const next = new Set(prev);
          if (next.has(charId)) {
              next.delete(charId);
          } else {
              next.add(charId);
          }
          return next;
      });
  };

  const handleToggleFollow = (authorId: string) => {
    setFollowingIds(prev => {
        const next = new Set(prev);
        if (next.has(authorId)) {
            next.delete(authorId);
        } else {
            next.add(authorId);
        }
        return next;
    });
  };

  const handleCancelCreate = () => {
    setEditingChar(null);
    // If we were editing from chat, go back to chat or profile, otherwise list
    if (activeCharId && editingChar) {
       // Ideally go back to where we came from, but for simplicity go to chat
       setView('CHAT');
    } else {
       setView('LIST');
    }
  };

  const handleSaveMessages = (msgs: Message[]) => {
    if (activeCharId) {
      setMessagesMap(prev => ({
        ...prev,
        [activeCharId]: msgs
      }));
    }
  };

  const handleClearHistory = () => {
    if (activeCharId) {
      setMessagesMap(prev => {
        const next = { ...prev };
        delete next[activeCharId];
        return next;
      });
    }
  };

  const handleSwitchTab = (tab: TabState) => {
    setActiveTab(tab);
    setView('LIST'); // Ensure we are in the main list view mode
    setPrevView(null);
    
    // Reload models if switching to ME to ensure freshness if we just edited them
    if (tab === 'CHARS') {
        const loadedModels = localStorage.getItem(STORAGE_KEY_MODELS);
        if (loadedModels) {
            try { setSavedModels(JSON.parse(loadedModels)); } catch(e){}
        }
    }
  };

  const handleViewCharacterProfile = () => {
      if (activeCharId) {
          setPrevView(view);
          setView('CHAR_PROFILE');
      }
  };

  const handleBackFromProfile = () => {
      // If we came from chat, go back to chat
      if (prevView === 'CHAT') {
          setView('CHAT');
      } else {
          // Default to list
          setView('LIST');
      }
  };
  
  // Persona Handlers
  const handleSavePersona = (persona: UserPersona) => {
      setUserPersonas(prev => {
          const index = prev.findIndex(p => p.id === persona.id);
          if (index >= 0) {
              const updated = [...prev];
              updated[index] = persona;
              return updated;
          }
          if (prev.length >= 5) return prev; // Max 5 limit check
          return [...prev, persona];
      });
  };

  const handleDeletePersona = (id: string) => {
      setUserPersonas(prev => prev.filter(p => p.id !== id));
  };

  // Memory Handlers
  const handleRegenerateMemory = async (charId: string) => {
      const char = characters.find(c => c.id === charId);
      if (!char) return;

      const msgs = messagesMap[charId] || [];
      // Only summarize actual conversation to create a new memory checkpoint
      const conversation = msgs.filter(m => !m.isMemory);

      if (conversation.length < 2) {
          showDialog({ type: 'alert', message: '对话记录过少，无法生成有效记忆。' });
          return;
      }

      try {
          const summary = await geminiService.summarizeMessages(conversation, char.name);
          if (summary) {
              const newMemory: Message = {
                  id: crypto.randomUUID(),
                  role: 'model',
                  text: summary,
                  timestamp: Date.now(),
                  isMemory: true
              };
              setMessagesMap(prev => ({
                  ...prev,
                  [charId]: [...(prev[charId] || []), newMemory]
              }));
          } else {
              showDialog({ type: 'alert', message: '无法生成记忆，请稍后再试。' });
          }
      } catch (e) {
          console.error(e);
          showDialog({ type: 'alert', message: '生成记忆失败，请检查网络或配置。' });
      }
  };

  const handleDeleteMemory = (charId: string, msgId: string) => {
      setMessagesMap(prev => ({
          ...prev,
          [charId]: (prev[charId] || []).filter(m => m.id !== msgId)
      }));
  };

  // Helper getters
  const activeCharacter = characters.find(c => c.id === activeCharId);
  const activeAuthor = authors.find(a => a.id === activeAuthorId);
  const myCharacters = characters.filter(c => c.authorId === currentUser.id);

  return (
    <DialogContext.Provider value={showDialog}>
      <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#1a1a2e] to-[#0f172a] text-slate-100 flex flex-col mx-auto max-w-md md:max-w-full md:border-x md:border-white/5 shadow-2xl font-sans relative">
        
        {/* Main Content */}
        <div className="flex-1 relative flex flex-col">
            {view === 'LOGIN' && <LoginView onLogin={handleLogin} />}

            {view === 'CHAT' && activeCharacter && (
                <ChatView
                    character={activeCharacter}
                    author={authors.find(a => a.id === activeCharacter.authorId)}
                    initialMessages={messagesMap[activeCharacter.id] || []}
                    savedModels={savedModels}
                    currentUserId={currentUser.id}
                    isFavorited={favoriteIds.has(activeCharacter.id)}
                    userPersonas={userPersonas}
                    historyRoundLimit={historyRoundLimit}
                    onBack={() => setView('LIST')}
                    onEdit={() => handleEditCharacter(activeCharacter)}
                    onSaveMessages={handleSaveMessages}
                    onAuthorClick={handleSelectAuthor}
                    onClearHistory={handleClearHistory}
                    onToggleFavorite={() => handleToggleFavorite(activeCharacter.id)}
                    onViewProfile={handleViewCharacterProfile}
                    onUpdateCharacter={handleSilentUpdateCharacter}
                />
            )}

            {view === 'CHAR_PROFILE' && activeCharacter && (
                <CharacterProfileView
                    character={activeCharacter}
                    author={authors.find(a => a.id === activeCharacter.authorId)}
                    messages={messagesMap[activeCharacter.id] || []}
                    currentUserId={currentUser.id}
                    isFavorited={favoriteIds.has(activeCharacter.id)}
                    onBack={handleBackFromProfile}
                    onChat={() => setView('CHAT')}
                    onEdit={() => handleEditCharacter(activeCharacter)}
                    onToggleFavorite={() => handleToggleFavorite(activeCharacter.id)}
                    onAuthorClick={handleSelectAuthor}
                    onRegenerateMemory={() => handleRegenerateMemory(activeCharacter.id)}
                    onDeleteMemory={(msgId) => handleDeleteMemory(activeCharacter.id, msgId)}
                />
            )}

            {view === 'CREATE' && (
                <CreateView 
                    initialCharacter={editingChar}
                    onSave={handleSaveCharacter} 
                    onCancel={handleCancelCreate} 
                    onDelete={(id) => handleDeleteCharacter(id, true)}
                />
            )}

            {view === 'PROFILE_EDIT' && (
                <ProfileEditView
                    currentUser={currentUser}
                    onSave={handleSaveProfile}
                    onCancel={() => { setView('LIST'); setActiveTab('ME'); }}
                />
            )}
            
            {view === 'FOLLOWERS_LIST' && (
                <UserList
                    title="我的粉丝"
                    users={mockUserList} // Mock users for demo
                    onBack={() => { setView('LIST'); setActiveTab('ME'); }}
                    onUserClick={handleSelectAuthor}
                />
            )}

            {view === 'LIKES_LIST' && (
                <UserList
                    title="收到的赞"
                    users={mockUserList.slice(0, 3)} // Mock users for demo
                    onBack={() => { setView('LIST'); setActiveTab('ME'); }}
                    onUserClick={handleSelectAuthor}
                />
            )}

            {view === 'AUTHOR' && activeAuthor && (
                <AuthorProfileView
                    author={activeAuthor}
                    characters={characters.filter(c => c.authorId === activeAuthor.id && c.isPublished)}
                    isFollowing={followingIds.has(activeAuthor.id)}
                    onBack={() => setView('LIST')}
                    onSelectCharacter={handleSelectCharacter}
                    onToggleFollow={() => handleToggleFollow(activeAuthor.id)}
                />
            )}

            {view === 'SETTINGS' && (
                <SettingsView 
                    historyLimit={historyRoundLimit}
                    onHistoryLimitChange={setHistoryRoundLimit}
                    onBack={() => setView('LIST')}
                />
            )}

            {/* Main Tabs Views */}
            {view === 'LIST' && (
                <main className="flex-1 pb-28">
                    {activeTab === 'CHARS' && (
                        <CharacterList 
                            characters={characters}
                            authors={authors}
                            currentUserId={currentUser.id}
                            favoriteIds={favoriteIds}
                            onSelect={handleSelectCharacter}
                            onAuthorClick={handleSelectAuthor}
                            onToggleFavorite={handleToggleFavorite}
                            onDelete={(id) => handleDeleteCharacter(id, false)}
                        />
                    )}
                    {activeTab === 'AUTHORS' && (
                        <AuthorList
                            authors={authors.filter(a => a.id !== 'user_current')} 
                            onAuthorClick={handleSelectAuthor}
                        />
                    )}
                    {activeTab === 'MSGS' && (
                        <MessageList 
                            characters={characters}
                            messagesMap={messagesMap}
                            onSelect={handleSelectCharacter}
                        />
                    )}
                    {activeTab === 'ME' && (
                        <ProfileView 
                            currentUser={currentUser}
                            characters={characters}
                            myCharacters={myCharacters}
                            favoriteIds={favoriteIds}
                            followingIds={followingIds}
                            authors={authors}
                            userPersonas={userPersonas}
                            onSavePersona={handleSavePersona}
                            onDeletePersona={handleDeletePersona}
                            onSelectCharacter={handleSelectCharacter}
                            onSettingsClick={() => setView('SETTINGS')}
                            onLogout={handleLogout}
                            onDelete={(id) => handleDeleteCharacter(id, false)}
                            onToggleFavorite={handleToggleFavorite}
                            onAuthorClick={handleSelectAuthor}
                            onEditProfile={() => setView('PROFILE_EDIT')}
                            onViewFollowers={() => setView('FOLLOWERS_LIST')}
                            onViewLikes={() => setView('LIKES_LIST')}
                        />
                    )}
                    
                    <BottomNav 
                        currentTab={activeTab} 
                        onSwitch={handleSwitchTab} 
                        onCreate={handleCreateNew}
                    />
                </main>
            )}
        </div>

        {/* Global Dialog Overlay */}
        <ConfirmDialog config={dialogConfig} onClose={closeDialog} />
      </div>
    </DialogContext.Provider>
  );
}
