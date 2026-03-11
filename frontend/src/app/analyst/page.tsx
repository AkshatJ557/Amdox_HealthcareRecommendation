'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService, predictionService } from '@/services/api';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, ShieldCheck, Download, Filter, TrendingUp, HeartPulse, MessageSquare, CheckCircle, ListChecks, Trash2 } from 'lucide-react';

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
    const [predictionsVsReviews, setPredictionsVsReviews] = useState<any[]>([]);

    // Pending Reviews State
    const [pendingReviews, setPendingReviews] = useState<any[]>([]);
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; p: any; feedback: string }>({ isOpen: false, p: null, feedback: '' });

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const userData = await authService.getCurrentUser();
                if (userData.role !== 'analyst' && userData.role !== 'admin') {
                    router.push('/dashboard');
                    return;
                }
                setUser(userData);

                const [dDist, uDay, dTrend, rStats, pVol, pendingData, pVsR] = await Promise.all([
                    analyticsService.getAnalystDiseaseDistribution(),
                    analyticsService.getAnalystUsersPerDay(),
                    analyticsService.getAnalystDiseaseTrend(),
                    analyticsService.getAnalystRecoveryStats(),
                    analyticsService.getAnalystPredictionVolume(),
                    predictionService.getHistory('Pending'),
                    analyticsService.getAnalystPredictionsVsReviews()
                ]);

                setDiseaseDist(dDist || []);
                setUsersPerDay(uDay || []);
                setDiseaseTrend(dTrend || []);
                setRecoveryStats(rStats || { monthly_recoveries: [], medicine_effectiveness: [] });
                setPredictionVolume(pVol || []);
                setPendingReviews(pendingData || []);
                setPredictionsVsReviews(pVsR || []);
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

    const handleSubmitReview = async () => {
        if (!reviewModal.p?.id) return;
        try {
            await predictionService.updateStatus(reviewModal.p.id, 'Reviewed', reviewModal.feedback);
            setReviewModal({ isOpen: false, p: null, feedback: '' });
            const [pendingData, pVsR] = await Promise.all([
                predictionService.getHistory('Pending'),
                analyticsService.getAnalystPredictionsVsReviews()
            ]);
            setPendingReviews(pendingData || []);
            setPredictionsVsReviews(pVsR || []);
        } catch (err) {
            console.error("Failed to submit review", err);
        }
    };

    const handleRemoveReview = async (id: string) => {
        try {
            await predictionService.updateStatus(id, 'Removed', 'Analyst opted to dismiss this diagnosis review request.');
            const [pendingData, pVsR] = await Promise.all([
                predictionService.getHistory('Pending'),
                analyticsService.getAnalystPredictionsVsReviews()
            ]);
            setPendingReviews(pendingData || []);
            setPredictionsVsReviews(pVsR || []);
        } catch (err) {
            console.error("Failed to remove review", err);
        }
    };

    const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#8b5cf6'];
    const RISK_COLORS = { 'Low': '#10b981', 'Medium': '#f59e0b', 'High': '#ea580c', 'Emergency': '#e11d48' };

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

                {/* Analyst Review Queue */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-indigo-500" />
                            Pending Diagnosis Reviews
                            <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{pendingReviews.length}</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">User Name</th>
                                    <th className="px-6 py-4 font-medium">Predicted Disease</th>
                                    <th className="px-6 py-4 font-medium">Confidence / Risk</th>
                                    <th className="px-6 py-4 font-medium">Symptoms Found</th>
                                    <th className="px-6 py-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingReviews.slice(0, 10).map((p: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 text-sm">{p.user_name || p.user_id}</td>
                                        <td className="px-6 py-4 font-bold text-indigo-600 capitalize">{p.predicted_disease}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{(p.confidence_score * 100).toFixed(1)}%</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.risk_score === 'High' || p.risk_score === 'Emergency' ? 'bg-red-100 text-red-700' :
                                                    p.risk_score === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {p.risk_score}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 capitalize max-w-xs truncate" title={p.symptoms.join(', ')}>
                                            {p.symptoms.join(', ')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => setReviewModal({ isOpen: true, p: p, feedback: '' })}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-sm flex items-center gap-1 inline-flex"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Review
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveReview(p.id)}
                                                    className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center gap-1 inline-flex"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pendingReviews.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No predictions currently pending analyst review!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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

                    {/* Users Per Day Line Chart */}
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

                {/* NEW: Predictions vs Reviews Status Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-indigo-500" /> Predictions vs Reviews Workload
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={predictionsVsReviews} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50}>
                                    {predictionsVsReviews.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Reviewed' ? '#10b981' : entry.name === 'Removed' ? '#ef4444' : '#f59e0b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
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

                {/* Complex Cross-Sectional Analysis Ends Here */}

            </div>

            {/* Review Modal */}
            {reviewModal.isOpen && reviewModal.p && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                                Patient Diagnosis Review
                            </h3>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">User Name</p>
                                    <p className="font-medium text-slate-900">{reviewModal.p.user_name || reviewModal.p.user_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Predicted Disease</p>
                                    <p className="font-bold text-indigo-600 capitalize">{reviewModal.p.predicted_disease}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Symptoms Identified</p>
                                    <div className="flex flex-wrap gap-2">
                                        {reviewModal.p.symptoms.map((s: string, idx: number) => (
                                            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs capitalize">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-900 mt-6 border-b border-slate-200 pb-2">AI Suggested Treatment Plan</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <strong className="text-emerald-800 text-sm block mb-2 font-bold">Diet Plan:</strong>
                                    <ul className="list-disc pl-4 text-emerald-700 text-sm space-y-1">
                                        {reviewModal.p.diet?.map((d: string, i: number) => <li key={i}>{d}</li>)}
                                        {(!reviewModal.p.diet || reviewModal.p.diet.length === 0) && <li>No specific diet.</li>}
                                    </ul>
                                </div>
                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                    <strong className="text-amber-800 text-sm block mb-2 font-bold">Medications:</strong>
                                    <ul className="list-disc pl-4 text-amber-700 text-sm space-y-1">
                                        {reviewModal.p.recommended_medicines?.map((m: string, i: number) => <li key={i} className="capitalize">{m}</li>)}
                                        {(!reviewModal.p.recommended_medicines || reviewModal.p.recommended_medicines.length === 0) && <li>No medications.</li>}
                                    </ul>
                                </div>
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <strong className="text-blue-800 text-sm block mb-2 font-bold">Workout Plan:</strong>
                                    <ul className="list-disc pl-4 text-blue-700 text-sm space-y-1">
                                        {reviewModal.p.workout?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                        {(!reviewModal.p.workout || reviewModal.p.workout.length === 0) && <li>No workout data.</li>}
                                    </ul>
                                </div>
                                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                    <strong className="text-red-800 text-sm block mb-2 font-bold">Precautions:</strong>
                                    <ul className="list-disc pl-4 text-red-700 text-sm space-y-1">
                                        {reviewModal.p.precautions?.map((pr: string, i: number) => <li key={i}>{pr}</li>)}
                                        {(!reviewModal.p.precautions || reviewModal.p.precautions.length === 0) && <li>No precautions listed.</li>}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Analyst Medical Notes & Overrides</label>
                                <textarea
                                    value={reviewModal.feedback}
                                    onChange={(e) => setReviewModal({ ...reviewModal, feedback: e.target.value })}
                                    placeholder="Add clinical notes, override recommendations, or provide direct feedback to the patient here..."
                                    className="w-full h-32 px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end bg-slate-50 shrink-0">
                            <button
                                onClick={() => setReviewModal({ isOpen: false, p: null, feedback: '' })}
                                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                className="px-5 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md rounded-xl transition-all"
                            >
                                Approve & Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
