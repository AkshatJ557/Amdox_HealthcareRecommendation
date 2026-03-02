'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, predictionService, analyticsService, recoveryService } from '@/services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { AlertTriangle, Activity, Pill, Apple, Dumbbell, ShieldAlert, ShieldCheck, Search, X, ChevronDown, Clock, HeartPulse } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    // Recovery & Timeline State
    const [timeline, setTimeline] = useState<any>(null);
    const [recoveryForm, setRecoveryForm] = useState({ disease: '', medication: '', recovery_status: 'Fully Recovered', improvement_days: '1–3 days', side_effect_level: 'None' });
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoverySuccess, setRecoverySuccess] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            } catch (err) {
                router.push('/login');
            }
        };

        const fetchSymptoms = async () => {
            try {
                const data = await predictionService.getSymptoms();
                setAvailableSymptoms(data.symptoms || []);
            } catch (err) {
                console.error("Failed to fetch symptoms", err);
            }
        };

        const fetchTimeline = async () => {
            try {
                const data = await analyticsService.getPatientTimeline();
                setTimeline(data);
                if (data.predictions_history && data.predictions_history.length > 0) {
                    setRecoveryForm(prev => ({ ...prev, disease: data.predictions_history[0].disease }));
                }
            } catch (err) {
                console.error("Failed to fetch timeline", err);
            }
        };

        fetchUser();
        fetchSymptoms();
        fetchTimeline();
    }, [router]);

    const handlePredict = async () => {
        if (selectedSymptoms.length === 0) return;

        setLoading(true);
        setError('');
        try {
            const data = await predictionService.predictDisease(selectedSymptoms.map(s => s.toLowerCase()));
            setResult(data);

            // Refresh patient timeline after a new prediction so the graph updates immediately
            const timelineData = await analyticsService.getPatientTimeline();
            setTimeline(timelineData);
            if (timelineData.predictions_history && timelineData.predictions_history.length > 0) {
                setRecoveryForm(prev => ({ ...prev, disease: timelineData.predictions_history[0].disease }));
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Prediction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSymptom = (symptom: string) => {
        if (selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
        } else {
            setSelectedSymptoms(prev => [...prev, symptom]);
        }
        setSearchQuery('');
    };

    const filteredSymptoms = availableSymptoms.filter(s =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRecoverySubmit = async (e: any) => {
        e.preventDefault();
        if (!recoveryForm.disease) return;

        setRecoveryLoading(true);
        try {
            await recoveryService.submitRecovery(recoveryForm);
            setRecoverySuccess("Thank you! Your feedback has been recorded.");
            const data = await analyticsService.getPatientTimeline();
            setTimeline(data);
            setTimeout(() => setRecoverySuccess(''), 5000);
        } catch (err) {
            console.error("Failed to submit recovery", err);
        } finally {
            setRecoveryLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        router.push('/login');
    };

    if (!user) return <div className="flex-grow flex items-center justify-center">Loading...</div>;

    // Prepare SHAP chart data
    const shapData = result?.shap_explanation
        ? Object.entries(result.shap_explanation).map(([name, value]) => ({
            name: name.replace(/_/g, ' '),
            value: Math.abs(Number(value))
        })).sort((a, b) => b.value - a.value)
        : [];

    return (
        <div className="flex-grow bg-slate-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Patient Dashboard</h1>
                        <p className="text-slate-500 mt-1">Welcome back, {user.name}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Input Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                <Activity className="w-5 h-5" />
                                <h2 className="text-xl font-bold text-slate-900">New Diagnosis</h2>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                                Select your symptoms from the dropdown below or search.
                            </p>

                            {/* Multiselect Dropdown */}
                            <div className="relative mb-6">
                                <div
                                    className="min-h-[56px] w-full px-4 py-3 bg-white border border-slate-300 rounded-xl cursor-text transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 flex flex-wrap gap-2 items-center"
                                    onClick={() => setIsDropdownOpen(true)}
                                >
                                    {selectedSymptoms.map(sym => (
                                        <span key={sym} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                                            {sym}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSymptom(sym); }}
                                                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <div className="flex-1 min-w-[120px] flex items-center shadow-none">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 placeholder-slate-400 placeholder:select-none shadow-none focus:outline-none"
                                            placeholder={selectedSymptoms.length === 0 ? "Search symptoms..." : ""}
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                        />
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }} />
                                </div>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                            {filteredSymptoms.length > 0 ? (
                                                <ul className="py-1 text-base text-slate-700">
                                                    {filteredSymptoms.map((sym, index) => (
                                                        <li
                                                            key={index}
                                                            onClick={() => toggleSymptom(sym)}
                                                            className={`cursor-pointer select-none relative py-2 pl-4 pr-9 hover:bg-slate-100 ${selectedSymptoms.includes(sym) ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                                                        >
                                                            {sym}
                                                            {selectedSymptoms.includes(sym) && (
                                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                                                    <ShieldCheck className="h-5 w-5" />
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="p-4 text-center text-slate-500">No symptoms found</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {error && <div className="text-red-500 text-sm mb-4 font-medium">{error}</div>}

                            <button
                                onClick={handlePredict}
                                disabled={loading || selectedSymptoms.length === 0}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${loading || selectedSymptoms.length === 0
                                    ? 'bg-indigo-300 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                                    }`}
                            >
                                {loading ? 'Analyzing...' : 'Generate Prediction'}
                            </button>
                        </div>

                        {/* Quick Profile Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Profile</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Age:</span> <span className="font-medium text-slate-900">{user.age || 'Not specified'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Gender:</span> <span className="font-medium text-slate-900">{user.gender || 'Not specified'}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Results & Recommendations */}
                    <div className="lg:col-span-2 space-y-6">
                        {!result ? (
                            <div className="bg-white h-full min-h-[400px] p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                <Activity className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">Enter your symptoms to view your personalized health report.</p>
                            </div>
                        ) : (
                            <>
                                {/* Result Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Predicted Disease</p>
                                            <h3 className="text-2xl font-bold text-slate-900 capitalize">{result.predicted_disease}</h3>
                                            <p className="text-sm text-indigo-600 font-medium mt-1">
                                                {(result.confidence_score * 100).toFixed(1)}% Confidence
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-2xl shadow-sm border flex items-start gap-4 ${result.risk_score === 'High' || result.risk_score === 'Emergency'
                                        ? 'bg-red-50 border-red-200'
                                        : result.risk_score === 'Medium'
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-emerald-50 border-emerald-200'
                                        }`}>
                                        <div className={`p-3 rounded-xl ${result.risk_score === 'High' || result.risk_score === 'Emergency' ? 'bg-red-100 text-red-600' :
                                            result.risk_score === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            {result.risk_score === 'Emergency' ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${result.risk_score === 'High' || result.risk_score === 'Emergency' ? 'text-red-700' :
                                                result.risk_score === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                                                }`}>Risk Level</p>
                                            <h3 className={`text-2xl font-bold ${result.risk_score === 'High' || result.risk_score === 'Emergency' ? 'text-red-900' :
                                                result.risk_score === 'Medium' ? 'text-amber-900' : 'text-emerald-900'
                                                }`}>{result.risk_score}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Explainable AI Chart */}
                                {shapData.length > 0 && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                            Explainable AI (Top Contributing Symptoms)
                                        </h3>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart layout="vertical" data={shapData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#f1f5f9' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                                        {shapData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={'#4f46e5'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations Tabs (Simplified as visible sections) */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Medications */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-blue-500">
                                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                                            <Pill className="w-5 h-5" />
                                            <h3 className="font-bold text-lg text-slate-900">Medications</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {result.recommended_medicines?.map((med: string, i: number) => (
                                                <li key={i} className="flex items-center text-slate-700 bg-slate-50 px-3 py-2 rounded-lg font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                                    <span className="capitalize">{med}</span>
                                                </li>
                                            ))}
                                            {(!result.recommended_medicines || result.recommended_medicines.length === 0) && (
                                                <li className="text-slate-400 text-sm">No specific medications recommended.</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Diets */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-emerald-500">
                                        <div className="flex items-center gap-2 mb-4 text-emerald-600">
                                            <Apple className="w-5 h-5" />
                                            <h3 className="font-bold text-lg text-slate-900">Dietary Plan</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {result.diet?.map((item: string, i: number) => (
                                                <li key={i} className="flex items-center text-slate-700 bg-slate-50 px-3 py-2 rounded-lg font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                                                    <span className="capitalize">{item}</span>
                                                </li>
                                            ))}
                                            {(!result.diet || result.diet.length === 0) && (
                                                <li className="text-slate-400 text-sm">No specific diet recommended.</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Workouts */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500">
                                        <div className="flex items-center gap-2 mb-4 text-orange-600">
                                            <Dumbbell className="w-5 h-5" />
                                            <h3 className="font-bold text-lg text-slate-900">Workouts</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {result.workout?.map((w: string, i: number) => (
                                                <li key={i} className="flex items-center text-slate-700 bg-slate-50 px-3 py-2 rounded-lg font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                                                    <span className="capitalize">{w}</span>
                                                </li>
                                            ))}
                                            {(!result.workout || result.workout.length === 0) && (
                                                <li className="text-slate-400 text-sm">No specific workouts recommended.</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Precautions */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-purple-500">
                                        <div className="flex items-center gap-2 mb-4 text-purple-600">
                                            <ShieldCheck className="w-5 h-5" />
                                            <h3 className="font-bold text-lg text-slate-900">Precautions</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {result.precautions?.map((p: string, i: number) => (
                                                <li key={i} className="flex items-center text-slate-700 bg-slate-50 px-3 py-2 rounded-lg font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                                    <span className="capitalize">{p}</span>
                                                </li>
                                            ))}
                                            {(!result.precautions || result.precautions.length === 0) && (
                                                <li className="text-slate-400 text-sm">No specific precautions found.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                            </>
                        )}
                    </div>
                </div>

                {/* Patient Analytics & Recovery Section */}
                {timeline && (
                    <div className="mt-10 border-t border-slate-200 pt-10">
                        <div className="mb-6">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                <HeartPulse className="w-6 h-6 text-rose-500" />
                                Patient Analytics & History
                            </h2>
                            <p className="text-slate-500">Track your health trends and submit recovery feedback.</p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Analytics Column */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Risk Pipeline Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                        Health Risk Trend Over Time
                                    </h3>
                                    {timeline.risk_trend && timeline.risk_trend.length > 0 ? (
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={timeline.risk_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => val === 1 ? 'Low' : val === 2 ? 'Med' : val === 3 ? 'High' : 'Emerg'} domain={[0, 4]} ticks={[1, 2, 3, 4]} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        formatter={(value: any) => {
                                                            const labels = { 1: 'Low Risk', 2: 'Medium Risk', 3: 'High Risk', 4: 'Emergency Protocol' };
                                                            return [labels[value as keyof typeof labels] || value, "Risk Level"];
                                                        }}
                                                    />
                                                    <Line type="monotone" dataKey="risk_level" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-slate-400">No prediction history to chart.</div>
                                    )}
                                </div>

                                {/* Recovery History */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 block">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-indigo-500" />
                                        Recent Recovery History
                                    </h3>
                                    {timeline.recovery_history && timeline.recovery_history.length > 0 ? (
                                        <div className="space-y-4">
                                            {timeline.recovery_history.slice(0, 3).map((rec: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div>
                                                        <p className="font-bold text-slate-900">{rec.disease}</p>
                                                        <p className="text-sm text-slate-500">{rec.date} • {rec.medication || 'No medication specified'}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${rec.status === 'Fully Recovered' ? 'bg-emerald-100 text-emerald-700' :
                                                        rec.status === 'Partially Recovered' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {rec.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-slate-400">No recovery feedback submitted yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Feedback Form Column */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        Recovery Feedback
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-6">Complete this form after using prescribed medication to help improve our AI.</p>

                                    {recoverySuccess ? (
                                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-medium text-center">
                                            {recoverySuccess}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleRecoverySubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Disease</label>
                                                <select
                                                    value={recoveryForm.disease}
                                                    onChange={(e) => setRecoveryForm({ ...recoveryForm, disease: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="" disabled>Select a diagnosed disease...</option>
                                                    {timeline?.predictions_history?.length > 0 ? (
                                                        Array.from(new Set(timeline.predictions_history.map((p: any) => p.disease))).map((disease: any) => (
                                                            <option key={disease} value={disease}>{disease}</option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>No predictions yet. Predict first.</option>
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Medication Used</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={recoveryForm.medication}
                                                    onChange={(e) => setRecoveryForm({ ...recoveryForm, medication: e.target.value })}
                                                    placeholder="E.g. Paracetamol"
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Q1: Symptoms Improvement?</label>
                                                <select
                                                    value={recoveryForm.recovery_status}
                                                    onChange={(e) => setRecoveryForm({ ...recoveryForm, recovery_status: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="Fully Recovered">Fully Recovered</option>
                                                    <option value="Partially Recovered">Partially Recovered</option>
                                                    <option value="No Improvement">No Improvement</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Q2: Days to notice improvement?</label>
                                                <select
                                                    value={recoveryForm.improvement_days}
                                                    onChange={(e) => setRecoveryForm({ ...recoveryForm, improvement_days: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="1–3 days">1–3 days</option>
                                                    <option value="4–7 days">4–7 days</option>
                                                    <option value="More than 7 days">More than 7 days</option>
                                                    <option value="No improvement">No improvement</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Q3: Any side effects?</label>
                                                <select
                                                    value={recoveryForm.side_effect_level}
                                                    onChange={(e) => setRecoveryForm({ ...recoveryForm, side_effect_level: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="None">None</option>
                                                    <option value="Mild">Mild</option>
                                                    <option value="Moderate">Moderate</option>
                                                    <option value="Severe">Severe</option>
                                                </select>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={recoveryLoading}
                                                className={`w-full py-3 mt-4 rounded-xl font-bold text-white shadow-md transition-all ${recoveryLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                                                    }`}
                                            >
                                                {recoveryLoading ? 'Submitting...' : 'Submit Feedback'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
