import React from 'react';
import { DialogConfig } from '../types';

interface ConfirmDialogProps {
  config: DialogConfig;
  onClose: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ config, onClose }) => {
  if (!config.isOpen) return null;

  const handleConfirm = () => {
    if (config.onConfirm) config.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-[#1a1a2e]/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-slideUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 pb-2 text-center">
          {config.title && (
            <h3 className="text-xl font-bold text-white mb-2 tracking-wide">{config.title}</h3>
          )}
          <p className="text-gray-300 text-sm leading-relaxed">{config.message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-6">
          {config.type === 'confirm' && (
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition border border-white/5 text-sm"
            >
              {config.cancelText || '取消'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-white text-sm shadow-lg transition transform active:scale-95 ${
              config.type === 'confirm' 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 shadow-purple-900/30' 
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
          >
            {config.confirmText || '确定'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
