'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService } from '@/services/api';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, ShieldCheck, Download, Filter, TrendingUp, HeartPulse } from 'lucide-react';

export default function AnalystDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Analytics Data States
    const [diseaseDist, setDiseaseDist] = useState<any[]>([]);
    const [usersPerDay, setUsersPerDay] = useState<any[]>([]);
    const [diseaseTrend, setDiseaseTrend] = useState<any[]>([]);
    const [recoveryStats, setRecoveryStats] = useState<any>({ monthly_recoveries: [], medicine_effectiveness: [] });
    const [predictionVolume, setPredictionVolume] = useState<any[]>([]);
    const [severityHeatmap, setSeverityHeatmap] = useState<any[]>([]);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const userData = await authService.getCurrentUser();
                if (userData.role !== 'analyst' && userData.role !== 'admin') {
                    router.push('/dashboard');
                    return;
                }
                setUser(userData);

                const [dDist, uDay, dTrend, rStats, pVol, sHeat] = await Promise.all([
                    analyticsService.getAnalystDiseaseDistribution(),
                    analyticsService.getAnalystUsersPerDay(),
                    analyticsService.getAnalystDiseaseTrend(),
                    analyticsService.getAnalystRecoveryStats(),
                    analyticsService.getAnalystPredictionVolume(),
                    analyticsService.getAnalystSeverityHeatmap()
                ]);

                setDiseaseDist(dDist || []);
                setUsersPerDay(uDay || []);
                setDiseaseTrend(dTrend || []);
                setRecoveryStats(rStats || { monthly_recoveries: [], medicine_effectiveness: [] });
                setPredictionVolume(pVol || []);
                setSeverityHeatmap(sHeat || []);
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

    const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#8b5cf6'];
    const RISK_COLORS = { 'Low': '#10b981', 'Medium': '#f59e0b', 'High': '#ea580c', 'Emergency': '#e11d48' };

    // Flatten Heatmap data for ScatterChart (Mocking Heatmap with sized bubbles)
    const scatterData = severityHeatmap.flatMap(item => [
        { disease: item.disease, risk: 'Low', count: item.Low || 0, index: 1 },
        { disease: item.disease, risk: 'Medium', count: item.Medium || 0, index: 2 },
        { disease: item.disease, risk: 'High', count: item.High || 0, index: 3 },
        { disease: item.disease, risk: 'Emergency', count: item.Emergency || 0, index: 4 }
    ]).filter(d => d.count > 0);

    return (
        <div className="min-h-screen bg-slate-50 w-full text-slate-900">
            {/* Top Navy Banner */}
            <div className="bg-indigo-950 border-b border-indigo-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-400" />
                            <span className="text-xl font-bold text-white">Analyst Workstation</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors bg-indigo-900 px-3 py-1.5 rounded-lg border border-indigo-800">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                            <span className="text-slate-300 text-sm hidden sm:block border-l border-indigo-800 pl-4">Analyst: {user.name}</span>
                            <button onClick={logout} className="text-sm font-medium text-slate-300 hover:text-white transition-colors border border-transparent hover:bg-indigo-900 px-3 py-1.5 rounded-lg">Logout</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                            <Filter className="w-4 h-4" /> Date Range: All Time
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">Live Analytics Engine (via Motor & Aggregations)</div>
                </div>

                {/* Primary Volume Trends Layer */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Prediction Volume Area Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" /> Prediction Volume
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={predictionVolume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Area type="monotone" dataKey="predictions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* New Users Per Day Line Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" /> User Growth
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={usersPerDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Complex Cross-Sectional Analysis */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Disease Trend Multi-Line */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Disease Trend Analysis</h3>
                        <div className="h-[400px]">
                            {diseaseTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={diseaseTrend} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        {Object.keys(diseaseTrend[0] || {}).filter(k => k !== 'date').map((disease, i) => (
                                            <Line key={disease} type="monotone" dataKey={disease} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">No trend data available</div>
                            )}
                        </div>
                    </div>

                    {/* Overall Distribution Bar */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Overall Distribution</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={diseaseDist} margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="disease" type="category" width={100} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Post-Treatment Analysis */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recovery Timeline */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-rose-500" /> Monthly Patient Recoveries
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={recoveryStats.monthly_recoveries || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="recoveries" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Effectiveness Pie */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Aggregated Medicine Effectiveness</h3>
                        <div className="h-64">
                            {recoveryStats.medicine_effectiveness && recoveryStats.medicine_effectiveness.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={recoveryStats.medicine_effectiveness}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {recoveryStats.medicine_effectiveness.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={
                                                    entry.name === 'Fully Recovered' ? '#10b981' :
                                                        entry.name === 'Partially Recovered' ? '#f59e0b' : '#f43f5e'
                                                } />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">Not enough data points yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Severity Heatmap Replacement (Scatter representation) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Disease vs Severity Distribution (Bubble Heatmap)</h3>
                    <div className="h-[300px]">
                        {scatterData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="category" dataKey="disease" name="Disease" tick={{ fontSize: 12 }} />
                                    <YAxis type="number" dataKey="index" name="Severity" tickFormatter={(v) => v === 1 ? 'Low' : v === 2 ? 'Med' : v === 3 ? 'High' : 'Emerg'} tick={{ fontSize: 12 }} domain={[0, 5]} ticks={[1, 2, 3, 4]} />
                                    <ZAxis type="number" dataKey="count" range={[50, 600]} name="Occurrences" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Scatter name="Heatmap" data={scatterData} fill="#f43f5e">
                                        {scatterData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk as keyof typeof RISK_COLORS]} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Not enough predictions to compute severity density.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
