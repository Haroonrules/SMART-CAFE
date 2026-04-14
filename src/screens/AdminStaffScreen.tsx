import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { User, Shield, Clock, Trash2, X, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  uid: string;
  email: string;
  display_role: string;
  system_role: 'admin' | 'kitchen';
  is_on_duty: boolean;
  photo_url?: string;
}

const OWNER_EMAIL = 'owner@smartcafe.com'; // Hardcoded owner email for immunity

export function AdminStaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    display_role: '',
    system_role: 'kitchen' as 'admin' | 'kitchen'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      
      setStaff(members);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
    });

    return () => unsubscribe();
  }, []);

  const filteredStaff = staff.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const matchesEmail = member.email?.toLowerCase().includes(searchLower);
    const matchesRole = member.display_role?.toLowerCase().includes(searchLower);
    const matchesSystemRole = member.system_role?.toLowerCase().includes(searchLower);
    return matchesEmail || matchesRole || matchesSystemRole;
  });

  const toggleDutyStatus = async (member: StaffMember) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/staff/${member.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_on_duty: !member.is_on_duty
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update duty status');
      }

      toast.success(`${member.email} is now ${!member.is_on_duty ? 'On Duty' : 'Off Duty'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update duty status');
      handleFirestoreError(error, OperationType.UPDATE, `staff/${member.uid}`);
    }
  };

  const removeStaff = async (member: StaffMember) => {
    // Owner Immunity Check
    if (member.email === OWNER_EMAIL) {
      toast.error('Cannot remove the Owner account');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.email}?`)) {
      return;
    }

    try {
      // Force token refresh: Ensures latest custom claims are propagated before destructive administrative actions
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('User context lost. Please refresh.');
        return;
      }

      const token = await currentUser.getIdToken(true);
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove staff member');
      }

      toast.success('Staff member removed successfully');
      // Update state manually instead of reloading the page
      setStaff(prev => prev.filter(s => s.id !== member.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove staff member');
      handleFirestoreError(error, OperationType.UPDATE, `staff/${member.uid}`);
    }
  };

  const addStaff = async () => {
    if (!newStaff.email || !newStaff.display_role) {
      toast.error('Email and display role are required');
      return;
    }

    try {
      // Get auth token from Firebase Auth instance directly
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to ensure it's not expired
      
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStaff)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create staff member');
      }

      toast.success('Staff member added to whitelist successfully');
      setIsModalOpen(false);
      setNewStaff({
        email: '',
        display_role: '',
        system_role: 'kitchen'
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add staff member');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-2">Manage team members and their roles.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            Add Staff
          </button>
          <div className="relative">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-6 w-80 outline-none focus:border-orange-500 transition-colors" 
              placeholder="Search by email or role..." 
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">On Duty</p>
              <p className="text-2xl font-bold text-gray-900">{staff.filter(s => s.is_on_duty).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Member</th>
              <th className="p-4 font-medium">Display Role</th>
              <th className="p-4 font-medium">System Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStaff.map(member => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{member.email}</p>
                      {member.email === OWNER_EMAIL && (
                        <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                          <Shield size={12} /> Owner
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{member.display_role}</td>
                <td className="p-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    member.system_role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {member.system_role}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleDutyStatus(member)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      member.is_on_duty
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Clock size={16} />
                    {member.is_on_duty ? 'On Duty' : 'Off Duty'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => removeStaff(member)}
                      disabled={member.email === OWNER_EMAIL}
                      className={`p-2 rounded-lg transition-colors ${
                        member.email === OWNER_EMAIL
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={member.email === OWNER_EMAIL ? 'Cannot remove Owner' : 'Remove Staff'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No staff members match your search.' : 'No staff members found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Owner Immunity Active</p>
            <p>The Owner account ({OWNER_EMAIL}) cannot be removed or demoted for security reasons.</p>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Staff Member</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 transition-colors"
                  placeholder="staff@smartcafe.com"
                />
                <p className="text-xs text-gray-500 mt-1">This user must sign in with Google to activate their account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Role</label>
                <input
                  type="text"
                  value={newStaff.display_role}
                  onChange={(e) => setNewStaff({ ...newStaff, display_role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g., Barista, Chef, Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Role</label>
                <select
                  value={newStaff.system_role}
                  onChange={(e) => setNewStaff({ ...newStaff, system_role: e.target.value as 'admin' | 'kitchen' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addStaff}
                  className="flex-1 px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                >
                  Add to Whitelist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
