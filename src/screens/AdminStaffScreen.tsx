import React, { useEffect, useState } from 'react';
import { Plus, Search, User, Mail, Shield, Crown, ChefHat, X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

interface StaffMember {
  uid: string;
  email: string;
  display_name: string;
  display_role: string;
  system_role: 'admin' | 'kitchen' | 'staff';
  is_on_duty: boolean;
  photo_url?: string;
}

export function AdminStaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newMember, setNewMember] = useState({
    email: '',
    display_name: '',
    display_role: 'Server',
    system_role: 'staff' as 'admin' | 'kitchen' | 'staff'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedStaff = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as StaffMember[];
      // Filter out regular customers (only show staff/admin/kitchen)
      const staffOnly = fetchedStaff.filter(s => 
        s.system_role === 'admin' || s.system_role === 'kitchen' || s.display_role
      );
      setStaff(staffOnly);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.display_role?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePromote = async (uid: string, newRole: 'admin' | 'kitchen') => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/staff/role', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid, system_role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');
      toast.success(`User promoted to ${newRole.toUpperCase()}`);
    } catch (error: any) {
      console.error(error);
      toast.error('Error updating user role');
    }
  };

  const handleDemote = async (uid: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/staff/role', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid, system_role: 'staff' })
      });

      if (!response.ok) throw new Error('Failed to update role');
      toast.success('User demoted to staff');
    } catch (error: any) {
      console.error(error);
      toast.error('Error updating user role');
    }
  };

  const handleRemove = async (uid: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/staff/${uid}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove staff');
      toast.success('Staff member removed');
    } catch (error: any) {
      console.error(error);
      toast.error('Error removing staff member');
    }
  };

  const toggleDutyStatus = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        is_on_duty: !currentStatus
      });
      toast.success(currentStatus ? 'Marked as off duty' : 'Marked as on duty');
    } catch (error: any) {
      console.error(error);
      toast.error('Error updating duty status');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newMember.email,
          system_role: newMember.system_role,
          display_role: newMember.display_role
        })
      });

      if (!response.ok) throw new Error('Failed to add staff member');
      
      toast.success('Staff member added successfully!');
      setShowAddModal(false);
      setNewMember({ email: '', display_name: '', display_role: 'Server', system_role: 'staff' });
    } catch (error: any) {
      console.error(error);
      toast.error('Error adding staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown size={20} className="text-purple-600" />;
      case 'kitchen': return <ChefHat size={20} className="text-orange-600" />;
      default: return <Shield size={20} className="text-blue-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'kitchen': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="ml-64 p-10 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <main className="ml-64 p-10 bg-surface-container-lowest min-h-screen">
      <header className="flex justify-between items-end mb-12">
        <div>
          <span className="text-[0.75rem] font-label tracking-[0.2em] text-stone-400 uppercase mb-2 block">Team Management</span>
          <h1 className="text-5xl font-headline text-primary">Staff Directory</h1>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-6 w-80 font-body text-sm outline-none focus:border-primary transition-colors" 
              placeholder="Search staff..." 
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
          >
            <Plus size={20} />
            Add Member
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Crown size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Admins</p>
              <p className="text-2xl font-headline text-primary font-bold">{staff.filter(s => s.system_role === 'admin').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ChefHat size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Kitchen Staff</p>
              <p className="text-2xl font-headline text-primary font-bold">{staff.filter(s => s.system_role === 'kitchen').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">On Duty</p>
              <p className="text-2xl font-headline text-primary font-bold">{staff.filter(s => s.is_on_duty).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredStaff.map((member) => (
          <motion.div
            key={member.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-stone-200/30 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden flex-shrink-0">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <User size={32} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-headline text-lg text-primary font-bold truncate">{member.display_name || 'Unknown'}</h3>
                    <p className="text-sm text-stone-500 truncate">{member.email}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-label uppercase tracking-widest ${getRoleColor(member.system_role)}`}>
                    {getRoleIcon(member.system_role)}
                    {member.system_role}
                  </div>
                </div>
                
                {member.display_role && member.display_role !== member.system_role && (
                  <p className="text-xs text-stone-400 mt-1">Display Role: {member.display_role}</p>
                )}
                
                <div className="flex items-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${member.is_on_duty ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  <span className="text-xs text-stone-500 uppercase tracking-widest">
                    {member.is_on_duty ? 'On Duty' : 'Off Duty'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleDutyStatus(member.uid, member.is_on_duty)}
                className={`py-2 rounded-xl font-label text-xs uppercase tracking-widest transition-colors ${
                  member.is_on_duty 
                    ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {member.is_on_duty ? 'Clock Out' : 'Clock In'}
              </button>
              
              {member.system_role !== 'admin' && (
                <button
                  onClick={() => handlePromote(member.uid, member.system_role === 'kitchen' ? 'admin' : 'kitchen')}
                  className="py-2 bg-primary/10 text-primary rounded-xl font-label text-xs uppercase tracking-widest hover:bg-primary/20 transition-colors"
                >
                  Promote to {member.system_role === 'kitchen' ? 'Admin' : 'Kitchen'}
                </button>
              )}
              
              {member.system_role !== 'staff' && (
                <button
                  onClick={() => handleDemote(member.uid)}
                  className="py-2 bg-stone-100 text-stone-600 rounded-xl font-label text-xs uppercase tracking-widest hover:bg-stone-200 transition-colors"
                >
                  Demote to Staff
                </button>
              )}
              
              <button
                onClick={() => handleRemove(member.uid, member.email)}
                className="py-2 bg-red-50 text-red-600 rounded-xl font-label text-xs uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-stone-300 mb-4" size={48} />
          <p className="text-stone-400 font-label uppercase tracking-widest">No staff members found</p>
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl"
            >
              <div className="p-6 border-b border-stone-200 flex justify-between items-center">
                <h2 className="text-2xl font-headline text-primary">Add Staff Member</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    placeholder="staff@smartcafe.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={newMember.display_name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, display_name: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">System Role *</label>
                  <select
                    value={newMember.system_role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, system_role: e.target.value as any }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    required
                  >
                    <option value="staff">Staff (No Privileges)</option>
                    <option value="kitchen">Kitchen Staff (Live Order Editors)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Display Role</label>
                  <input
                    type="text"
                    value={newMember.display_role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, display_role: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Server, Barista, Chef"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-xl font-label text-sm uppercase tracking-widest hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-label text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Adding...
                      </>
                    ) : (
                      'Add Member'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
