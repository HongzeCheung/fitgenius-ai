import React, { useEffect, useMemo, useState } from 'react';
import { backend } from '../services/backend';
import backgroundImage from '../background.jpg';

interface AuthProps {
  onSuccess: () => Promise<void> | void;
}

type AuthSequence = 'idle' | 'scanning' | 'breach';

// 性能优化: 轻量级占位背景
const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #1a1a2e 100%)';

const protocolTags = [
  { label: 'Adaptive Training', tone: 'cyan' },
  { label: 'AI Coaching', tone: 'pink' },
  { label: 'Cloud Sync', tone: 'slate' },
] as const;

const particles = Array.from({ length: 16 }, (_, index) => ({
  left: `${4 + index * 6}%`,
  delay: `${(index % 5) * -1.3}s`,
  duration: `${9 + (index % 6) * 1.2}s`,
  height: `${24 + (index % 4) * 26}px`,
  opacity: 0.18 + (index % 3) * 0.1,
}));

const createHexCode = () => `0x${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authSequence, setAuthSequence] = useState<AuthSequence>('idle');
  const [error, setError] = useState<string | null>(null);
  const [keepLinked, setKeepLinked] = useState(true);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hexCodes, setHexCodes] = useState(() => protocolTags.map(() => createHexCode()));
  
  // 性能优化: 渐进式图片加载
  const [imageLoaded, setImageLoaded] = useState(false);

  const passwordCriteria = useMemo(
    () => ({
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password]
  );

  const isPasswordSecure = isLogin ? true : passwordCriteria.length && passwordCriteria.hasNumber;

  // 性能优化: 异步加载背景图片
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      setImageLoaded(true);
      console.log('[Performance] Background image loaded');
    };
    img.onerror = () => {
      console.warn('[Performance] Background image failed to load, using placeholder');
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHexCodes(protocolTags.map(() => createHexCode()));
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!loading) {
      setAuthSequence('idle');
      return;
    }

    setAuthSequence('scanning');
    const timerId = window.setTimeout(() => {
      setAuthSequence(current => (current === 'scanning' ? 'breach' : current));
    }, 240);

    return () => window.clearTimeout(timerId);
  }, [loading]);

  const handleSceneMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 18;
    setParallax({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (!isLogin && !isPasswordSecure) {
      setError('注册协议要求密码至少 8 位且包含数字。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startedAt = performance.now();

      if (isLogin) {
        await backend.login(username, password);
      } else {
        await backend.register(username, password);
      }

      const elapsed = performance.now() - startedAt;
      if (elapsed < 420) {
        await new Promise(resolve => window.setTimeout(resolve, 420 - elapsed));
      }

      await onSuccess();
    } catch (err: any) {
      setError(err.message || '协议验证失败，请稍后重试。');
      setLoading(false);
    }
  };

  const isProtocolArmed = authSequence !== 'idle';
  const submitLabel = loading
    ? authSequence === 'scanning'
      ? 'Laser Scan...'
      : 'Executing...'
    : isLogin
      ? 'Submit Protocol'
      : 'Create Protocol';
  const statusLabel = authSequence === 'scanning'
    ? 'Neural lattice scanning // 建立神经链路'
    : 'Handshake accepted // 正在接入主站网格';

  return (
    <div
      className={`auth-stage-shell relative min-h-screen overflow-hidden bg-[#050505] text-white ${isProtocolArmed ? `auth-stage-active auth-stage-${authSequence}` : ''}`}
      onMouseMove={handleSceneMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(${parallax.x * -0.3}px, ${parallax.y * -0.3}px, 0) scale(1.05)` }}
      >
        <div
          className={`auth-background-layer h-full w-full bg-cover bg-center bg-no-repeat transition-all duration-700 ${isProtocolArmed ? `auth-background-layer-${authSequence}` : ''}`}
          style={{ 
            backgroundImage: imageLoaded ? `url(${backgroundImage})` : PLACEHOLDER_GRADIENT,
            opacity: imageLoaded ? 1 : 0.95
          }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top, rgba(0, 243, 255, 0.12), transparent 30%), linear-gradient(90deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.45) 45%, rgba(0, 0, 0, 0.72))',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ transform: `translate3d(${parallax.x * -0.12}px, ${parallax.y * -0.12}px, 0)` }}
      >
        <div className={`auth-grid-layer h-full w-full bg-grid opacity-80 ${isProtocolArmed ? `auth-grid-layer-${authSequence}` : ''}`} />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle, index) => (
          <span
            key={`${particle.left}-${index}`}
            className="cyber-particle"
            style={{
              left: particle.left,
              height: particle.height,
              opacity: particle.opacity,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      <div
        className="pointer-events-none fixed left-0 top-0 h-full w-full opacity-30"
        style={{ transform: `translate3d(${parallax.x * 0.15}px, ${parallax.y * 0.15}px, 0)` }}
      >
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-cyan-500 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-pink-500 blur-[120px]" />
      </div>

      <div className={`pointer-events-none absolute inset-0 overflow-hidden auth-cinematic-overlay ${isProtocolArmed ? 'auth-cinematic-overlay-active' : ''}`}>
        <div className="auth-cinematic-darken" />
        <div className="auth-cinematic-vignette" />
        <div className="auth-cinematic-beam" />
        <div className="auth-cinematic-noise" />
        <div className="auth-cinematic-speedlines" />
      </div>

      <main className={`auth-mainframe relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-4 py-8 md:grid-cols-[1.05fr_0.95fr] ${isProtocolArmed ? `auth-mainframe-${authSequence}` : ''}`}>
        <section
          className="space-y-7"
          style={{ transform: `translate3d(${parallax.x * 0.2}px, ${parallax.y * 0.2}px, 0)` }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border-2 border-cyan-400 rotate-45 shadow-[0_0_24px_rgba(0,243,255,0.22)]">
              <span className="font-orbitron neon-text -rotate-45 text-2xl font-bold">N</span>
            </div>
            <div>
              <h1 className="font-orbitron text-3xl font-bold uppercase text-white md:text-[2.2rem]">
                <span className="tracking-[0.22em]">FIT</span>{' '}
                <span className="signal-word tracking-[0.22em]" data-text="GENNIUS">
                  GENNIUS
                </span>
              </h1>
              <p className="font-orbitron text-xs uppercase tracking-[0.38em] text-slate-400/80">
                Fit Gennius Access Portal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-orbitron neon-text text-5xl font-bold italic uppercase leading-[0.95] md:text-7xl">
              Ascend.
              <br />
              Evolve.
              <br />
              Conquer.
            </h2>
          </div>

          <div className="story-shield max-w-lg rounded-r-3xl border-l-2 border-pink-500/80 px-5 py-4">
            <p className="story-copy text-lg leading-relaxed text-slate-200/95">
              解锁你的数字潜能。在虚拟网络中重塑肉身极限，让每一卡路里都转化为计算力。
            </p>
          </div>

          <div className="grid max-w-xl gap-3 pt-2 sm:grid-cols-3">
            {protocolTags.map((tag, index) => (
              <div
                key={tag.label}
                className={`tag-panel ${tag.tone === 'cyan' ? 'tag-panel-cyan' : tag.tone === 'pink' ? 'tag-panel-pink' : 'tag-panel-slate'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-orbitron text-[11px] uppercase tracking-[0.16em] text-white/90">
                    {tag.label}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${tag.tone === 'cyan' ? 'bg-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.8)]' : tag.tone === 'pink' ? 'bg-pink-400 shadow-[0_0_12px_rgba(255,0,255,0.7)]' : 'bg-slate-300 shadow-[0_0_10px_rgba(255,255,255,0.45)]'}`}
                  />
                </div>
                <span className="mt-2 block font-orbitron text-[10px] tracking-[0.3em] text-slate-500">
                  {hexCodes[index]}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="glass-panel panel-entity p-8 md:p-12"
          style={{ transform: `translate3d(${parallax.x * -0.22}px, ${parallax.y * -0.22}px, 0)` }}
        >
          <div className="panel-static" />
          <div className="panel-energy" />
          <div className="corner-accent left-0 top-0 border-b-0 border-r-0" />
          <div className="corner-accent bottom-0 right-0 border-l-0 border-t-0" />

          <div className="relative z-10">
            <div className="mb-8">
              <h3 className="font-orbitron text-2xl font-bold uppercase tracking-[0.16em] text-cyan-400">
                {isLogin ? 'Access Your Protocol' : 'Initialize Protocol'}
              </h3>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {isLogin ? 'Authorized Personal Only // 身份验证' : 'Create New Link // 初始化身份'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Neon ID / Email
                </label>
                <div className="input-shell">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="输入您的神经链路标识"
                    autoComplete="username"
                    disabled={loading}
                    className="cyber-input w-full p-4 text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Access Key / Password
                </label>
                <div className="input-shell">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    disabled={loading}
                    className="cyber-input w-full p-4 text-sm text-white"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2 border-l-2 border-cyan-500/40 pl-4 text-sm text-slate-400">
                  <p className={passwordCriteria.length ? 'text-cyan-300' : ''}>至少 8 位字符</p>
                  <p className={passwordCriteria.hasNumber ? 'text-cyan-300' : ''}>至少包含 1 个数字</p>
                  <p className={passwordCriteria.hasSymbol ? 'text-pink-300' : ''}>建议加入符号增强安全性</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={keepLinked}
                    onChange={e => setKeepLinked(e.target.checked)}
                    disabled={loading}
                    className="accent-cyan-500"
                  />
                  {isLogin ? '保持同步链接' : '创建后保持同步链接'}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    isLogin
                      ? setError('暂未开放密钥重置链路。')
                      : setIsLogin(true)
                  }
                  disabled={loading}
                  className="text-cyan-400 transition hover:text-pink-500"
                >
                  {isLogin ? '丢失密钥？' : '已有协议？'}
                </button>
              </div>

              {error && (
                <div className="border border-pink-500/30 bg-pink-500/10 px-4 py-3 text-sm text-pink-100 shadow-[0_0_18px_rgba(255,0,255,0.12)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isPasswordSecure}
                className={`btn-scan ${loading ? `btn-scan-engaged btn-scan-engaged-${authSequence}` : ''} ${isLogin ? 'btn-scan-cyan shadow-cyan-500/30' : 'btn-scan-pink shadow-pink-500/30'} w-full py-4 font-orbitron text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {submitLabel}
              </button>

              {loading && (
                <div className="protocol-status-rail">
                  <span className="protocol-status-ping" />
                  <span className="font-orbitron text-[11px] uppercase tracking-[0.22em] text-cyan-200/90">
                    {statusLabel}
                  </span>
                </div>
              )}
            </form>

            <div className="mt-6 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                disabled={loading}
                className={`protocol-toggle ${isLogin ? 'protocol-toggle-pink' : 'protocol-toggle-cyan'} w-full`}
              >
                {isLogin ? 'Initialize Protocol' : 'Return To Access'}
              </button>
              <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-slate-500">
                {isLogin ? 'New To The Grid?' : 'Back To Access Your Protocol'}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
