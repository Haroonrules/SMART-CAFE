import React, { useState } from 'react';
import { Plus, Search, User, Mail, Phone, Calendar, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_STAFF = [
  { id: 'stf-001', name: 'Chef Marco Rossi', role: 'Head Chef', email: 'marco@smartcafe.com', phone: '+1 234 567 8901', status: 'On Duty', shift: 'Morning', avatar: 'https://picsum.photos/seed/marco/200/200' },
  { id: 'stf-002', name: 'Sarah Chen', role: 'Lead Barista', email: 'sarah@smartcafe.com', phone: '+1 234 567 8902', status: 'On Duty', shift: 'Morning', avatar: 'https://picsum.photos/seed/sarah/200/200' },
  { id: 'stf-003', name: 'Alex Rivera', role: 'Barista', email: 'alex@smartcafe.com', phone: '+1 234 567 8903', status: 'Off Duty', shift: 'Evening', avatar: 'https://picsum.photos/seed/alex/200/200' },
  { id: 'stf-004', name: 'Elena Gilbert', role: 'Server', email: 'elena@smartcafe.com', phone: '+1 234 567 8904', status: 'On Duty', shift: 'Morning', avatar: 'https://picsum.photos/seed/elena/200/200' },
  { id: 'stf-005', name: 'Marcus Thorne', role: 'Sommelier', email: 'marcus@smartcafe.com', phone: '+1 234 567 8905', status: 'Off Duty', shift: 'Evening', avatar: 'https://picsum.photos/seed/marcus/200/200' },
];

export function AdminStaffScreen() {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'Barista',
    email: '',
    phone: '',
    shift: 'Morning',
    avatar: 'https://picsum.photos/seed/newstaff/200/200'
  });

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleStatus = (id: string) => {
    setStaff(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'On Duty' ? 'Off Duty' : 'On Duty' } : s
    ));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const member = {
      id: `stf-${Date.now()}`,
      name: newMember.name,
      role: newMember.role,
      email: newMember.email,
      phone: newMember.phone,
      status: 'Off Duty',
      shift: newMember.shift,
      avatar: newMember.avatar || `https://picsum.photos/seed/${newMember.name}/200/200`
    };
    setStaff([member, ...staff]);
    setShowAddModal(false);
    setNewMember({ name: '', role: 'Barista', email: '', phone: '', shift: 'Morning', avatar: 'https://picsum.photos/seed/newstaff/200/200' });
  };

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
              placeholder="Search staff, roles..." 
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Total Staff</p>
              <p className="text-2xl font-headline text-primary font-bold">{staff.length} Members</p>
            </div>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(staff.length / 30) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">On Duty Now</p>
              <p className="text-2xl font-headline text-primary font-bold">{staff.filter(s => s.status === 'On Duty').length} Active</p>
            </div>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(staff.filter(s => s.status === 'On Duty').length / staff.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStaff.map(member => (
          <motion.div 
            key={member.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl border border-stone-200/30 shadow-sm overflow-hidden group"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="relative">
                  <img 
                    src={member.avatar} 
                    className="w-20 h-20 rounded-2xl object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white ${
                    member.status === 'On Duty' ? 'bg-emerald-500' : 'bg-stone-300'
                  }`} />
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-headline text-primary font-bold mb-1">{member.name}</h3>
                <span className="text-xs font-label uppercase tracking-widest text-stone-400">{member.role}</span>
              </div>

              <div className="space-y-4 pt-6 border-t border-stone-50">
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <Mail size={16} className="text-stone-300" />
                  {member.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <Phone size={16} className="text-stone-300" />
                  {member.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <Calendar size={16} className="text-stone-300" />
                  {member.shift} Shift
                </div>
              </div>
            </div>
            
            <div className="px-8 py-4 bg-stone-50/50 flex justify-between items-center">
              <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${
                member.status === 'On Duty' ? 'text-emerald-600' : 'text-stone-400'
              }`}>
                {member.status}
              </span>
              <button 
                onClick={() => toggleStatus(member.id)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  member.status === 'On Duty' 
                  ? 'bg-stone-200 text-stone-600 hover:bg-stone-300' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10'
                }`}
              >
                {member.status === 'On Duty' ? 'Set Off Duty' : 'Set On Duty'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-400" />
              </button>
              
              <h2 className="text-3xl font-headline text-primary mb-8 italic">Add Team Member</h2>
              
              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Full Name</label>
                  <input 
                    required
                    value={newMember.name}
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                    className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Role</label>
                    <select 
                      value={newMember.role}
                      onChange={e => setNewMember({...newMember, role: e.target.value})}
                      className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    >
                      <option>Barista</option>
                      <option>Chef</option>
                      <option>Server</option>
                      <option>Sommelier</option>
                      <option>Manager</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Shift</label>
                    <select 
                      value={newMember.shift}
                      onChange={e => setNewMember({...newMember, shift: e.target.value})}
                      className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    >
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Night</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    placeholder="john@smartcafe.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Phone Number</label>
                  <input 
                    required
                    value={newMember.phone}
                    onChange={e => setNewMember({...newMember, phone: e.target.value})}
                    className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Avatar URL</label>
                  <input 
                    value={newMember.avatar}
                    onChange={e => setNewMember({...newMember, avatar: e.target.value})}
                    className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    placeholder="https://picsum.photos/..."
                  />
                </div>

                <button className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 hover:scale-[1.01] active:scale-95 transition-all">
                  Add to Directory
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
