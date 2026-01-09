import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const runClustering = async (algorithm, params, runName) => {
    try {
        const response = await axios.post(`${API_URL}/run`, {
            algorithm,
            params,
            run_name: runName
        });
        return response.data;
    } catch (error) {
        console.error('Error running clustering:', error);
        throw error;
    }
};

export const getSummaryStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/analytics/summary`);
        return response.data;
    } catch (error) {
        console.error('Error fetching summary stats:', error);
        throw error;
    }
};

export const getSalesOverTime = async () => {
    try {
        const response = await axios.get(`${API_URL}/analytics/sales-over-time`);
        return response.data;
    } catch (error) {
        console.error('Error fetching sales data:', error);
        throw error;
    }
};

export const getStrategy = async (runId) => {
    try {
        const response = await axios.get(`${API_URL}/strategy/${runId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching strategy:', error);
        throw error;
    }
};

export const getLatestRun = async () => {
    try {
        const response = await axios.get(`${API_URL}/strategy/runs/latest`);
        return response.data;
    } catch (error) {
        console.error('Error fetching latest run:', error);
        throw error;
    }
};

export const getDataQuality = async () => {
    try {
        const response = await axios.get(`${API_URL}/analytics/data-quality`);
        return response.data;
    } catch (error) {
        console.error('Error fetching data quality:', error);
        throw error;
    }
};

// Auth API
export const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
        const response = await axios.post(`${API_URL}/auth/token`, formData);
        return response.data;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};

export const register = async (email, password, fullName) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            full_name: fullName
        });
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
};

export const getMe = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Fetch user failed:', error);
        throw error;
    }
};

// Add auth token to all requests
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
