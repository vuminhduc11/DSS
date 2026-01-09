import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const success = (msg) => addNotification('success', msg);
    const error = (msg) => addNotification('error', msg);
    const info = (msg) => addNotification('info', msg);

    return (
        <NotificationContext.Provider value={{ success, error, info, notifications, removeNotification }}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map(n => (
                    <div
                        key={n.id}
                        className={`flex items-center p-4 rounded-xl shadow-lg border min-w-[300px] animate-fade-in-down transition-all duration-300 ${n.type === 'success' ? 'bg-white border-green-100 text-green-800' :
                            n.type === 'error' ? 'bg-white border-red-100 text-red-800' :
                                'bg-white border-blue-100 text-blue-800'
                            }`}
                    >
                        <div className={`p-1 rounded-full mr-3 ${n.type === 'success' ? 'bg-green-100' :
                            n.type === 'error' ? 'bg-red-100' :
                                'bg-blue-100'
                            }`}>
                            {n.type === 'success' && <CheckCircle className="w-4 h-4" />}
                            {n.type === 'error' && <AlertCircle className="w-4 h-4" />}
                            {n.type === 'info' && <Info className="w-4 h-4" />}
                        </div>
                        <p className="flex-1 text-sm font-medium">{n.message}</p>
                        <button onClick={() => removeNotification(n.id)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
