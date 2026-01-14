import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await getMe();
                    setUser(userData);
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        const data = await loginApi(email, password);
        localStorage.setItem('token', data.access_token);
        const userData = await getMe();
        setUser(userData);
        return userData;
    };

    const register = async (email, password, fullName, role) => {
        await registerApi(email, password, fullName, role);
        // Auto login after register? Or redirect to login.
        // Let's just return success and let component handle redirect
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
