/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';


export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();
  
  const [users, setUsers] = useState<any[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch admins list
      const { data: adminsData, error: adminsError } = await (supabase
        .from('admins' as any) as any)
        .select('user_id');
      
      if (adminsError) throw adminsError;
      
      const adminSet = new Set<string>(adminsData.map((a: any) => a.user_id));
      setAdminIds(adminSet);

      // 2. Fetch users (customers) list
      const { data: usersData, error: usersError } = await supabase
        .from('customers')
        .select('*')
        .order('first_name', { ascending: true });
      
      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      showToast(
        language === 'tr' ? 'Kullanıcılar yüklenirken hata oluştu' : 'Failed to load users', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [language, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMakeAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await (supabase
        .from('admins' as any) as any)
        .insert([{ user_id: userId }]);
      
      if (error) throw error;
      
      showToast(
        language === 'tr' ? 'Kullanıcı yönetici yapıldı.' : 'User promoted to admin.', 
        'success'
      );
      
      // Update local state
      setAdminIds(prev => {
        const updated = new Set(prev);
        updated.add(userId);
        return updated;
      });
    } catch (error: any) {
      console.error('Error promoting user:', error);
      showToast(error.message || 'Failed to promote user to admin', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (userId === currentUser?.id) {
      showToast(
        language === 'tr' ? 'Kendi yöneticiliğinizi kaldıramazsınız.' : 'You cannot revoke your own admin rights.', 
        'error'
      );
      return;
    }

    const confirmRevoke = window.confirm(
      language === 'tr' 
        ? 'Bu kullanıcının yönetici yetkilerini kaldırmak istediğinizden emin misiniz?' 
        : 'Are you sure you want to revoke this user\'s admin rights?'
    );
    if (!confirmRevoke) return;

    setActionLoading(userId);
    try {
      const { error } = await (supabase
        .from('admins' as any) as any)
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      
      showToast(
        language === 'tr' ? 'Yönetici yetkileri kaldırıldı.' : 'Admin rights revoked.', 
        'success'
      );
      
      // Update local state
      setAdminIds(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    } catch (error: any) {
      console.error('Error revoking admin rights:', error);
      showToast(error.message || 'Failed to revoke admin rights', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  return (
    <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
            {language === 'tr' ? 'Kullanıcı ve Yetki Yönetimi' : 'User and Permissions Management'}
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-light">
            {language === 'tr' 
              ? 'Platform kullanıcılarını görüntüleyin ve yönetici yetkilerini düzenleyin.' 
              : 'View platform users and manage their administrative privileges.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder={language === 'tr' ? 'Kullanıcı adı veya e-posta ara...' : 'Search by name or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <span className="text-sm font-light">
            {language === 'tr' ? 'Kullanıcı listesi yükleniyor...' : 'Loading users list...'}
          </span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-light border border-dashed border-gray-200 rounded-2xl">
          {language === 'tr' ? 'Aramanıza uygun kullanıcı bulunamadı.' : 'No users found matching your search.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-4">{language === 'tr' ? 'Kullanıcı' : 'User'}</th>
                <th className="py-4 px-4">{language === 'tr' ? 'E-posta' : 'Email'}</th>
                <th className="py-4 px-4">{language === 'tr' ? 'Telefon' : 'Phone'}</th>
                <th className="py-4 px-4 text-center">{language === 'tr' ? 'Rol' : 'Role'}</th>
                <th className="py-4 px-4 text-right">{language === 'tr' ? 'İşlemler' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {filteredUsers.map((u) => {
                const isAdmin = adminIds.has(u.id);
                const isSelf = u.id === currentUser?.id;
                
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {u.first_name} {u.last_name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                          {language === 'tr' ? 'Siz' : 'You'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-light text-gray-500">{u.email}</td>
                    <td className="py-4 px-4 font-light text-gray-500">{u.phone || '-'}</td>
                    <td className="py-4 px-4 text-center">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100">
                          <Shield className="w-3 h-3" />
                          {language === 'tr' ? 'Yönetici' : 'Admin'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          {language === 'tr' ? 'Kullanıcı' : 'Customer'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {actionLoading === u.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-orange-600 ml-auto mr-4" />
                      ) : isAdmin ? (
                        <button
                          onClick={() => handleRemoveAdmin(u.id)}
                          disabled={isSelf}
                          title={language === 'tr' ? 'Yönetici Yetkisini Kaldır' : 'Revoke Admin Rights'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          {language === 'tr' ? 'Yetki Kaldır' : 'Revoke Admin'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMakeAdmin(u.id)}
                          title={language === 'tr' ? 'Yönetici Yap' : 'Make Admin'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-400 via-orange-500 to-yellow-500 text-white rounded-full text-xs font-semibold hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {language === 'tr' ? 'Yönetici Yap' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
