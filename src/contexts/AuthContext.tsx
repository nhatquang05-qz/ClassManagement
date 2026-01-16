import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

interface User {
    id: number;
    full_name: string;
    role: string;
    role_display: string;
    group_number: number | null;
    monitoring_group: number | null;
    class_id: number | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    
    
    const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const storedUser = sessionStorage.getItem('user');
        const storedToken = sessionStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
                
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (error) {
                console.error('Lỗi khôi phục user:', error);
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('token');
                setToken(null);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const res = await api.post('/auth/login', { username, password });
        const { token: newToken, user } = res.data;

        
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        setToken(newToken);
        
        
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];
        
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};