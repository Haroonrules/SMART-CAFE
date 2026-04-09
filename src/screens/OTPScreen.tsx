import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Lock } from 'lucide-react';

export function OTPScreen() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12 bg-surface min-h-screen">
      <div className="w-full max-w-md">
        <div className="mb-12 relative">
          <div className="absolute -left-4 -top-8 w-24 h-24 bg-tertiary-fixed/30 rounded-full blur-3xl"></div>
          <span className="font-label text-[0.75rem] uppercase tracking-[0.2rem] text-secondary font-bold mb-3 block">Security First</span>
          <h1 className="font-headline text-4xl md:text-5xl text-primary leading-tight">OTP Verification</h1>
          <p className="font-headline text-lg text-on-surface-variant mt-4 leading-relaxed opacity-80">
            We've sent a digital invitation to your device. Please enter the unique code to continue your journey.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-[0px_24px_48px_rgba(38,23,12,0.06)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-bl-[4rem] -mr-8 -mt-8"></div>
          <form 
            onSubmit={(e) => { e.preventDefault(); navigate('/menu'); }}
            className="space-y-10 relative z-10"
          >
            <div className="flex justify-between gap-2 md:gap-4">
              {[4, 8, '', '', '', ''].map((val, i) => (
                <input
                  key={i}
                  className="w-12 h-16 md:w-14 md:h-20 bg-surface-container-low border-b-2 border-outline-variant text-center text-2xl font-headline text-primary rounded-t-lg transition-all focus:bg-surface-container focus:border-secondary outline-none"
                  maxLength={1}
                  type="text"
                  defaultValue={val}
                  autoFocus={i === 2}
                />
              ))}
            </div>

            <div className="space-y-6">
              <button className="w-full bg-secondary hover:bg-on-secondary-container text-on-secondary font-medium py-5 px-8 rounded-xl text-lg transition-all active:scale-[0.98] shadow-lg shadow-secondary/20 flex items-center justify-center gap-3" type="submit">
                Verify & Enter
                <ArrowRight size={20} />
              </button>
              <div className="flex flex-col items-center gap-2">
                <p className="font-label text-[0.7rem] uppercase tracking-wider text-on-surface-variant opacity-60">Didn't receive a message?</p>
                <button className="text-secondary font-bold hover:text-on-secondary-container transition-colors border-b border-secondary/20 pb-0.5" type="button">
                  Resend Code
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        <div className="mt-12 flex items-start gap-4 p-6 bg-surface-container-low rounded-xl">
          <Lock className="text-tertiary-container" size={24} />
          <div>
            <h4 className="font-headline text-sm text-primary">Your security is our priority.</h4>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">Verification ensures your personalized cafe experience and orders remain private.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
