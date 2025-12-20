
import React, { useState } from 'react';
import { backend } from '../services/backend';
import { LockIcon, UserIcon } from './Icons';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
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
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 flex items-center justify-center mx-auto mb-6 transform rotate-3">
             <LockIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">FitGenius AI</h1>
          <p className="text-slate-500 font-medium">您的智能私教，数据由您掌握</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex p-1 bg-slate-50 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              登录
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">用户名</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="请输入您的账号"
                  required
                />
                <UserIcon className="absolute right-4 top-4 w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">密码</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <LockIcon className="absolute right-4 top-4 w-5 h-5 text-slate-300" />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-500 text-xs font-bold p-4 rounded-xl animate-shake">
                 ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-indigo-300"
            >
              {loading ? <Spinner /> : isLogin ? '立即进入' : '创建账号'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          数据采用私有云存储，仅您本人可见
        </p>
      </div>
    </div>
  );
};
