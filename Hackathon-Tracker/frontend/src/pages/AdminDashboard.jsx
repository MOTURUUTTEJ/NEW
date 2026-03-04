import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { AdminContext } from '../context/AdminContext';
import {
    Users, LayoutDashboard, Target, CheckCircle2, Code2, LogOut,
    BarChart3, TrendingUp, Clock, Database, Calendar, Plus, Trash2,
    Globe, X, AlertTriangle, LogIn, Square, CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import Loader from '../components/Loader';
import Leaderboard from '../components/Leaderboard';
import generateTechStackPDF from '../utils/pdfGenerator';

const AdminDashboard = () => {
    console.log('Admin Dashboard loaded. PDF Generator:', typeof generateTechStackPDF);
    const { user, logout } = useContext(AuthContext);
    const { dashboardData, fetchDashboard, setDashboardData, loading: contextLoading } = useContext(AdminContext);

    // Sync context to local variables for easier access
    const metrics = dashboardData?.metrics;

    const [activities, setActivities] = useState(dashboardData?.activities || []);
    const [globalHackathons, setGlobalHackathons] = useState(dashboardData?.hackathons || []);
    const [loading, setLoading] = useState(!dashboardData);

    useEffect(() => {
        if (dashboardData) {
            setActivities(dashboardData.activities || []);
            setGlobalHackathons(dashboardData.hackathons || []);
        }
        if (dashboardData || !contextLoading) setLoading(false);
    }, [dashboardData, contextLoading]);

    // Hackathon form state
    const [showHackForm, setShowHackForm] = useState(false);
    const [hackForm, setHackForm] = useState({ hackathon_name: '', start_date: '', end_date: '', description: '' });
    const [hackSaving, setHackSaving] = useState(false);
    const [hackError, setHackError] = useState('');

    // Log delete state
    const [deletingLog, setDeletingLog] = useState(null);
    const [selectedLogs, setSelectedLogs] = useState(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${user.token}` } }), [user.token]);

    useEffect(() => {
        fetchDashboard();
        const intervalId = setInterval(() => fetchDashboard(true), 30000); // refresh every 30s
        return () => clearInterval(intervalId);
    }, [fetchDashboard]);

    const handleCreateHackathon = async (e) => {
        e.preventDefault();
        setHackSaving(true);
        setHackError('');
        try {
            await api.post('/api/admin/hackathons', hackForm, config);
            setHackForm({ hackathon_name: '', start_date: '', end_date: '', description: '' });
            setShowHackForm(false);
            fetchDashboard(true);
        } catch (err) {
            setHackError(err.response?.data?.message || 'Failed to create hackathon');
        } finally {
            setHackSaving(false);
        }
    };

    const handleDeleteHackathon = async (id) => {
        if (!window.confirm('Delete this global hackathon? Teams will no longer see it.')) return;
        try {
            await api.delete(`/api/admin/hackathons/${id}`, config);
            fetchDashboard(true);
        } catch (err) {
            console.error('Failed to delete hackathon', err);
        }
    };

    const handleDeleteLog = async (act) => {
        const targetSk = act.SK || act.sk;
        if (!targetSk) return;
        setDeletingLog(act._id);
        try {
            await api.delete('/api/admin/activities/delete', { ...config, data: { sk: targetSk } });
            setActivities(prev => prev.filter(a => a._id !== act._id));
            setSelectedLogs(prev => { const next = new Set(prev); next.delete(act._id); return next; });
        } catch (err) {
            console.error('Failed to delete log', err);
        } finally {
            setDeletingLog(null);
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedLogs.size) return;
        if (!window.confirm(`Delete ${selectedLogs.size} selected log entries?`)) return;
        setBulkDeleting(true);
        try {
            await Promise.allSettled(
                Array.from(selectedLogs).map(id => {
                    const act = activities.find(a => a._id === id);
                    const targetSk = act?.SK || act?.sk;
                    if (!targetSk) return Promise.resolve();
                    return api.delete('/api/admin/activities/delete', { ...config, data: { sk: targetSk } });
                })
            );
            setActivities(prev => prev.filter(a => !selectedLogs.has(a._id)));
            setSelectedLogs(new Set());
        } catch (err) {
            console.error('Bulk delete failed', err);
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleClearAll = async () => {
        if (!activities.length) return;
        if (!window.confirm('Clear ALL activity logs? This cannot be undone.')) return;
        setBulkDeleting(true);
        try {
            await Promise.allSettled(
                activities.map(act => {
                    const targetSk = act.SK || act.sk;
                    return api.delete('/api/admin/activities/delete', { ...config, data: { sk: targetSk } });
                })
            );
            setActivities([]);
            setSelectedLogs(new Set());
        } catch (err) {
            console.error('Clear all failed', err);
        } finally {
            setBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedLogs.size === activities.length) {
            setSelectedLogs(new Set());
        } else {
            setSelectedLogs(new Set(activities.map(a => a._id)));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedLogs(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const statCards = [
        { label: 'Total Teams', value: metrics?.overview?.totalTeams || 0, icon: <Users size={22} className="text-white" aria-hidden="true" />, bg: 'from-[#3b82f6] to-[#6366f1]', shadow: 'shadow-[#3b82f6]/30', linkTo: '/admin/teams', state: { filter: 'All' } },
        { label: 'Hackathons', value: metrics?.overview?.totalHackathons || 0, icon: <LayoutDashboard size={22} className="text-white" aria-hidden="true" />, bg: 'from-[#8b5cf6] to-[#d946ef]', shadow: 'shadow-[#8b5cf6]/30', linkTo: '/admin/teams', state: { filter: 'All' } },
        { label: 'Active Projects', value: metrics?.overview?.activeProjects || 0, icon: <Target size={22} className="text-white" aria-hidden="true" />, bg: 'from-[#f59e0b] to-[#ef4444]', shadow: 'shadow-[#f59e0b]/30', linkTo: '/admin/teams', state: { filter: 'Development' } },
        { label: 'Completed', value: metrics?.overview?.completedProjects || 0, icon: <CheckCircle2 size={22} className="text-white" aria-hidden="true" />, bg: 'from-[#10b981] to-[#06b6d4]', shadow: 'shadow-[#10b981]/30', linkTo: '/admin/teams', state: { filter: 'Completed' } },
    ];

    const pieData = useMemo(() => {
        if (!metrics?.projectStatusDistribution) return [];
        return metrics.projectStatusDistribution.map(item => ({ name: item._id, value: item.count }));
    }, [metrics]);

    const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

    const barData = useMemo(() => {
        if (!metrics?.teamAverageProgress) return [];
        return metrics.teamAverageProgress.map(item => ({ name: item.team_name, progress: item.avg_progress }));
    }, [metrics]);

    const participationData = useMemo(() => {
        if (!metrics?.hackathonParticipation) return [];
        return metrics.hackathonParticipation.map(item => ({ name: item.name, value: item.value }));
    }, [metrics]);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Loader />
            <p className="text-slate-400 text-sm font-medium mt-4 tracking-wider">Loading analytics…</p>
        </div>
    );

    return (
        <div className="min-h-screen pb-16 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60">
            {/* Decorative ambient blobs */}
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#06b6d4]" aria-hidden="true" />
            <div className="absolute top-32 right-[5%] w-80 h-80 rounded-full bg-[#8b5cf6]/10 blur-[100px] pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-32 left-[5%] w-80 h-80 rounded-full bg-[#3b82f6]/10 blur-[100px] pointer-events-none" aria-hidden="true" />

            {/* Navbar */}
            <nav className="border-b border-white/70 bg-white/60 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-2 rounded-xl shadow-lg shadow-[#3b82f6]/30">
                                <Code2 className="text-white" size={20} strokeWidth={2.5} aria-hidden="true" />
                            </div>
                            <span className="text-lg font-black tracking-tighter text-slate-800 uppercase">
                                Avanthi Innovation Hub <span className="bg-gradient-to-r from-[#f59e0b] to-[#ef4444] bg-clip-text text-transparent">Admin</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-8 text-sm font-bold h-full">
                            <Link to="/admin" className="text-[#3b82f6] border-b-2 border-[#3b82f6] h-full flex items-center px-1">Overview</Link>
                            <Link to="/admin/teams" className="text-slate-400 hover:text-slate-700 transition-colors h-full flex items-center px-1">Directory</Link>
                            <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors py-2">
                                <LogOut size={16} aria-hidden="true" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-between items-end border-b border-slate-200/80 pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#06b6d4] tracking-tight">Analytics Dashboard</h1>
                        <p className="text-sm font-medium text-slate-400 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" aria-hidden="true"></span>
                            Live metrics across all team clusters
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                console.log('Export button clicked');
                                generateTechStackPDF();
                            }}
                            className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                            <Database size={14} /> Export Tech Spec (PDF)
                        </button>
                        <div className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-xl border border-white/80 shadow-sm text-sm text-slate-500 font-medium">
                            <TrendingUp size={16} className="text-[#3b82f6]" aria-hidden="true" />
                            Real-time
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {statCards.map((stat, i) => (
                        <motion.div variants={itemVariants} key={i}>
                            <Link to={stat.linkTo} state={stat.state} className={`block rounded-2xl p-6 bg-gradient-to-br ${stat.bg} shadow-xl ${stat.shadow} text-white hover:-translate-y-1 transition-transform duration-200`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur">{stat.icon}</div>
                                    <div className="h-2.5 w-2.5 rounded-full bg-white/80 shadow-lg animate-pulse" aria-hidden="true" />
                                </div>
                                <p className="text-4xl font-black tracking-tight">{stat.value}</p>
                                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1">{stat.label}</p>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── GLOBAL HACKATHON MANAGEMENT ───────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Globe size={18} className="text-[#8b5cf6]" aria-hidden="true" /> Global Hackathon Management
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-1">Published hackathons appear on every team's dashboard</p>
                        </div>
                        <button
                            id="add-hackathon-btn"
                            onClick={() => setShowHackForm(v => !v)}
                            className="btn-cyan text-sm px-5 py-2.5 gap-2"
                        >
                            {showHackForm ? <X size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                            {showHackForm ? 'Cancel' : 'Add Hackathon'}
                        </button>
                    </div>

                    {/* Add Form */}
                    <AnimatePresence>
                        {showHackForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleCreateHackathon}
                                className="overflow-hidden mb-6"
                            >
                                <div className="bg-white/50 border border-white/80 rounded-2xl p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label htmlFor="hack-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Hackathon Name</label>
                                            <input id="hack-name" type="text" required className="input-field" placeholder="e.g. Smart India Hackathon 2026" value={hackForm.hackathon_name} onChange={e => setHackForm({ ...hackForm, hackathon_name: e.target.value })} autoComplete="off" />
                                        </div>
                                        <div>
                                            <label htmlFor="hack-start" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Start Date</label>
                                            <input id="hack-start" type="date" required className="input-field" value={hackForm.start_date} onChange={e => setHackForm({ ...hackForm, start_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label htmlFor="hack-end" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">End Date</label>
                                            <input id="hack-end" type="date" required className="input-field" value={hackForm.end_date} onChange={e => setHackForm({ ...hackForm, end_date: e.target.value })} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="hack-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description <span className="text-slate-300 font-normal">(optional)</span></label>
                                            <input id="hack-desc" type="text" className="input-field" placeholder="Short description for teams…" value={hackForm.description} onChange={e => setHackForm({ ...hackForm, description: e.target.value })} autoComplete="off" />
                                        </div>
                                    </div>
                                    {hackError && (
                                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                            <AlertTriangle size={14} aria-hidden="true" /> {hackError}
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowHackForm(false)} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
                                        <button type="submit" disabled={hackSaving} className="btn-cyan text-sm px-6 py-2.5">
                                            {hackSaving ? 'Publishing…' : 'Publish to All Teams'}
                                        </button>
                                    </div>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Hackathons List */}
                    {globalHackathons.length === 0 ? (
                        <div className="text-center py-12 text-slate-300">
                            <Globe size={36} className="mx-auto mb-3 opacity-50" aria-hidden="true" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No global hackathons published yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {globalHackathons.map((h, i) => (
                                <motion.div
                                    key={h._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center justify-between p-4 bg-white/50 border border-white/80 rounded-2xl group hover:border-[#8b5cf6]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gradient-to-br from-[#8b5cf6]/10 to-[#3b82f6]/10 rounded-xl border border-[#8b5cf6]/20">
                                            <Calendar size={18} className="text-[#8b5cf6]" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-sm">{h.hackathon_name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                {h.start_date ? new Date(h.start_date).toLocaleDateString() : '—'} → {h.end_date ? new Date(h.end_date).toLocaleDateString() : '—'}
                                                {h.description && <span className="ml-2 text-slate-300">• {h.description}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteHackathon(h._id)}
                                        aria-label={`Delete ${h.hackathon_name}`}
                                        className="btn-danger opacity-0 group-hover:opacity-100 text-xs px-3 py-1.5"
                                    >
                                        <Trash2 size={13} aria-hidden="true" /> Delete
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-600 mb-6 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]" aria-hidden="true"></span> Project Status Distribution
                        </h3>
                        <div className="h-72 w-full">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                            {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" align="center" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="flex items-center justify-center h-full text-slate-300">No data available.</div>}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-600 mb-6 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef]" aria-hidden="true"></span> Hackathon Participation
                        </h3>
                        <div className="h-72 w-full">
                            {participationData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={participationData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" fill="url(#barGrad1)" radius={[6, 6, 0, 0]} name="Projects" />
                                        <defs>
                                            <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#d946ef" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="flex items-center justify-center h-full text-slate-300">No data.</div>}
                        </div>
                    </motion.div>
                </div>

                {/* Average Progress */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-6 shadow-sm mb-8">
                    <h3 className="text-sm font-bold text-slate-600 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={16} className="text-[#10b981]" aria-hidden="true" /> Team Average Build Progress (%)
                    </h3>
                    <div className="h-80 w-full">
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="progress" fill="url(#barGrad2)" radius={[6, 6, 0, 0]} name="Avg Progress %" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full text-slate-300">No progress data.</div>}
                    </div>
                </motion.div>

                {/* Leaderboard + Activity Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-sm">
                        <Leaderboard user={user} />
                    </motion.div>

                    {/* Activity Logs with Delete */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-1 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock size={18} className="text-[#3b82f6]" aria-hidden="true" /> System Activity
                            </h3>
                            <span className="text-[10px] font-black text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded-lg uppercase tracking-widest">Global Feed</span>
                        </div>

                        <div className="space-y-4 flex-1 max-h-[600px] overflow-y-auto pr-1">
                            {activities.length === 0 ? (
                                <div className="text-center py-20 text-slate-300 italic text-xs font-bold uppercase tracking-widest">No activity records found.</div>
                            ) : (
                                activities.map((act, i) => (
                                    <div key={act._id || i} className="flex gap-3 group relative">
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#3b82f6] group-hover:border-[#3b82f6]/20 transition-colors shadow-sm">
                                                {act.icon === 'LogIn' ? <TrendingUp size={16} aria-hidden="true" /> :
                                                    act.icon === 'UserPlus' ? <Users size={16} aria-hidden="true" /> :
                                                        act.icon === 'Code2' ? <Code2 size={16} aria-hidden="true" /> :
                                                            act.icon === 'Calendar' ? <Calendar size={16} aria-hidden="true" /> :
                                                                <Database size={16} aria-hidden="true" />}
                                            </div>
                                            {i !== activities.length - 1 && <div className="w-0.5 h-full bg-slate-100 mt-2" aria-hidden="true" />}
                                        </div>
                                        <div className="flex-1 pb-4 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(act.timestamp))}
                                            </p>
                                            <p className="text-sm font-bold text-slate-700 leading-tight truncate">{act.detail}</p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-[#3b82f6] bg-[#3b82f6]/5 px-1.5 py-0.5 rounded border border-[#3b82f6]/10 uppercase">{act.team_name}</span>
                                                <span className="text-[9px] font-bold text-slate-400">VIA {act.action?.split('_')[0]}</span>
                                            </div>
                                        </div>
                                        {/* Delete log button */}
                                        <button
                                            onClick={() => handleDeleteLog(act)}
                                            disabled={deletingLog === act._id}
                                            aria-label="Delete this log entry"
                                            className="flex-shrink-0 self-start mt-0.5 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        >
                                            {deletingLog === act._id
                                                ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" aria-hidden="true" />
                                                : <Trash2 size={13} aria-hidden="true" />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* ── FULL-WIDTH ACTIVITY LOGS TABLE ────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm mb-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100/80">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#3b82f6]/10 to-[#8b5cf6]/10 rounded-xl border border-[#3b82f6]/20">
                                <Database size={18} className="text-[#3b82f6]" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-[0.18em]">System Activity Logs</h2>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Login · Logout · All team events · Full audit trail</p>
                            </div>
                            {activities.length > 0 && (
                                <span className="ml-2 text-[10px] font-black text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                    {activities.length} entries
                                </span>
                            )}
                        </div>
                        {activities.length > 0 && (
                            <div className="flex items-center gap-2">
                                {selectedLogs.size > 0 && (
                                    <button
                                        onClick={handleDeleteSelected}
                                        disabled={bulkDeleting}
                                        className="btn-danger text-xs px-4 py-2"
                                    >
                                        {bulkDeleting
                                            ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                                            : <Trash2 size={13} aria-hidden="true" />}
                                        Delete Selected ({selectedLogs.size})
                                    </button>
                                )}
                                <button
                                    onClick={handleClearAll}
                                    disabled={bulkDeleting}
                                    className="btn-secondary text-xs px-4 py-2 border-red-200/60 text-red-400 hover:bg-red-50"
                                >
                                    <Trash2 size={13} aria-hidden="true" /> Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <Database size={36} className="mb-3 opacity-40" aria-hidden="true" />
                            <p className="text-xs font-bold uppercase tracking-widest">No log entries yet.</p>
                            <p className="text-[10px] text-slate-300 mt-1">Login/logout events and team actions will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100/80">
                                        <th className="px-5 py-3 w-10">
                                            <button
                                                onClick={toggleSelectAll}
                                                aria-label={selectedLogs.size === activities.length ? 'Deselect all' : 'Select all'}
                                                className="text-slate-400 hover:text-[#3b82f6] transition-colors"
                                            >
                                                {selectedLogs.size === activities.length && activities.length > 0
                                                    ? <CheckSquare size={16} className="text-[#3b82f6]" />
                                                    : <Square size={16} />}
                                            </button>
                                        </th>
                                        <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Timestamp</th>
                                        <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Action</th>
                                        <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Detail</th>
                                        <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Team</th>
                                        <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Email</th>
                                        <th className="px-6 py-3" aria-label="Actions"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map((act, i) => {
                                        const isSelected = selectedLogs.has(act._id);
                                        const actionColor =
                                            act.action === 'USER_LOGIN' ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                : act.action === 'USER_LOGOUT' ? 'bg-orange-50 text-orange-500 border-orange-200'
                                                    : act.action === 'USER_REGISTER' ? 'bg-sky-50 text-sky-600 border-sky-200'
                                                        : act.action?.startsWith('ADMIN') ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20'
                                                            : act.action?.startsWith('ISSUE') ? 'bg-red-50 text-red-500 border-red-200'
                                                                : 'bg-[#3b82f6]/5 text-[#3b82f6] border-[#3b82f6]/15';
                                        return (
                                            <motion.tr
                                                key={act._id || i}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
                                                className={`group border-b border-slate-50 transition-colors ${isSelected ? 'bg-[#3b82f6]/[0.05]' : 'hover:bg-slate-50/60'
                                                    }`}
                                            >
                                                <td className="px-5 py-3.5">
                                                    <button
                                                        onClick={() => toggleSelectOne(act._id)}
                                                        aria-label={isSelected ? 'Deselect row' : 'Select row'}
                                                        className="text-slate-300 hover:text-[#3b82f6] transition-colors"
                                                    >
                                                        {isSelected
                                                            ? <CheckSquare size={16} className="text-[#3b82f6]" />
                                                            : <Square size={16} />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                                        {new Intl.DateTimeFormat('en-IN', {
                                                            day: '2-digit', month: 'short',
                                                            hour: '2-digit', minute: '2-digit'
                                                        }).format(new Date(act.timestamp))}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${actionColor}`}>
                                                        {act.action === 'USER_LOGIN' && <LogIn size={9} aria-hidden="true" />}
                                                        {act.action === 'USER_LOGOUT' && <LogOut size={9} aria-hidden="true" />}
                                                        {act.action || 'EVENT'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 max-w-xs">
                                                    <p className="text-sm font-semibold text-slate-700 truncate">{act.detail}</p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-xs font-bold text-slate-600">{act.team_name || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-[10px] font-medium text-slate-400 lowercase">{act.email || '—'}</span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <button
                                                        onClick={() => handleDeleteLog(act)}
                                                        disabled={deletingLog === act._id || bulkDeleting}
                                                        aria-label="Delete log entry"
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30"
                                                    >
                                                        {deletingLog === act._id
                                                            ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" aria-hidden="true" />
                                                            : <Trash2 size={14} aria-hidden="true" />}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
};

export default AdminDashboard;
