import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const previewFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}/upload/preview`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error('Error previewing file:', error);
        throw error;
    }
};

export const processFile = async (file, mapping) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
        const response = await axios.post(`${API_URL}/upload/process`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

export const runClustering = async (algorithm, params, runName, options = {}) => {
    try {
        const response = await axios.post(`${API_URL}/run`, {
            algorithm,
            params,
            run_name: runName,
            start_date: options.startDate,
            end_date: options.endDate,
            save_result: options.saveResult
        });
        return response.data;
    } catch (error) {
        console.error('Error running clustering:', error);
        throw error;
    }
};

export const getHistory = async () => {
    try {
        const response = await axios.get(`${API_URL}/history/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
    }
};

export const deleteRun = async (runId) => {
    try {
        const response = await axios.delete(`${API_URL}/history/${runId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting run:', error);
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

export const getDashboardMetrics = async () => {
    try {
        const response = await axios.get(`${API_URL}/analytics/dashboard`);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw error;
    }
};



export const processRLFM = async () => {
    try {
        const response = await axios.post(`${API_URL}/rlfm/process`);
        return response.data;
    } catch (error) {
        console.error('Error processing RLFM:', error);
        throw error;
    }
};

export const getRLFMData = async (skip = 0, limit = 100) => {
    try {
        const response = await axios.get(`${API_URL}/rlfm/data`, { params: { skip, limit } });
        return response.data;
    } catch (error) {
        console.error('Error fetching RLFM data:', error);
        throw error;
    }
};

export const getTransactions = async (skip = 0, limit = 50) => {
    try {
        const response = await axios.get(`${API_URL}/transaction`, { params: { skip, limit } });
        return response.data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

export const createTransaction = async (transaction) => {
    try {
        const response = await axios.post(`${API_URL}/transaction`, transaction);
        return response.data;
    } catch (error) {
        console.error('Error creating transaction:', error);
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

export const updateProfile = async (data) => {
    try {
        const response = await axios.put(`${API_URL}/auth/me`, data);
        return response.data;
    } catch (error) {
        console.error('Update profile failed:', error);
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
