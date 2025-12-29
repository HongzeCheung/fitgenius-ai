import React, { useState, useMemo } from 'react';
import { backend } from '../services/backend';
import { LockIcon, UserIcon, CheckCircleIcon } from './Icons';
import { Spinner } from './Spinner';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 密码强度校验逻辑
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }, [password]);

  const isPasswordSecure = !isLogin ? (passwordCriteria.length && passwordCriteria.hasNumber) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    if (!isLogin && !isPasswordSecure) {
      setError('为了您的安全，请设置符合要求的密码');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        await backend.login(username, password);
      } else {
        await backend.register(username, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F5F8] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3 transition-colors duration-500 ${isLogin ? 'bg-indigo-600 shadow-indigo-200' : 'bg-purple-600 shadow-purple-200'}`}>
             <LockIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">FitGenius AI</h1>
          <p className="text-slate-500 font-medium">{isLogin ? '您的智能私教，数据由您掌握' : '开启您的数字化健身体验'}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex p-1 bg-slate-50 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              登录
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              快速注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">用户名</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="创建您的账号名称"
                  required
                />
                <UserIcon className="absolute right-4 top-4 w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">设置密码</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 focus:ring-2 outline-none transition-all font-medium ${isLogin ? 'focus:ring-indigo-500' : 'focus:ring-purple-500'}`}
                  placeholder="••••••••"
                  required
                />
                <LockIcon className="absolute right-4 top-4 w-5 h-5 text-slate-300" />
              </div>
              
              {/* 注册专属：密码强度提示 */}
              {!isLogin && (
                <div className="mt-3 px-1 space-y-2">
                   <div className="flex gap-1 h-1">
                      <div className={`flex-1 rounded-full transition-colors ${password.length > 0 ? (passwordCriteria.length ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-200'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${passwordCriteria.length && passwordCriteria.hasNumber ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${passwordCriteria.hasSymbol ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
                   </div>
                   <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <p className={`text-[10px] flex items-center gap-1 font-bold ${passwordCriteria.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {passwordCriteria.length && <CheckCircleIcon className="w-3 h-3" />} 至少8位字符
                      </p>
                      <p className={`text-[10px] flex items-center gap-1 font-bold ${passwordCriteria.hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {passwordCriteria.hasNumber && <CheckCircleIcon className="w-3 h-3" />} 包含数字
                      </p>
                      <p className={`text-[10px] flex items-center gap-1 font-bold ${passwordCriteria.hasSymbol ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {passwordCriteria.hasSymbol && <CheckCircleIcon className="w-3 h-3" />} 建议包含符号
                      </p>
                   </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-500 text-xs font-bold p-4 rounded-xl animate-shake">
                 ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (!isLogin && !isPasswordSecure)}
              className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 ${isLogin ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100'}`}
            >
              {loading ? <Spinner /> : isLogin ? '立即登录' : '创建安全账号'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-8 font-bold uppercase tracking-widest">
          {isLogin ? '数据采用私有云存储' : '注册即表示您同意隐私保护协议'}
        </p>
      </div>
    </div>
  );
};
