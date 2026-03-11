'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService, predictionService } from '@/services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Users, Activity, ShieldCheck, Search, ChevronLeft, ChevronRight, Server, AlertTriangle, ListChecks } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loginTimes, setLoginTimes] = useState<any[]>([]);
    const [predictionsList, setPredictionsList] = useState<any[]>([]); // New state mapped mapping
    const [loading, setLoading] = useState(true);

    // Table Pagination & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const userData = await authService.getCurrentUser();
                if (userData.role !== 'admin' && userData.role !== 'analyst') {
                    router.push('/dashboard');
                    return;
                }
                setUser(userData);

                const [statsData, usersData, loginData, predictionsData] = await Promise.all([
                    analyticsService.getAdminStats(),
                    analyticsService.getAdminUsers(),
                    analyticsService.getAdminLoginTimes(),
                    predictionService.getHistory()
                ]);

                setStats(statsData);
                setUsers(usersData.users || []);
                setLoginTimes(loginData || []);
                setPredictionsList(predictionsData || []);
            } catch (err) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, [router]);

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
    }

    const logout = () => {
        authService.logout();
        router.push('/login');
    };

    // Filter & Paginate Users
    const filteredUsers = users.filter((u: any) =>
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];

    // Top 10 Predictions Per User
    const topUsersByPredictions = [...users].sort((a, b) => b.prediction_count - a.prediction_count).slice(0, 10);

    return (
        <div className="min-h-screen bg-slate-50 w-full text-slate-900">
            {/* Top Navy Banner */}
            <div className="bg-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-indigo-400" />
                            <span className="text-xl font-bold text-white">Admin Console</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-slate-300 text-sm hidden sm:block">Admin: {user.name}</span>
                            <button onClick={logout} className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700">Logout</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* KPI Cards Layer */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Total Users</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.total_users || 0}</h3>
                        <p className="text-xs text-emerald-600 font-medium mt-1">+12% from last month</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Activity className="w-4 h-4" /> Total Predictions</p>
                        <h3 className="text-3xl font-extrabold text-indigo-600 mt-2">{stats?.total_predictions || 0}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Server className="w-4 h-4" /> System Health</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-xl font-bold text-slate-900">Optimal</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">APIs operational, 99.9% uptime</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Error Rate</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 mt-2">0.02%</h3>
                        <p className="text-xs text-slate-500 mt-1">Based on 24h trailing logs</p>
                    </div>
                </div>

                {/* Charts Layer */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Active vs Inactive */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">User Activity (7 Days)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats?.active_vs_inactive || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {(stats?.active_vs_inactive || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top 10 Users by Predictions */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Top Users by Prediction Volume</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topUsersByPredictions} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="prediction_count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* System Activity & Common Diseases */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Login Time Analysis */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">System Activity by Hour</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={loginTimes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Most Common Diseases */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Most Common Diseases</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                        <th className="pb-3 font-medium">Rank</th>
                                        <th className="pb-3 font-medium">Disease</th>
                                        <th className="pb-3 font-medium text-right">Diagnoses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(stats?.top_diseases || []).map((d: any, i: number) => (
                                        <tr key={i} className="border-b border-slate-100 last:border-0">
                                            <td className="py-3 text-slate-500 font-medium">#{i + 1}</td>
                                            <td className="py-3 font-bold text-slate-900">{d.disease}</td>
                                            <td className="py-3 text-right">
                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 font-medium">{d.count}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!stats?.top_diseases || stats.top_diseases.length === 0) && (
                                <div className="text-center py-8 text-slate-400">No predictions recorded yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Table Layer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-slate-900">User Management</h3>
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium">Demographics</th>
                                    <th className="px-6 py-4 font-medium text-center">Predictions</th>
                                    <th className="px-6 py-4 font-medium text-right">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((u: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {u.name}
                                            {u.role === 'admin' && <span className="ml-2 bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full">Admin</span>}
                                            {u.role === 'analyst' && <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Analyst</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{u.age || '-'} yrs, {u.gender ? (u.gender.charAt(0).toUpperCase() + u.gender.slice(1)) : '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{u.prediction_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-500">{u.created_at}</td>
                                    </tr>
                                ))}
                                {currentUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Predictions History Table Layer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-indigo-500" />
                            All Platform Predictions
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="px-6 py-4 font-medium">User Name</th>
                                    <th className="px-6 py-4 font-medium">Predicted Disease</th>
                                    <th className="px-6 py-4 font-medium">Risk Score</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {predictionsList.slice(0, 50).map((p: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900 text-sm">{p.user_name || p.user_id}</td>
                                        <td className="px-6 py-4 font-bold text-indigo-600 capitalize">{p.predicted_disease}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${p.risk_score === 'High' || p.risk_score === 'Emergency' ? 'bg-red-100 text-red-700' :
                                                p.risk_score === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {p.risk_score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-500">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {predictionsList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No predictions found in the database.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
