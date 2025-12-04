import React, { useState, useRef, useContext } from 'react';
import { Author } from '../types';
import { DialogContext } from '../DialogContext';

interface ProfileEditViewProps {
  currentUser: Author;
  onSave: (updatedData: Partial<Author>) => void;
  onCancel: () => void;
}

const ProfileEditView: React.FC<ProfileEditViewProps> = ({ currentUser, onSave, onCancel }) => {
  const showDialog = useContext(DialogContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [description, setDescription] = useState(currentUser.description);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [isCustomAvatar, setIsCustomAvatar] = useState(currentUser.avatar.startsWith('data:'));

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2MB Limit
    if (file.size > 2 * 1024 * 1024) {
      showDialog({
        type: 'alert',
        title: '图片过大',
        message: '请上传小于 2MB 的图片文件。'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatar(result);
      setIsCustomAvatar(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showDialog({
        type: 'alert',
        message: '昵称不能为空'
      });
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      avatar: avatar
    });
  };

  // Helper to determine image source
  const displayAvatar = isCustomAvatar 
    ? avatar 
    : `https://picsum.photos/seed/${avatar}/200/200`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e] text-slate-100 font-sans animate-fadeIn">
      {/* Navbar */}
      <div className="flex items-center justify-between p-4 bg-[#1a1a2e]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button 
          onClick={onCancel} 
          className="p-2 -ml-2 text-white/90 hover:text-white transition rounded-full hover:bg-white/10"
        >
          <span className="text-sm font-bold text-gray-400">取消</span>
        </button>
        <h2 className="text-lg font-bold tracking-wide">编辑资料</h2>
        <button 
          onClick={handleSave}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition shadow-lg shadow-purple-900/20"
        >
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-20 max-w-lg mx-auto w-full space-y-8">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl relative">
              <img 
                src={displayAvatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-pink-600 rounded-full p-2 border-2 border-[#1a1a2e] shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">点击更换头像 (最大 2MB)</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-xs text-purple-200/60 font-bold tracking-wider ml-1">昵称</label>
             <input
               value={name}
               onChange={(e) => setName(e.target.value)}
               maxLength={20}
               className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-pink-500/50 outline-none transition shadow-inner"
               placeholder="请输入昵称"
             />
          </div>

          <div className="space-y-2">
             <div className="flex justify-between ml-1">
                <label className="text-xs text-purple-200/60 font-bold tracking-wider">个性签名</label>
                <span className={`text-xs ${description.length > 150 ? 'text-red-400' : 'text-gray-500'}`}>
                   {description.length}/150
                </span>
             </div>
             <textarea
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               maxLength={150}
               className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-pink-500/50 outline-none transition shadow-inner min-h-[120px] resize-none"
               placeholder="写一句展示个性的签名吧..."
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditView;
