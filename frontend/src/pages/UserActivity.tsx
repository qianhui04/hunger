import { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { Trophy, TrendingUp, Ban, User, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserActivityRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'staff';
  is_restricted: boolean;
  subRoles: string[];
  food_shared: number;
  food_claimed: number;
}

interface UserActivityResponse {
  stats: {
    totalUsers: number;
    totalProviders: number;
    totalReceivers: number;
    totalClaims: number;
    totalRestrictedUsers: number;
  };

  users: UserActivityRecord[];

  monthlyActivity?: {
    month: string;
    foodListed: number;
    foodClaimed: number;
  }[];
}

export function UserActivity() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'providers' | 'claimers'>('providers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserActivityRecord[]>([]);
  const [stats, setStats] =
    useState({
      totalUsers: 0,
      totalProviders: 0,
      totalReceivers: 0,
      totalClaims: 0,
      totalRestrictedUsers: 0
    });
  const [activityData, setActivityData] = useState<UserActivityResponse['monthlyActivity']>([]);

  const fetchUserActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/user-activity`);
      if (!response.ok) throw new Error(`Server status: ${response.status}`);

      const data: UserActivityResponse = await response.json();
      console.log('USER ACTIVITY DATA:', data);
      setUsers(data.users || []);

      setStats(
        data.stats || {
          totalUsers: 0,
          totalProviders: 0,
          totalReceivers: 0,
          totalClaims: 0,
          totalRestrictedUsers: 0
        }
      );
      setActivityData(data.monthlyActivity || []);
    } catch (err: any) {
      console.error('Frontend Sync Fetch Error:', err);
      setError(err.message || 'Failed to sync with central API metrics backend module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserActivity();

    const channel = supabase
      .channel('user-activity-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_listings',
        },
        () => {
          console.log('✅ REALTIME EVENT RECEIVED: food_listings');
          fetchUserActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims'
        },
        () => {
          console.log('✅ REALTIME EVENT RECEIVED: claims');
          fetchUserActivity();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    if (selectedTab === 'providers') {
      return user.subRoles.includes('provider');
    }

    return user.subRoles.includes('receiver');

  })
    .filter((user) => {

      const search =
        searchTerm.toLowerCase();

      return (
        user.name
          .toLowerCase()
          .includes(search) ||

        user.email
          .toLowerCase()
          .includes(search)
      );
    })
    .sort((a, b) => {
      if (selectedTab === 'providers') {
        return b.food_shared - a.food_shared;
      }

      return b.food_claimed - a.food_claimed;
    });

  const handleRestrictUser = async (userId: string, userName: string, is_restricted: boolean) => {
    const action = is_restricted ? 'unrestrict' : 'restrict';

    if (!confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/restrict-user', {
        method: "PATCH",
        headers: {
          "Content-Type": 'application/json',
        },
        body: JSON.stringify({
          uid: userId,
          is_restricted: !is_restricted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} user`);
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? { ...user, is_restricted: !is_restricted }
            : user
        )
      );

      setStats((currentStats) => ({
        ...currentStats,
        totalRestrictedUsers: currentStats.totalRestrictedUsers + (is_restricted ? -1 : 1),
      }));

      alert(`User ${userName} has been ${action}ed.`);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Activity Monitor"
        description="Track user participation and engagement levels"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9E9E9E]">Total Active Users</p>
              <p className="text-3xl font-semibold text-[#212121] mt-1">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
              <User size={24} className="text-[#2E7D32]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9E9E9E]">Active Providers</p>
              <p className="text-3xl font-semibold text-[#212121] mt-1">{stats.totalProviders}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
              <TrendingUp size={24} className="text-[#66BB6A]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9E9E9E]">Active Receivers</p>
              <p className="text-3xl font-semibold text-[#212121] mt-1">{stats.totalReceivers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
              <Trophy size={24} className="text-[#338A3E]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9E9E9E]">Restricted Users</p>
              <p className="text-3xl font-semibold text-[#212121] mt-1">{stats.totalRestrictedUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#FFEBEE] flex items-center justify-center">
              <Ban size={24} className="text-[#D32F2F]" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-[#212121] mb-4">Monthly User Activity Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F8E9" />
            <XAxis dataKey="month" stroke="#9E9E9E" />
            <YAxis stroke="#9E9E9E" />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }}
            />
            <Bar dataKey="foodListed" fill="#2E7D32" radius={[8, 8, 0, 0]} name="Providers" />
            <Bar dataKey="foodClaimed" fill="#66BB6A" radius={[8, 8, 0, 0]} name="Claimers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Rankings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setSelectedTab('providers')}
              className={`px-6 py-3 rounded-lg transition-colors ${selectedTab === 'providers'
                ? 'bg-[#E8F5E9] text-[#2E7D32]'
                : 'text-[#9E9E9E] hover:bg-[#F5FAF5]'
                }`}
            >
              Provider Records
            </button>
            <button
              onClick={() => setSelectedTab('claimers')}
              className={`px-6 py-3 rounded-lg transition-colors ${selectedTab === 'claimers'
                ? 'bg-[#E8F5E9] text-[#2E7D32]'
                : 'text-[#9E9E9E] hover:bg-[#F5FAF5]'
                }`}
            >
              Receiver Records
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users by name or email..."
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FBF9]">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Rank</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Role</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Food Shared</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Food Claimed</th>
                {/* <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Points</th> */}
                <th className="text-left py-4 px-6 text-sm font-medium text-[#9E9E9E]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-[#F9FBF9] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      {index === 0 && <Trophy className="text-[#FFD700] mr-2" size={20} />}
                      {index === 1 && <Trophy className="text-[#C0C0C0] mr-2" size={20} />}
                      {index === 2 && <Trophy className="text-[#CD7F32] mr-2" size={20} />}
                      <span className="text-sm font-medium text-[#212121]">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {/* <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                        <span className="text-[#2E7D32] font-medium">{user.avatar}</span>
                      </div> */}
                      <div>
                        <p className="text-sm font-medium text-[#212121]">{user.name}</p>
                        <p className="text-xs text-[#9E9E9E]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'staff'
                      ? 'bg-[#FFF3E0] text-[#F57C00]'
                      : 'bg-[#E8F5E9] text-[#2E7D32]'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-[#212121] font-medium">{user.food_shared}</td>
                  <td className="py-4 px-6 text-sm text-[#212121] font-medium">{user.food_claimed}</td>
                  {/* <td className="py-4 px-6 text-sm text-[#2E7D32] font-semibold">{user.points}</td> */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleRestrictUser(user.id, user.name, user.is_restricted)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${user.is_restricted
                        ? 'text-[#2E7D32] hover:bg-[#E8F5E9]'
                        : 'text-[#D32F2F] hover:bg-[#FFEBEE]'
                        }`}
                    >
                      <Ban size={16} />
                      {user.is_restricted ? "Unrestrict" : "Restrict"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
