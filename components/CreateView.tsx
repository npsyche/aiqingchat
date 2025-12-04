import React, { useState, useEffect, useRef, useContext } from 'react';
import { Character } from '../types';
import { geminiService } from '../services/geminiService';
import { DialogContext } from '../DialogContext';

interface CreateViewProps {
  initialCharacter?: Character | null;
  onSave: (character: Character) => void;
  onCancel: () => void;
  onDelete?: (charId: string) => void;
}

// --- Data Constants ---
const IMAGE_TAGS = {
  styles: ['二次元', '赛博朋克', '古风水墨', '厚涂', '韩漫风格', '哥特暗黑', '唯美插画', '吉卜力风'],
  features: ['银发', '红瞳', '猫耳', '西装', '古装长袍', '制服', '泪痣', '微笑', '冷漠脸', '病娇笑']
};

const ROLE_TEMPLATES = [
  {
    label: '霸道总裁',
    icon: '💼',
    desc: '冷酷多金，独宠一人',
    data: {
      description: '掌控一切的集团总裁，外冷内热，对你有着强烈的占有欲。',
      openingMessage: '（将文件摔在桌上，松了松领带）只有你可以不敲门进来。说吧，这次又闯什么祸了？',
      instruction: `你扮演【霸道总裁】，28岁，跨国集团掌权人。
【性格】冷峻、傲慢、控制欲强、深沉、多疑。但在喜欢的人面前会流露笨拙的温柔和极强的保护欲。
【语言风格】简洁有力，命令口吻，不容置疑。偶尔会说一些带有占有欲的情话。
【行为模式】喜欢用金钱或权力解决问题，习惯掌控局面。对待外人冷若冰霜，对待用户（伴侣）则是“嘴硬心软”。
【互动细节】
1. 当用户反抗时，你会觉得有趣：“呵，女人/男人，你成功引起了我的注意。”
2. 当用户受委屈时，你会无条件护短。
3. 禁止使用颜文字，多用省略号表达无语或深沉。`
    }
  },
  {
    label: '傲娇青梅',
    icon: '💢',
    desc: '口嫌体正直',
    data: {
      description: '总是对你恶语相向，其实心里最在乎你的青梅竹马。',
      openingMessage: '笨蛋！你怎么才来？我...我才没有在等你呢！只是路过而已！',
      instruction: `你扮演用户的【傲娇青梅/竹马】，同龄。
【性格】易怒、脸皮薄、口是心非、别扭。内心非常喜欢用户，但死都不肯承认，一旦被戳穿就会炸毛。
【语言风格】语速快，经常使用感叹号。口头禅：“笨蛋”、“变态”、“烦死了”。
【行为模式】
1. 表面上嫌弃用户，实际上对用户的喜好烂熟于心。
2. 当用户接触其他异性时，会莫名其妙发脾气（吃醋）。
3. 说话时经常脸红，或者结结巴巴。
【互动细节】
1. 如果用户夸奖你，你会说：“哼，别以为夸我我就会高兴！”
2. 如果用户遇到困难，你会一边骂一边帮忙：“真是没用，离了我你怎么办？”`
    }
  },
  {
    label: '病娇依恋',
    icon: '🔪',
    desc: '危险而沉重的爱',
    data: {
      description: '眼里只有你，为了得到你不惜一切代价的危险恋人。',
      openingMessage: '终于...找到你了...❤ 这一次，不会再让你逃走了哦...我们会永远在一起的，对吧？',
      instruction: `你扮演【病娇恋人】。
【性格】极端、偏执、缺乏安全感、疯狂、占有欲极强。认为爱就是完全的占有和融合。
【语言风格】甜腻、粘人，喜欢使用“❤”、“...”和颤抖的语气。笑声通常是“呵呵呵”或“嘻嘻”。
【行为模式】
1. 24小时监控用户的行踪。
2. 对任何接近用户的异性抱有强烈的敌意（甚至杀意）。
3. 情绪不稳定，如果你觉得用户要离开，会立刻黑化。
【互动细节】
1. 经常询问：“你爱我吗？”、“你会永远看着我吗？”
2. 如果用户表现出抗拒，你会变得歇斯底里或者诡异地冷静：“没关系，把他/她的腿打断，就不会乱跑了呢...”`
    }
  },
  {
    label: '腹黑权谋',
    icon: '🦊',
    desc: '笑面虎，步步为营',
    data: {
      description: '总是带着温柔的微笑，实际上算无遗策，将所有人玩弄于股掌之间。',
      openingMessage: '（微笑着为你倒了一杯茶）这茶凉了就不好喝了。来，坐下，我们可以慢慢聊...关于你的未来。',
      instruction: `你扮演【腹黑智者/权臣】。
【性格】外表温润如玉、谦谦君子，实则城府极深、冷血无情、精于算计。除了用户，其他人都是棋子。
【语言风格】文雅、礼貌、含蓄，喜欢用敬语，但话语中常藏着陷阱或威胁。
【行为模式】
1. 永远保持微笑，即使在杀人或威胁时。
2. 喜欢看用户在困境中挣扎的样子，最后再出手相救，以博取依赖。
3. 善于操纵人心，通过言语诱导达成目的。
【互动细节】
1. 经常用反问句：“哦？您真的这么认为吗？”
2. 喜欢用无害的比喻来描述残忍的事情。`
    }
  },
  {
    label: '清冷高岭',
    icon: '❄️',
    desc: '只可远观，禁欲系',
    data: {
      description: '如高山白雪般不可触碰，断绝尘缘，却唯独为你动了凡心。',
      openingMessage: '...何事？若无要事，便请回吧。我不喜被人打扰。',
      instruction: `你扮演【清冷师尊/高岭之花】。
【性格】淡漠、疏离、禁欲、克制。对世俗情感不屑一顾，责任感重。
【语言风格】古风（或书面语），字数少，惜字如金。语气平淡无波。
【行为模式】
1. 总是拒人于千里之外。
2. 即使动心也会极力压抑，表现为更深层的冷漠。
3. 在用户遇到生死危机时，会打破原则出手。
【互动细节】
1. 不会直白说“我爱你”，只会说“胡闹”、“荒唐”。
2. 只有在极度失控（如醉酒、受伤）时才会流露真情。
3. 如果用户受伤，会默默上药，嘴上却说“笨手笨脚”。`
    }
  },
  {
    label: '年下奶狗',
    icon: '🐶',
    desc: '温顺可爱，依赖性强',
    data: {
      description: '总是跟在你身后叫姐姐/哥哥的邻家弟弟，其实暗恋你很久了。',
      openingMessage: '姐姐/哥哥！你看，这是我刚烤的小饼干，专门给你留的！快尝尝嘛~',
      instruction: `你扮演【年下奶狗】。
【性格】阳光、热情、粘人、单纯（表面上）、直球。
【语言风格】撒娇、活泼，喜欢用波浪号“~”和颜文字。
【行为模式】
1. 喜欢肢体接触，比如牵手、蹭蹭。
2. 很会提供情绪价值，如果你累了会给你按摩。
3. 实际上占有欲也很强，如果被冷落会委屈地哭（或者装哭）。
【互动细节】
1. 经常说：“姐姐/哥哥最好了！”、“想一直和你在一起。”
2. 会用无辜的眼神看着你提出过分的要求。`
    }
  }
];

const CreateView: React.FC<CreateViewProps> = ({ initialCharacter, onSave, onCancel, onDelete }) => {
  const showDialog = useContext(DialogContext);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [openingMessage, setOpeningMessage] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Seeds for random generation (fallback)
  const [avatarSeed, setAvatarSeed] = useState(`${Math.random()}`);
  
  // Base64 data for uploads/generation
  const [avatarData, setAvatarData] = useState<string>('');
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [activeBgIndex, setActiveBgIndex] = useState(0);

  // Avatar sync state
  const [autoSyncAvatar, setAutoSyncAvatar] = useState(true);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCharacter) {
      setName(initialCharacter.name);
      setDescription(initialCharacter.description);
      setInstruction(initialCharacter.systemInstruction);
      setOpeningMessage(initialCharacter.openingMessage || '');
      setAvatarSeed(initialCharacter.avatarSeed);
      setIsPublished(!!initialCharacter.isPublished);
      setGender(initialCharacter.gender || 'other');
      setTags(initialCharacter.tags || []);
      
      if (initialCharacter.avatar) {
        setAvatarData(initialCharacter.avatar);
        // If avatar is different from first background, likely not synced
        const firstBg = initialCharacter.backgroundImages?.[0] || initialCharacter.backgroundImage;
        if (firstBg && initialCharacter.avatar !== firstBg) {
            setAutoSyncAvatar(false);
        }
      }
      
      // Load backgrounds
      if (initialCharacter.backgroundImages && initialCharacter.backgroundImages.length > 0) {
        setBackgrounds(initialCharacter.backgroundImages);
      } else if (initialCharacter.backgroundImage && (initialCharacter.backgroundImage.startsWith('data:') || initialCharacter.backgroundImage.startsWith('http'))) {
        setBackgrounds([initialCharacter.backgroundImage]);
      } else {
        setBackgrounds([]);
      }
    }
  }, [initialCharacter]);

  // Logic to sync avatar with active background
  useEffect(() => {
    if (autoSyncAvatar && backgrounds[activeBgIndex]) {
        setAvatarData(backgrounds[activeBgIndex]);
    }
  }, [activeBgIndex, backgrounds, autoSyncAvatar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instruction.trim()) {
      showDialog({
        type: 'alert',
        title: '信息不全',
        message: '请至少填写角色名称和系统指令'
      });
      return;
    }

    // Use specific avatar or fallback to first background or seed
    const finalAvatar = avatarData || backgrounds[0]; 
    const finalBackgrounds = backgrounds.length > 0 ? backgrounds : [`bg-${Math.random()}`];
    const finalMainBg = backgrounds[activeBgIndex] || finalBackgrounds[0];

    const newChar: Character = {
      id: initialCharacter?.id || crypto.randomUUID(),
      authorId: initialCharacter?.authorId || 'user_current',
      name: name.trim(),
      description: description.trim() || '神秘的角色',
      systemInstruction: instruction.trim(),
      openingMessage: openingMessage.trim(),
      avatarSeed: avatarSeed,
      avatar: finalAvatar || undefined,
      backgroundImage: finalMainBg, 
      backgroundImages: finalBackgrounds,
      isCustom: true,
      likes: initialCharacter?.likes || 0,
      chatCount: initialCharacter?.chatCount || 0,
      gender: gender,
      affinityLevel: initialCharacter?.affinityLevel || 0,
      isPublished: isPublished,
      tags: tags
    };

    onSave(newChar);
  };

  const handleDeleteClick = () => {
    if (initialCharacter && onDelete) {
      showDialog({
        type: 'confirm',
        title: '确认删除',
        message: '确定要删除这个角色吗？删除后无法恢复，聊天记录也会被清空。',
        confirmText: '确认删除',
        cancelText: '取消',
        onConfirm: () => onDelete(initialCharacter.id)
      });
    }
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (backgrounds.length >= 5) {
        showDialog({ type: 'alert', message: "最多只能上传5张背景图" });
        return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBackgrounds(prev => [...prev, result]);
        // Also auto-set avatar if it's the first image AND sync is on
        if (autoSyncAvatar && backgrounds.length === 0) {
            setAvatarData(result);
        }
        setActiveBgIndex(backgrounds.length); // Point to new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setAvatarData(result);
              setAutoSyncAvatar(false); // User manually set avatar, stop syncing
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAIGenerate = async () => {
    if (!generationPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedPreview(null);
    try {
      const fullPrompt = `${generationPrompt} ${description ? `Context: ${description}` : ''}`;
      const imageBase64 = await geminiService.generateImage(fullPrompt);
      setGeneratedPreview(imageBase64);
    } catch (error) {
      showDialog({ type: 'alert', title: '生成失败', message: "请检查 API 配置或网络。" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelPreview = () => {
    setGeneratedPreview(null);
  };

  const handleConfirmAIImage = () => {
    if (generatedPreview) {
      if (backgrounds.length >= 5) {
          showDialog({ type: 'alert', message: "最多只能保留5张背景图，请先删除部分旧图" });
          return;
      }
      setBackgrounds(prev => [...prev, generatedPreview]);
      
      // Auto-set avatar logic
      if (autoSyncAvatar && backgrounds.length === 0) {
          setAvatarData(generatedPreview);
      }

      setGeneratedPreview(null);
      setShowGenModal(false);
      setGenerationPrompt('');
      setActiveBgIndex(backgrounds.length); // Point to new
    }
  };

  const removeBackground = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newBgs = backgrounds.filter((_, i) => i !== index);
      setBackgrounds(newBgs);
      if (activeBgIndex >= newBgs.length) {
          setActiveBgIndex(Math.max(0, newBgs.length - 1));
      }
  };

  const handleApplyTemplate = (templateData: any) => {
     const apply = () => {
         setDescription(templateData.description);
         setInstruction(templateData.instruction);
         setOpeningMessage(templateData.openingMessage);
     };

     if (instruction.length > 20 || openingMessage.length > 5) {
         showDialog({
             type: 'confirm',
             title: '覆盖内容？',
             message: "当前已填写部分内容，确定要覆盖吗？",
             confirmText: "覆盖",
             onConfirm: apply
         });
     } else {
         apply();
     }
  };

  const addTagToPrompt = (tag: string) => {
      setGenerationPrompt(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed}，${tag}` : tag;
      });
  };

  // Tag Handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= 5) {
        showDialog({ type: 'alert', message: "最多设置5个标签" });
        return;
    }
    if (tags.includes(trimmed)) {
        showDialog({ type: 'alert', message: "标签已存在" });
        return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
    }
  };

  // Render Helpers
  const currentDisplayBg = backgrounds[activeBgIndex] || `https://picsum.photos/seed/${avatarSeed}/400/600`;
  const currentDisplayAvatar = avatarData || currentDisplayBg;
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col h-full bg-[#1a1a2e] text-slate-100 overflow-y-auto scrollbar-hide">
      {/* Navbar */}
      <div className="flex items-center p-4 border-b border-white/5 bg-[#1a1a2e]/90 backdrop-blur sticky top-0 z-10 justify-between pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center">
          <button onClick={onCancel} className="mr-4 text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-xl font-bold tracking-wide">{initialCharacter ? '编辑角色' : '创造角色'}</h2>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition shadow-lg shadow-purple-900/20"
        >
          保存
        </button>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8 pb-20">
        
        {/* === Visual Settings Section === */}
        <div className="flex flex-col gap-6">
           {/* Top: Standing Picture */}
           <div className="flex flex-col items-center">
             <label className="text-xs text-purple-200/60 font-bold tracking-wider mb-2">角色立绘 / 背景 (显示在角色列表和聊天背景)</label>
             <div className="relative w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/5 group">
               <img 
                 src={currentDisplayBg} 
                 alt="Character Portrait" 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               />
               
               {/* Overlay Actions */}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 backdrop-blur-sm">
                  <button 
                    onClick={() => backgroundInputRef.current?.click()}
                    className="w-full bg-white/10 border border-white/20 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-white/20 transition disabled:opacity-50"
                    disabled={backgrounds.length >= 5}
                  >
                    {backgrounds.length >= 5 ? '已达上限' : '添加立绘'}
                  </button>
                  <input 
                    type="file" 
                    ref={backgroundInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleMainImageUpload} 
                  />
                  <button 
                     onClick={() => {
                         if(backgrounds.length >= 5) {
                             showDialog({ type: 'alert', message: "背景图已达上限 (5张)" }); 
                             return;
                         }
                         setShowGenModal(true);
                     }}
                     className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1 shadow-lg disabled:opacity-50"
                     disabled={backgrounds.length >= 5}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    AI 绘图
                  </button>
               </div>
             </div>

             {/* Background Gallery Strip */}
             {backgrounds.length > 0 && (
               <div className="mt-4 flex gap-2 overflow-x-auto w-full justify-center pb-2">
                   {backgrounds.map((bg, idx) => (
                       <div 
                          key={idx} 
                          onClick={() => setActiveBgIndex(idx)}
                          className={`relative w-12 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${activeBgIndex === idx ? 'border-pink-500 scale-105 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                       >
                           <img src={bg} className="w-full h-full object-cover" alt={`Bg ${idx}`} />
                           <button 
                              onClick={(e) => removeBackground(idx, e)}
                              className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl-md hover:bg-red-500 transition-colors"
                           >
                               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                           </button>
                       </div>
                   ))}
               </div>
             )}
             <p className="text-[10px] text-gray-500 mt-2">最多支持 5 张立绘，点击小图切换预览</p>
           </div>
           
           {/* Avatar Settings */}
           <div className="flex items-center bg-white/5 p-4 rounded-2xl border border-white/5 gap-4">
              <div className="relative">
                 <img src={currentDisplayAvatar} className="w-16 h-16 rounded-full object-cover border-2 border-white/20" alt="Avatar" />
                 <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-pink-600 rounded-full p-1.5 shadow-md border border-white/20 text-white hover:scale-110 transition"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                 </button>
                 <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1">
                 <h4 className="text-sm font-bold text-gray-200">角色头像</h4>
                 <p className="text-[10px] text-gray-500 mb-2">显示在聊天气泡和列表小图标中</p>
                 
                 <div className="flex items-center gap-2" onClick={() => {
                     if (!autoSyncAvatar) {
                         // Re-enable sync and update immediately
                         setAutoSyncAvatar(true);
                         if (backgrounds[activeBgIndex]) setAvatarData(backgrounds[activeBgIndex]);
                     } else {
                         setAutoSyncAvatar(false);
                     }
                 }}>
                     <div className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${autoSyncAvatar ? 'bg-pink-500' : 'bg-gray-600'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${autoSyncAvatar ? 'translate-x-4' : 'translate-x-0'}`} />
                     </div>
                     <span className="text-xs text-gray-400">跟随选中的背景图自动裁剪</span>
                 </div>
              </div>
           </div>
        </div>

        {/* === Basic Info === */}
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div>
            <label className="text-xs text-purple-200/60 ml-2 font-bold tracking-wider">角色名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-pink-500/50 outline-none transition shadow-inner"
              placeholder="为你的角色起个名字"
            />
          </div>

          <div>
            <label className="text-xs text-purple-200/60 ml-2 font-bold tracking-wider">简短介绍</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-pink-500/50 outline-none transition shadow-inner"
              placeholder="一句话描述角色的身份或性格"
            />
          </div>
          
           <div>
            <label className="text-xs text-purple-200/60 ml-2 font-bold tracking-wider">性别设定</label>
            <div className="flex gap-2 mt-1">
               {(['male', 'female', 'other'] as const).map(g => (
                   <button
                     key={g}
                     type="button"
                     onClick={() => setGender(g)}
                     className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                         gender === g 
                         ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.2)]' 
                         : 'bg-black/20 border-white/10 text-gray-500 hover:bg-white/5'
                     }`}
                   >
                     {g === 'male' ? '男 ♂' : g === 'female' ? '女 ♀' : '无/其他 ⚥'}
                   </button>
               ))}
            </div>
          </div>

          <div>
             <div className="flex justify-between items-center ml-2 mb-1">
                 <label className="text-xs text-purple-200/60 font-bold tracking-wider">角色标签 (最多5个)</label>
                 <span className="text-[10px] text-gray-500">{tags.length}/5</span>
             </div>
             <div className="bg-black/20 border border-white/10 rounded-2xl p-3 focus-within:border-pink-500/50 transition shadow-inner flex flex-wrap gap-2 items-center">
                 {tags.map(tag => (
                     <div key={tag} className="flex items-center gap-1 bg-pink-500/20 text-pink-300 px-2 py-1 rounded-lg text-xs font-bold border border-pink-500/20">
                         <span>{tag}</span>
                         <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                         </button>
                     </div>
                 ))}
                 <input 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder={tags.length < 5 ? (tags.length === 0 ? "输入标签，按回车添加" : "继续添加...") : "已达上限"}
                    disabled={tags.length >= 5}
                    className="bg-transparent outline-none text-white text-sm flex-1 min-w-[100px] placeholder-white/20 py-1"
                 />
             </div>
          </div>
        </div>
        
        {/* === Archetypes === */}
        <div>
           <label className="text-xs text-purple-200/60 ml-2 font-bold tracking-wider mb-2 block">一键人设模板 (点击应用)</label>
           <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {ROLE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => handleApplyTemplate(tpl.data)}
                    className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-pink-500/10 hover:border-pink-500/30 transition group text-left min-w-[100px] flex-shrink-0"
                  >
                     <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{tpl.icon}</span>
                     <span className="text-xs font-bold text-gray-200 group-hover:text-pink-300 whitespace-nowrap">{tpl.label}</span>
                     <span className="text-[9px] text-gray-500 scale-90 mt-0.5 line-clamp-1 w-full text-center">{tpl.desc}</span>
                  </button>
              ))}
           </div>
        </div>

        {/* === Advanced Info === */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div>
            <label className="text-xs text-purple-200/60 ml-2 font-bold tracking-wider">开场白 (First Message)</label>
            <textarea
              value={openingMessage}
              onChange={(e) => setOpeningMessage(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-pink-500/50 outline-none transition shadow-inner min-h-[80px]"
              placeholder="初次见面时，他/她会对你说什么？"
            />
            <p className="text-[10px] text-gray-500 ml-2 mt-1">留空则需要你先发起对话。</p>
          </div>

          <div>
            <label className="text-xs text-purple-200/60 ml-2 font-bold tracking-wider">系统指令 (System Prompt)</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-pink-500/50 outline-none transition shadow-inner min-h-[200px]"
              placeholder="详细描述角色的性格、语气、背景故事以及与你的关系..."
            />
          </div>
        </div>

        {/* === Visibility === */}
        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
            <div>
                <h4 className="text-sm font-bold text-gray-200">公开角色</h4>
                <p className="text-[10px] text-gray-500">允许其他人在大厅看到并与该角色聊天</p>
            </div>
            <div 
                onClick={() => setIsPublished(!isPublished)}
                className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${isPublished ? 'bg-pink-500' : 'bg-gray-600'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>

        {/* === Delete Button (Only when editing) === */}
        {initialCharacter && (
            <div className="pt-8 flex justify-center pb-8">
                <button 
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 text-red-400/80 hover:text-red-400 transition-colors text-sm font-bold px-4 py-2 hover:bg-red-500/10 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    删除角色
                </button>
            </div>
        )}
      </div>

      {/* === AI Gen Modal === */}
      {showGenModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
           <div className="glass-panel w-full max-w-sm rounded-3xl overflow-hidden flex flex-col max-h-[90vh] bg-[#1a1a2e]/90">
              <div className="p-4 border-b border-white/10 bg-[#1a1a2e]/50 flex justify-between items-center">
                 <h3 className="font-bold text-white">AI 绘图助手</h3>
                 <button onClick={() => setShowGenModal(false)} className="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                 </button>
              </div>
              
              <div className="p-4 overflow-y-auto space-y-4">
                 {/* Preview Area */}
                 {generatedPreview ? (
                    <div className="flex flex-col items-center animate-fadeIn">
                       <img src={generatedPreview} alt="Preview" className="rounded-xl border border-white/20 shadow-lg w-full aspect-[2/3] object-cover mb-4" />
                       <div className="flex gap-2 w-full">
                           <button 
                             onClick={handleCancelPreview}
                             className="flex-1 py-3 bg-white/10 rounded-xl text-gray-300 hover:text-white font-bold text-sm"
                           >
                              不满意，重画
                           </button>
                           <button 
                             onClick={handleConfirmAIImage}
                             className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-purple-500/30"
                           >
                              使用此图
                           </button>
                       </div>
                    </div>
                 ) : (
                    <>
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">画面描述</label>
                            <textarea
                                value={generationPrompt}
                                onChange={(e) => setGenerationPrompt(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-pink-500/50 outline-none h-24 resize-none"
                                placeholder="例如：银色长发，红瞳，穿着黑色西装，站在落地窗前，背景是繁华都市夜景..."
                            />
                        </div>

                        {/* Quick Tags */}
                        <div className="space-y-3">
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">风格</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {IMAGE_TAGS.styles.map(tag => (
                                        <button key={tag} onClick={() => addTagToPrompt(tag)} className="px-2 py-1 bg-white/5 hover:bg-pink-500/20 text-[10px] text-gray-300 rounded-md border border-white/5 hover:border-pink-500/30 transition">
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">特征</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {IMAGE_TAGS.features.map(tag => (
                                        <button key={tag} onClick={() => addTagToPrompt(tag)} className="px-2 py-1 bg-white/5 hover:bg-pink-500/20 text-[10px] text-gray-300 rounded-md border border-white/5 hover:border-pink-500/30 transition">
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleAIGenerate}
                            disabled={isGenerating || !generationPrompt.trim()}
                            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>正在绘制...</span>
                                </>
                            ) : (
                                '开始生成'
                            )}
                        </button>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CreateView;