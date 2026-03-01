import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                const decoded = jwtDecode(parsed.token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(parsed);
                } else {
                    localStorage.removeItem('userInfo');
                }
            } catch (err) {
                console.error("Token decoding failed", err);
                localStorage.removeItem('userInfo');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = async () => {
        // Record logout event before clearing session
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            try {
                const { email, team_name } = JSON.parse(stored);
                await api.post('/api/auth/logout', { email, team_name });
            } catch (_) { /* non-fatal */ }
        }
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
