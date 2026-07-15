import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cloud, Sparkles, ShieldCheck, DatabaseZap } from 'lucide-react';
import { handleRedirectSignIn, getAuthenticatedUser, initializeCloudApp, signInWithGoogle, getGoogleAccessToken } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { cloudStorageEngine } from '../services/storage';

const providers = [
  { id: 'drive', name: 'Google Drive', description: 'Connect your Drive folder as the source of truth.', available: true },
  { id: 'onedrive', name: 'Microsoft OneDrive', description: 'Use OneDrive for persistent knowledge sync.', available: false },
  { id: 'dropbox', name: 'Dropbox', description: 'Keep your workspace in Dropbox-backed folders.', available: false }
] as const;

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const firstBootRef = useRef(true); // Track if this is the very first boot in this browser session
  const [selectedProvider, setSelectedProvider] = useState<(typeof providers)[number]['id']>('drive');
  const [status, setStatus] = useState('Preparing your cloud workspace...');
  const [isReady, setIsReady] = useState(false);
  const [authPending, setAuthPending] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;
    
    const bootCloudApp = async () => {
      console.log('[WelcomePage] bootCloudApp starting...');
      console.log('[WelcomePage] firstBootRef.current:', firstBootRef.current);
      
      try {
        console.log('[WelcomePage] Initializing cloud app...');
        const { auth } = await initializeCloudApp();
        console.log('[WelcomePage] Cloud app initialized');
        
        setStatus('Checking for existing session...');
        
        // ALWAYS check for redirect result on every load (don't cache it)
        // React StrictMode will call this twice, but Firebase will clear result after first call
        console.log('[WelcomePage] Checking for redirect result...');
        const redirectUser = await handleRedirectSignIn();
        console.log('[WelcomePage] Redirect user result:', redirectUser?.email || 'none');
        
        if (redirectUser) {
          console.log('[WelcomePage] Redirect auth detected, connecting to storage...');
          setStatus('Google authentication complete. Connecting your cloud workspace...');
          try {
            await cloudStorageEngine.connect(selectedProvider);
            console.log('[WelcomePage] Storage connected successfully');
            await cloudStorageEngine.initializeUniverse('My Constella');
            console.log('[WelcomePage] Universe initialized, navigating to /home');
            navigate('/home');
          } catch (connectError) {
            console.error('[WelcomePage] Failed to connect cloud storage after redirect', connectError);
            setStatus(`Connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`);
            setIsReady(true);
          }
          return;
        }

        // Only on the very first boot, check for existing authenticated user
        if (firstBootRef.current) {
          console.log('[WelcomePage] First boot - checking for pre-existing authenticated user...');
          firstBootRef.current = false;
          
          const existingUser = await getAuthenticatedUser();
          console.log('[WelcomePage] Existing authenticated user:', existingUser?.email || 'none');
          
          if (existingUser) {
            console.log('[WelcomePage] User already authenticated, connecting to storage...');
            setStatus('Already signed in. Connecting your cloud workspace...');
            try {
              if (!cloudStorageEngine.isConnected()) {
                await cloudStorageEngine.connect(selectedProvider);
                console.log('[WelcomePage] Storage connected successfully');
                await cloudStorageEngine.initializeUniverse('My Constella');
              }
              console.log('[WelcomePage] Navigating to /home');
              navigate('/home');
            } catch (connectError) {
              console.error('[WelcomePage] Failed to connect cloud storage', connectError);
              setStatus(`Connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`);
              setIsReady(true);
            }
            return;
          }
        }

        // Set up auth state listener as fallback for redirect auth
        // This catches auth state changes that might not be captured by getRedirectResult()
        console.log('[WelcomePage] Setting up auth state listener...');
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          console.log('[WelcomePage] onAuthStateChanged triggered, user:', user?.email || 'none');
          
          // Only attempt storage connection if we have a token.
          // For popup sign-ins, the token is set right after the popup resolves.
          const token = await getGoogleAccessToken();
          
          if (user && !redirectUser && token) {
            // Auth state changed (likely from redirect) but getRedirectResult didn't catch it
            console.log('[WelcomePage] Auth state changed to:', user.email);
            setStatus('Google authentication complete. Connecting your cloud workspace...');
            try {
              await cloudStorageEngine.connect(selectedProvider);
              console.log('[WelcomePage] Storage connected successfully (from auth state listener)');
              await cloudStorageEngine.initializeUniverse('My Constella');
              console.log('[WelcomePage] Universe initialized, navigating to /home');
              navigate('/home');
            } catch (connectError) {
              console.error('[WelcomePage] Failed to connect cloud storage (from auth state)', connectError);
              setStatus(`Connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`);
              setIsReady(true);
            }
          }
        });

        // No redirect result and not pre-authenticated; ready for user to click button
        console.log('[WelcomePage] No auth detected, ready for user sign-in');
        console.log('[WelcomePage] Setting status and marking ready');
        setStatus('Ready to sign in with Google');
        setIsReady(true);
        console.log('[WelcomePage] isReady set to true');
      } catch (error) {
        console.error('[WelcomePage] Exception caught in bootCloudApp:', error);
        console.error('[WelcomePage] Cloud init failed', error);
        setStatus(`Init error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsReady(true);
      }
      
      console.log('[WelcomePage] bootCloudApp completed');
    };

    bootCloudApp();

    return () => {
      if (unsubscribeAuth) {
        console.log('[WelcomePage] Unsubscribing from auth state listener');
        unsubscribeAuth();
      }
    };
  }, [navigate, selectedProvider]);

  const handleContinue = async () => {
    setAuthPending(true);
    setStatus('Signing in with Google...');
    console.log('[WelcomePage] handleContinue: initiating sign-in');

    try {
      console.log('[WelcomePage] Calling signInWithGoogle...');
      const user = await signInWithGoogle();
      
      if (user) {
        console.log('[WelcomePage] Popup sign-in succeeded, connecting storage...');
        setStatus('Google authentication complete. Connecting your cloud workspace...');
        await cloudStorageEngine.connect(selectedProvider);
        console.log('[WelcomePage] Storage connected successfully');
        await cloudStorageEngine.initializeUniverse('My Constella');
        console.log('[WelcomePage] Universe initialized, navigating to /home');
        navigate('/home');
      } else {
        console.log('[WelcomePage] Redirect initiated (page should reload)');
      }
    } catch (error) {
      console.error('[WelcomePage] Google sign-in failed', error);
      setStatus('Authentication failed. Please try again or check that Google sign-in is enabled.');
      setAuthPending(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-app-bg text-text-primary font-sans overflow-hidden flex flex-col select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Space+Grotesk:wght@500;700&display=swap');

        .font-branding {
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 0.15em;
        }
        .font-header {
          font-family: 'Space Grotesk', sans-serif;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes laser-flow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes blink-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-rotate-slow {
          animation: rotate-slow 40s linear infinite;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-laser {
          stroke-dasharray: 6, 4;
          animation: laser-flow 1.5s linear infinite;
        }
        .animate-blink {
          animation: blink-fast 1s ease-in-out infinite;
        }
        .hud-border {
          border: 1px solid var(--border-strong);
        }
      `}</style>

      {/* Loader Overlay */}
      {authPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-app-bg/95 backdrop-blur-2xl transition-all duration-500">
          <div className="relative p-10 rounded-3xl border border-accent/20 bg-app-surface/90 shadow-[0_0_50px_rgba(91,78,232,0.15)] flex flex-col items-center max-w-md w-full mx-4 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
            
            <div className="relative w-36 h-36 mb-6 animate-float-slow">
              <div className="absolute inset-0 bg-accent/25 rounded-full blur-2xl animate-pulse" />
              <svg className="w-full h-full animate-rotate-slow" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-strong)" strokeWidth="0.75" strokeDasharray="3 5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeOpacity="0.4" />
                <circle cx="50" cy="50" r="18" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
                
                <g className="origin-center animate-[spin_8s_linear_infinite]">
                  <circle cx="50" cy="20" r="3.5" className="fill-accent" />
                  <circle cx="50" cy="20" r="7" className="stroke-accent/40 stroke-[0.5] fill-none animate-ping origin-center" />
                </g>
                <circle cx="50" cy="50" r="8" className="fill-accent animate-pulse" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">Syncing Universe</h3>
            <div className="px-4 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold tracking-wider uppercase mb-4 animate-pulse">
              Quantum Link Active
            </div>
            <p className="text-xs text-text-secondary font-mono leading-relaxed max-w-xs">{status}</p>
          </div>
        </div>
      )}

      {/* Cosmic Nebula Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(91,78,232,0.06) 0%, transparent 100%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[130px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(123,110,246,0.05) 0%, transparent 100%)' }} />
      </div>

      {/* Top Header Bar */}
      <header className="relative w-full h-16 border-b border-border/80 flex items-center justify-between px-6 sm:px-10 z-10 bg-app-surface/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex p-1.5 bg-accent text-white rounded-lg shadow-md shadow-accent/15">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-branding font-black text-xl tracking-wider text-text-primary">CONSTELLA</span>
        </div>

        {/* Minimalist Top Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-app-surface/50 text-[9px] font-mono tracking-wider text-text-secondary shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>SECURITY NODE STATUS: STABLE</span>
        </div>
      </header>

      {/* 3-Column Cockpit Workspace */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto z-10 px-6 sm:px-10 py-4 grid gap-8 lg:grid-cols-[320px_1fr_320px] items-center">
        
        {/* Left Column: Brand Description and Telemetry Console */}
        <div className="flex flex-col gap-6 justify-center lg:border-r lg:border-border/60 lg:pr-8 h-full">
          <div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-app-surface/50 text-[10px] font-mono tracking-wider text-accent mb-4 max-w-max">
              <span className="w-1 h-1 rounded-full bg-accent animate-blink" />
              <span>ONBOARDING LOGS</span>
            </div>
            <h2 className="text-2xl font-header font-bold text-text-primary leading-tight">
              A Sovereign Database
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Constella initializes local document stores on your system, synchronizing them with your cloud. No backend databases, no proprietary lock-ins.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-app-surface/50 font-mono text-xs text-text-secondary leading-normal space-y-2 shadow-sm">
            <div className="text-[10px] text-accent tracking-widest uppercase mb-1 font-bold">SYSTEM TELEMETRY:</div>
            <div>&gt; boot_sequence() ... OK</div>
            <div>&gt; initialize_universe() ... OK</div>
            <div>&gt; secure_bridge_active: true</div>
            <div className="truncate">&gt; status: <span className="text-accent font-bold">{status}</span><span className="animate-blink">_</span></div>
          </div>
        </div>

        {/* Center Column: Constellation Visualizer Canvas & Clustered Selection + Ignite Button */}
        <div className="flex flex-col items-center justify-center py-2 h-full">
          {/* Constellation Canvas */}
          <div className="w-full max-w-[420px] h-[250px] relative select-none animate-float-slow">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              {/* Constellation Lines */}
              <line x1="200" y1="150" x2="200" y2="40" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="150" x2="60" y2="230" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="200" y1="150" x2="340" y2="230" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Data streams along orbits */}
              {selectedProvider === 'drive' && (
                <line x1="200" y1="150" x2="200" y2="40" stroke="url(#active-laser)" strokeWidth="3" className="animate-laser" />
              )}

              <defs>
                <linearGradient id="active-laser" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-hover)" />
                </linearGradient>
                <radialGradient id="universe-seed-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Orbital node connection curves */}
              <circle cx="200" cy="150" r="110" fill="none" stroke="var(--accent)" strokeOpacity="0.15" strokeWidth="1.5" />

              {/* Center Core: Universe Seed */}
              <g className="cursor-pointer" onClick={handleContinue}>
                <circle cx="200" cy="150" r="30" fill="url(#universe-seed-glow)" className="animate-pulse-ring origin-center" />
                <circle cx="200" cy="150" r="18" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
                <circle cx="200" cy="150" r="6" className="fill-accent animate-pulse" />
                <text x="200" y="153" textAnchor="middle" className="fill-text-primary font-mono text-[8px] font-bold tracking-widest pointer-events-none uppercase">CORE</text>
              </g>

              {/* Planetary Nodes */}
              {/* Google Drive Node (Highlighted with theme-aware bright colors) */}
              <g 
                className="cursor-pointer group" 
                onClick={() => setSelectedProvider('drive')}
              >
                <circle 
                  cx="200" 
                  cy="40" 
                  r="24" 
                  className={`transition-all duration-300 ${selectedProvider === 'drive' ? 'fill-accent-light stroke-accent stroke-[2.5px]' : 'fill-bg-subtle stroke-border-strong group-hover:stroke-accent'}`} 
                />
                {selectedProvider === 'drive' && (
                  <circle cx="200" cy="40" r="28" fill="none" stroke="var(--accent)" strokeWidth="0.5" className="animate-ping origin-center opacity-40" />
                )}
                
                <foreignObject x="188" y="28" width="24" height="24">
                  <div className="flex items-center justify-center w-full h-full text-current">
                    <Cloud className={`w-5 h-5 ${selectedProvider === 'drive' ? 'text-accent' : 'text-text-secondary'}`} />
                  </div>
                </foreignObject>
                
                <circle cx="200" cy="40" r="2.5" className="fill-success animate-pulse" />
                <text x="200" y="80" textAnchor="middle" className={`font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedProvider === 'drive' ? 'fill-accent' : 'fill-text-primary group-hover:fill-accent'}`}>Google Drive</text>
              </g>

              {/* OneDrive Node (Inactive but fully visible) */}
              <g className="opacity-75 cursor-not-allowed">
                <circle cx="60" cy="230" r="22" className="fill-bg-subtle stroke-border-strong stroke-[1px] stroke-dasharray-[2, 3]" />
                <foreignObject x="48" y="218" width="24" height="24">
                  <div className="flex items-center justify-center w-full h-full text-text-tertiary">
                    <Cloud className="w-4 h-4" />
                  </div>
                </foreignObject>
                <text x="60" y="270" textAnchor="middle" className="font-mono text-[10px] fill-text-primary uppercase tracking-wider font-semibold">OneDrive</text>
                <text x="60" y="234" textAnchor="middle" className="font-mono text-[6px] fill-text-secondary uppercase font-bold">Soon</text>
              </g>

              {/* Dropbox Node (Inactive but fully visible) */}
              <g className="opacity-75 cursor-not-allowed">
                <circle cx="340" cy="230" r="22" className="fill-bg-subtle stroke-border-strong stroke-[1px] stroke-dasharray-[2, 3]" />
                <foreignObject x="328" y="218" width="24" height="24">
                  <div className="flex items-center justify-center w-full h-full text-text-tertiary">
                    <Cloud className="w-4 h-4" />
                  </div>
                </foreignObject>
                <text x="340" y="270" textAnchor="middle" className="font-mono text-[10px] fill-text-primary uppercase tracking-wider font-semibold">Dropbox</text>
                <text x="340" y="234" textAnchor="middle" className="font-mono text-[6px] fill-text-secondary uppercase font-bold">Soon</text>
              </g>
            </svg>
          </div>

          {/* Centered Segmented Selector clustered with Ignition flow */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl bg-app-surface border border-border backdrop-blur-md max-w-sm w-full justify-center shadow-sm mt-4">
            {providers.map(provider => {
              const isSelected = selectedProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => provider.available && setSelectedProvider(provider.id)}
                  disabled={!provider.available}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 ${
                    isSelected
                      ? 'bg-accent text-white shadow-md shadow-accent/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-app-hover/50 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{provider.id === 'drive' ? 'Drive' : provider.id === 'onedrive' ? 'OneDrive' : 'Dropbox'}</span>
                </button>
              );
            })}
          </div>

          {/* Centered Glowing CTA Button */}
          <div className="relative mt-4 w-full max-w-sm group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-[#7b6ef6] rounded-xl blur opacity-30 group-hover:opacity-80 transition duration-300"></div>
            <button
              onClick={handleContinue}
              disabled={!isReady || authPending}
              className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-accent hover:bg-accent-hover py-4 text-xs font-bold font-mono tracking-widest uppercase text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Ignite Universe Seed</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Connection Specifications Deck */}
        <div className="flex flex-col justify-center lg:border-l lg:border-border/60 lg:pl-8 h-full">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-2 mb-4">
              <span className="text-xs font-mono tracking-wider text-text-secondary uppercase font-bold">CONTROL SYSTEM</span>
              <span className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-accent-light text-accent uppercase font-bold font-bold">AES_256</span>
            </div>

            {/* Provider Spec List (Increased font size) */}
            <div className="space-y-4 font-mono text-sm text-text-secondary">
              <div className="grid grid-cols-[100px_1fr] border-b border-border/40 pb-2">
                <span className="text-text-tertiary uppercase text-xs">Node</span>
                <span className="text-accent font-extrabold">{selectedProvider === 'drive' ? 'Google Drive' : selectedProvider === 'onedrive' ? 'OneDrive' : 'Dropbox'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] border-b border-border/40 pb-2">
                <span className="text-text-tertiary uppercase text-xs">Sync Path</span>
                <span className="text-text-primary truncate">/Constella/manifest.json</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] border-b border-border/40 pb-2">
                <span className="text-text-tertiary uppercase text-xs">Security</span>
                <span className="text-text-primary">Direct TLS Connection</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] pb-1">
                <span className="text-text-tertiary uppercase text-xs">Link</span>
                <span className="text-success flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span>READY_TO_IGNITE</span>
                </span>
              </div>
            </div>

            <div className="mt-8 text-xs text-text-tertiary leading-relaxed text-center font-mono">
              Your credentials are authenticated directly through Google OAuth security layer.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default WelcomePage;
