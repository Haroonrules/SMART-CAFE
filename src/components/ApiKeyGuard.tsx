import React, { useState, useEffect } from 'react';
import { Sparkles, Key, ExternalLink, AlertCircle } from 'lucide-react';

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

export function ApiKeyGuard({ children }: ApiKeyGuardProps) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const checkKey = async () => {
    try {
      // Check if Groq API key exists in environment variables
      const envKey = import.meta.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
      
      if (envKey && envKey !== "MY_GROQ_API_KEY" && envKey.length > 0) {
        setHasKey(true);
        return;
      }

      // No valid key found
      setHasKey(false);
    } catch (err) {
      console.error("Error checking API key:", err);
      setHasKey(false);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  if (hasKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="text-primary" size={24} />
          </div>
          <p className="text-sm font-label uppercase tracking-widest text-stone-400">Initializing Concierge...</p>
        </div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 editorial-shadow text-center space-y-8 border border-stone-100">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mx-auto">
            <Key className="text-secondary" size={32} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-headline text-primary">Groq API Key Required</h2>
            <p className="text-on-surface-variant font-body leading-relaxed">
              To use the AI Concierge features with Llama 3.1 8B Instant model, you need to provide a Groq API key.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 flex items-start gap-3 text-left">
            <AlertCircle className="text-secondary shrink-0" size={20} />
            <div className="text-xs text-on-surface-variant leading-relaxed space-y-2">
              <p>
                <strong>Option 1:</strong> Add to your <code className="bg-stone-100 px-1 py-0.5 rounded">.env</code> file:
              </p>
              <pre className="bg-stone-100 p-2 rounded text-[10px] overflow-x-auto">
                VITE_GROQ_API_KEY=gsk_your_api_key_here
              </pre>
              <p className="pt-2">
                <strong>Option 2:</strong> Get your API key from Groq Console:
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-secondary font-bold ml-1 inline-flex items-center gap-0.5 hover:underline"
                >
                  Open Groq Console <ExternalLink size={10} />
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-stone-400">
              After adding the key to .env, restart your development server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
