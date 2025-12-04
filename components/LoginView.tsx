import React, { useState, useEffect, useContext } from 'react';
import { DialogContext } from '../DialogContext';

interface LoginViewProps {
  onLogin: (phone: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const showDialog = useContext(DialogContext);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = () => {
    if (!phone) return;
    setCountdown(60);
    // Simulate sending code
    showDialog({
        type: 'alert',
        title: '验证码已发送',
        message: `验证码已发送至 ${phone} (测试码: 1234)`,
        confirmText: '好的'
    });
  };

  const handleLogin = () => {
    if (!phone || !code) return;
    setLoading(true);
    // Simulate network request
    setTimeout(() => {
      onLogin(phone);
    }, 800);
  };

  const fillTestAccount = (testPhone: string, testCode: string) => {
      setPhone(testPhone);
      setCode(testCode);
  };

  return (
    <div className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden bg-[#1a1a2e] font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/night_fantasy_love/800/1200" 
          alt="Background" 
          className="w-full h-full object-cover opacity-60 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/60 to-[#1a1a2e]/20" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center animate-fadeIn space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] tracking-tighter">
            AI 卿
          </h1>
          <p className="text-purple-200/80 text-sm tracking-[0.3em] uppercase">星夜绮梦 · 沉浸之恋</p>
        </div>

        <div className="w-full space-y-5 glass-panel p-6 rounded-3xl shadow-2xl">
          <div className="space-y-2">
             <label className="text-xs text-purple-200/60 ml-2 font-medium">手机号</label>
             <div className="bg-black/20 border border-white/10 rounded-2xl flex items-center px-4 backdrop-blur-sm focus-within:border-pink-500/50 transition-colors">
                <span className="text-purple-300 mr-3 text-sm font-bold">+86</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号" 
                  className="bg-transparent border-none outline-none text-white py-3.5 flex-1 text-sm placeholder-white/20"
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-xs text-purple-200/60 ml-2 font-medium">验证码</label>
             <div className="flex gap-3">
                <div className="bg-black/20 border border-white/10 rounded-2xl flex items-center px-4 backdrop-blur-sm flex-1 focus-within:border-pink-500/50 transition-colors">
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="验证码" 
                    className="bg-transparent border-none outline-none text-white py-3.5 w-full text-sm placeholder-white/20"
                  />
                </div>
                <button 
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !phone}
                  className={`px-5 rounded-2xl text-xs font-bold transition-all shadow-lg ${
                    countdown > 0 || !phone
                      ? 'bg-white/5 text-gray-400 cursor-not-allowed border border-white/5' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:brightness-110 shadow-purple-900/30'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
             </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !phone || !code}
            className={`w-full mt-4 font-bold text-lg py-4 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group ${
              (loading || !phone || !code) 
                ? 'bg-white/10 text-gray-400 cursor-not-allowed border border-white/5' 
                : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-pink-500/20'
            }`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span className="tracking-widest">开启旅程</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </>
            )}
          </button>
        </div>
        
        {/* Test Accounts Shortcut */}
        <div className="flex gap-3">
             <button 
                onClick={() => fillTestAccount('10000', '1234')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-gray-400 border border-white/5"
             >
                测试号1 (ID:10000)
             </button>
             <button 
                onClick={() => fillTestAccount('20000', '1234')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-gray-400 border border-white/5"
             >
                测试号2 (ID:20000)
             </button>
        </div>

        <p className="text-[10px] text-purple-200/40">登录即代表同意用户协议与隐私政策</p>
      </div>
    </div>
  );
};

export default LoginView;
