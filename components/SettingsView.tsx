
import React, { useState, useEffect, useContext } from 'react';
import { SavedModel } from '../types';
import { geminiService } from '../services/geminiService';
import { DialogContext } from '../DialogContext';

interface SettingsViewProps {
  onBack: () => void;
  historyLimit?: number;
  onHistoryLimitChange?: (limit: number) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, historyLimit = 20, onHistoryLimitChange }) => {
  const showDialog = useContext(DialogContext);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [availableModels, setAvailableModels] = useState<SavedModel[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [customModelInput, setCustomModelInput] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  
  // Local state for slider to be smooth
  const [localHistoryLimit, setLocalHistoryLimit] = useState(historyLimit);

  // API Provider State
  const [apiProvider, setApiProvider] = useState<'google' | 'openrouter'>('google');

  useEffect(() => {
    const savedBase = localStorage.getItem('soulsync_api_base') || '';
    setBaseUrl(savedBase);
    setApiKey(localStorage.getItem('soulsync_api_key') || '');
    
    // Infer provider
    if (savedBase.includes('openrouter')) {
        setApiProvider('openrouter');
    }
    
    // Load previously saved models
    const savedModelsJson = localStorage.getItem('soulsync_saved_models');
    if (savedModelsJson) {
      try {
        const saved: SavedModel[] = JSON.parse(savedModelsJson);
        setAvailableModels(saved);
        setSelectedModelIds(new Set(saved.map(m => m.name)));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Auto-fill Base URL when switching to OpenRouter
  useEffect(() => {
    if (apiProvider === 'openrouter') {
        if (!baseUrl || !baseUrl.includes('openrouter')) {
             setBaseUrl('https://openrouter.ai/api/v1');
        }
    } else if (apiProvider === 'google' && baseUrl.includes('openrouter')) {
        setBaseUrl(''); // Clear if switching back to Google defaults
    }
  }, [apiProvider]);

  const handleFetchModels = async () => {
    if (!apiKey) {
      setFetchError("请先输入 API Key");
      return;
    }
    
    setIsLoadingModels(true);
    setFetchError('');
    
    // Force update service config with current input to fetch correctly from the target provider
    geminiService.updateConfig(apiKey, baseUrl);

    try {
      const models = await geminiService.listModels();
      if (models.length === 0) {
        setFetchError("未找到可用模型，请检查 Key 或网络。");
      } else {
        setAvailableModels(models);
        // Do not auto-select all
      }
    } catch (e) {
      setFetchError("获取失败，请检查配置或网络连接。");
      console.error(e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleAddCustomModel = () => {
    const trimmed = customModelInput.trim();
    if (!trimmed) return;
    
    // Check if exists
    if (!availableModels.some(m => m.name === trimmed)) {
        const newModel: SavedModel = { name: trimmed, displayName: trimmed };
        setAvailableModels(prev => [newModel, ...prev]);
    }
    
    // Auto select
    setSelectedModelIds(prev => {
        const next = new Set(prev);
        next.add(trimmed);
        return next;
    });
    
    setCustomModelInput('');
  };

  const toggleModel = (modelName: string) => {
    const newSet = new Set(selectedModelIds);
    if (newSet.has(modelName)) {
      newSet.delete(modelName);
    } else {
      newSet.add(modelName);
    }
    setSelectedModelIds(newSet);
  };

  const handleSave = () => {
    const trimmedBaseUrl = baseUrl.trim();
    const trimmedApiKey = apiKey.trim();

    if (trimmedBaseUrl) {
       localStorage.setItem('soulsync_api_base', trimmedBaseUrl);
    } else {
       localStorage.removeItem('soulsync_api_base');
    }
    
    if (trimmedApiKey) {
       localStorage.setItem('soulsync_api_key', trimmedApiKey);
    } else {
       localStorage.removeItem('soulsync_api_key');
    }

    // Save selected models
    const modelsToSave = availableModels.filter(m => selectedModelIds.has(m.name));
    
    if (modelsToSave.length > 0) {
       localStorage.setItem('soulsync_saved_models', JSON.stringify(modelsToSave));
    } else {
       localStorage.removeItem('soulsync_saved_models');
    }

    // Save history limit
    if (onHistoryLimitChange) {
        onHistoryLimitChange(localHistoryLimit);
    }
    
    // Update service config
    geminiService.updateConfig(trimmedApiKey, trimmedBaseUrl);
    
    showDialog({
        type: 'alert',
        title: '保存成功',
        message: '配置已更新！',
        confirmText: '好的',
        onConfirm: onBack
    });
  };

  const handleReset = () => {
    showDialog({
        type: 'confirm',
        title: '恢复默认',
        message: '确定要清除所有自定义配置并恢复默认设置吗？',
        confirmText: '确认恢复',
        cancelText: '取消',
        onConfirm: () => {
            localStorage.removeItem('soulsync_api_base');
            localStorage.removeItem('soulsync_api_key');
            localStorage.removeItem('soulsync_saved_models');
            setBaseUrl('');
            setApiKey('');
            setAvailableModels([]);
            setSelectedModelIds(new Set());
            setApiProvider('google');
            setLocalHistoryLimit(20);
            if (onHistoryLimitChange) onHistoryLimitChange(20);
            geminiService.updateConfig(); 
            showDialog({ type: 'alert', title: '重置完成', message: '已恢复默认设置' });
        }
    });
  };

  // Filter available models based on search
  const filteredAvailableModels = availableModels.filter(m => 
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) || 
    m.displayName.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e] text-slate-100 font-sans animate-fadeIn">
      
      {/* Fixed Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#1a1a2e]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 text-white/90 hover:text-white transition rounded-full hover:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-lg font-bold tracking-wide">通用设置</h2>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-40 max-w-2xl mx-auto w-full space-y-8 scrollbar-hide">
        
        {/* Chat Settings Section */}
        <div className="space-y-4 border-b border-white/10 pb-6">
            <h3 className="text-sm font-bold text-white mb-2">对话设置</h3>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">历史对话轮数上下文 (Max Rounds)</label>
                   <span className="text-pink-300 font-mono font-bold">{localHistoryLimit}</span>
                </div>
                <input 
                   type="range"
                   min="2"
                   max="50"
                   step="1"
                   value={localHistoryLimit}
                   onChange={(e) => setLocalHistoryLimit(parseInt(e.target.value))}
                   className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <p className="text-[10px] text-gray-500 px-1">每次发送消息时携带的历史记录长度。数值越大记忆越好，但消耗Token更多且可能变慢。</p>
            </div>
        </div>

        {/* API Settings Section */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-white mb-2">API 设置</h3>

            {/* API Provider Switch */}
            <div className="space-y-3">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">服务提供商</label>
                <div className="p-1 bg-black/40 rounded-xl flex border border-white/5">
                    <button 
                    onClick={() => setApiProvider('google')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${apiProvider === 'google' ? 'bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Google Gemini
                    </button>
                    <button 
                    onClick={() => setApiProvider('openrouter')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${apiProvider === 'openrouter' ? 'bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        OpenRouter
                    </button>
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">Base URL</label>
                    <input 
                        type="text" 
                        value={baseUrl}
                        onChange={e => setBaseUrl(e.target.value)}
                        placeholder={apiProvider === 'google' ? "默认 (留空)" : "https://openrouter.ai/api/v1"}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-pink-500/50 outline-none text-sm transition-colors"
                    />
                    <p className="text-[10px] text-gray-500 px-1">若使用代理地址请在此填写</p>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">API Key</label>
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-pink-500/50 outline-none text-sm transition-colors"
                    />
                </div>
            </div>
        </div>

        {/* Model Selection Area */}
        <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">可用模型配置</label>
                <button 
                    onClick={handleFetchModels}
                    disabled={isLoadingModels}
                    className="text-xs bg-pink-500/20 text-pink-300 px-3 py-1.5 rounded-lg hover:bg-pink-500/30 transition flex items-center gap-1.5 font-bold border border-pink-500/20"
                >
                    {isLoadingModels ? (
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                    )}
                    {isLoadingModels ? '获取中...' : '刷新模型列表'}
                </button>
            </div>
            
            {fetchError && <p className="text-xs text-red-300 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{fetchError}</p>}

            {/* Custom Model Input */}
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="添加自定义模型ID (如 gpt-4o)"
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-pink-500/50"
                />
                <button 
                    onClick={handleAddCustomModel}
                    disabled={!customModelInput.trim()}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl disabled:opacity-50 transition border border-white/5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>

            {/* List with Search */}
            <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col h-72">
                {/* Search Bar */}
                <div className="p-2 border-b border-white/5 bg-white/5">
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input 
                            type="text" 
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            placeholder="筛选模型..."
                            className="w-full bg-black/20 border-none rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-pink-500/50 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-1">
                    {availableModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
                            <p className="text-sm text-gray-400">列表为空</p>
                            <p className="text-xs text-gray-600">请配置 API Key 并刷新</p>
                        </div>
                    ) : filteredAvailableModels.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full opacity-50">
                             <p className="text-sm text-gray-400">未找到匹配模型</p>
                         </div>
                    ) : (
                        filteredAvailableModels.map(model => (
                            <label key={model.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedModelIds.has(model.name) ? 'bg-pink-600 border-pink-600' : 'border-gray-600 bg-black/40 group-hover:border-gray-500'}`}>
                                    {selectedModelIds.has(model.name) && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"/></svg>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={selectedModelIds.has(model.name)}
                                    onChange={() => toggleModel(model.name)}
                                    className="hidden"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-200 truncate font-medium group-hover:text-white transition-colors">{model.displayName}</div>
                                    <div className="text-[10px] text-gray-500 truncate font-mono">{model.name}</div>
                                </div>
                            </label>
                        ))
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* Fixed Footer Actions */}
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-[#1a1a2e] z-30">
         <div className="flex gap-4 max-w-2xl mx-auto">
            <button 
                onClick={handleReset}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-3.5 rounded-2xl transition border border-white/5 text-sm"
            >
                恢复默认
            </button>
            <button 
                onClick={handleSave}
                className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-purple-900/30 text-sm active:scale-[0.98]"
            >
                保存配置
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;