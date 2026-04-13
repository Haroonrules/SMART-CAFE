import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Award, Calendar, ShoppingBag, ChevronRight, Sparkles, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { toast } from 'sonner';

export function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Check for admin custom claim
          const tokenResult = await currentUser.getIdTokenResult();
          const isAdminUser = tokenResult.claims.admin === true;
          setIsAdmin(isAdminUser);
          
          console.log('=== CUSTOM CLAIMS CHECK ===');
          console.log('User UID:', currentUser.uid);
          console.log('Admin claim:', tokenResult.claims.admin);
          console.log('Is Admin:', isAdminUser);
          
          // Get or create user profile in Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            
            // Ensure avatar is set from Google profile
            if (currentUser.photoURL && !data.avatar) {
              await setDoc(doc(db, 'users', currentUser.uid), { avatar: currentUser.photoURL }, { merge: true });
              data.avatar = currentUser.photoURL;
            }
            
            setProfile(data);
          } else {
            // Create new profile
            const newProfile = {
              name: currentUser.displayName || 'Guest',
              email: currentUser.email || '',
              role: isAdminUser ? 'admin' : 'customer',
              avatar: currentUser.photoURL || '',
              memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              totalOrders: 0,
              loyaltyPoints: 0
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      toast.success('Signed in successfully');
      
      // Sync with staff whitelist - check if this Google account is a whitelisted staff member
      try {
        const token = await user.getIdToken(true); // Force refresh to get latest claims
        
        const response = await fetch('/api/auth/sync-staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.isStaff) {
          console.log(`[PROFILE] Staff account synced: ${data.system_role}`);
          toast.success(`Welcome back, ${data.display_role}!`);
          
          // Force token refresh to ensure custom claims are loaded
          await user.getIdToken(true);
        } else {
          console.log('[PROFILE] Not a staff member or sync failed:', data.error);
        }
      } catch (syncError) {
        console.error('[PROFILE] Staff sync error:', syncError);
        // Don't block sign-in if sync fails - user can still use customer features
      }
    } catch (error) {
      console.error('Sign in error', error);
      toast.error('Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!user || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <User size={64} className="mx-auto text-stone-300 mb-6" />
        <h2 className="text-3xl font-headline text-primary mb-4">Sign In Required</h2>
        <p className="text-on-surface-variant mb-8">Sign in to view your profile, orders, and loyalty points.</p>
        <button 
          onClick={handleSignIn}
          className="bg-secondary text-on-secondary px-8 py-4 rounded-xl font-semibold flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
        >
          <LogIn size={20} />
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
      <div className="mb-12">
        <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-2 block">Your Account</span>
        <h1 className="text-5xl md:text-6xl font-headline text-primary leading-tight">Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-10 text-center shadow-sm">
            <div className="relative inline-block mb-6 group">
              <div className="absolute -inset-2 bg-gradient-to-r from-secondary to-tertiary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-stone-100 flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} className="text-stone-400" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Settings size={16} />
              </button>
            </div>
            <h2 className="text-3xl font-headline text-primary mb-1">{profile.name}</h2>
            <p className="text-on-surface-variant font-body mb-6">{profile.email}</p>
            
            <div className="flex justify-center gap-8 pt-6 border-t border-stone-100">
              <div className="text-center">
                <span className="text-[0.6rem] font-label text-stone-400 uppercase tracking-widest block mb-1">Orders</span>
                <span className="text-2xl font-headline italic text-primary">{profile.totalOrders || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-[0.6rem] font-label text-stone-400 uppercase tracking-widest block mb-1">Points</span>
                <span className="text-2xl font-headline italic text-secondary">{profile.loyaltyPoints || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary text-on-primary rounded-[2rem] p-8 flex items-center gap-6 shadow-xl shadow-primary/20">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <Award className="text-secondary-container" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-headline italic mb-1">Gold Ritualist</h3>
              <p className="text-sm text-on-primary/70 font-body">You're 250 points away from Platinum status.</p>
            </div>
          </div>
        </div>

        {/* Settings/Actions */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="font-headline text-2xl text-primary italic mb-6">Account Settings</h3>
          
          <div className="space-y-4">
            {isAdmin && (
              <ProfileLink icon={<Settings size={20} />} label="Admin Dashboard" href="/admin/orders" />
            )}
            <ProfileLink icon={<User size={20} />} label="Personal Information" />
            <ProfileLink icon={<ShoppingBag size={20} />} label="Order History" href="/orders" />
            <ProfileLink icon={<Calendar size={20} />} label="Ritual Subscriptions" />
            <ProfileLink icon={<Sparkles size={20} />} label="Concierge Preferences" />
            <ProfileLink icon={<Settings size={20} />} label="Notification Settings" />
            
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-6 rounded-2xl bg-error/5 text-error hover:bg-error/10 transition-colors mt-8"
            >
              <div className="flex items-center gap-4">
                <LogOut size={20} />
                <span className="font-label uppercase tracking-widest font-bold text-xs">Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileLink({ icon, label, href = "#" }: { icon: React.ReactNode, label: string, href?: string }) {
  return (
    <a 
      href={href}
      className="flex items-center justify-between p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="text-stone-400 group-hover:text-secondary transition-colors">
          {icon}
        </div>
        <span className="font-label uppercase tracking-widest font-bold text-xs text-primary">{label}</span>
      </div>
      <ChevronRight size={18} className="text-stone-300 group-hover:text-secondary transition-colors" />
    </a>
  );
}
