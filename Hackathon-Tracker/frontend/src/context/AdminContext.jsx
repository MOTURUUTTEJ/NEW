import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '../api';
import { AuthContext } from './AuthContext';

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);

    // Use refs for cache timing to avoid dependency loops
    const lastFetchRef = useRef(0);
    const fetchingRef = useRef(false);

    const fetchAdminData = useCallback(async (force = false) => {
        if (!user || user.role !== 'admin') return;
        if (fetchingRef.current) return; // Prevent concurrent fetches

        // Cache for 30 seconds unless forced
        const now = Date.now();
        if (!force && lastFetchRef.current && (now - lastFetchRef.current < 30000)) return;

        fetchingRef.current = true;
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await api.get('/api/admin/dashboard/full', config);
            setDashboardData(data);
            if (data.teams) setTeams(data.teams);
            lastFetchRef.current = Date.now();
        } catch (error) {
            console.error("Admin dashboard fetch error", error);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [user]); // Only depends on user — stable reference

    // Initial fetch on mount (or user change)
    useEffect(() => {
        if (!user) {
            setDashboardData(null);
            setTeams([]);
            lastFetchRef.current = 0;
        } else if (user.role === 'admin') {
            fetchAdminData();
        }
    }, [user, fetchAdminData]);

    return (
        <AdminContext.Provider value={{
            dashboardData,
            teams,
            loading,
            fetchDashboard: fetchAdminData,
            fetchTeams: fetchAdminData,
            setDashboardData,
            setTeams
        }}>
            {children}
        </AdminContext.Provider>
    );
};
