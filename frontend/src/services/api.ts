import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (credentials: any) => {
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.access_token) {
            Cookies.set('token', response.data.access_token, { expires: 1 });
        }
        return response.data;
    },

    register: async (userData: any) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout: () => {
        Cookies.remove('token');
    }
};

export const predictionService = {
    getSymptoms: async () => {
        const response = await api.get('/api/symptoms');
        return response.data;
    },
    predictDisease: async (symptoms: string[]) => {
        const response = await api.post('/api/predict', { symptoms });
        return response.data;
    },
    getHistory: async (status?: string) => {
        const url = status ? `/api/predictions?status=${status}` : '/api/predictions';
        const response = await api.get(url);
        return response.data;
    },
    updateStatus: async (id: string, status: string, feedback?: string) => {
        const response = await api.patch(`/api/predictions/${id}/status`, null, {
            params: { status, feedback }
        });
        return response.data;
    }
};

export const recoveryService = {
    submitRecovery: async (data: { disease: string, medication: string, recovery_status: string, improvement_days: string, side_effect_level: string }) => {
        const response = await api.post('/api/recovery', data);
        return response.data;
    }
};

export const analyticsService = {
    getPatientTimeline: async () => {
        const response = await api.get('/api/analytics/patient/timeline');
        return response.data;
    },

    getAdminStats: async () => {
        const response = await api.get('/api/analytics/admin/system-stats');
        return response.data;
    },
    getAdminUsers: async () => {
        const response = await api.get('/api/analytics/admin/users');
        return response.data;
    },
    getAdminLoginTimes: async () => {
        const response = await api.get('/api/analytics/admin/login-times');
        return response.data;
    },

    getAnalystDiseaseDistribution: async () => {
        const response = await api.get('/api/analytics/analyst/disease-distribution');
        return response.data;
    },
    getAnalystUsersPerDay: async () => {
        const response = await api.get('/api/analytics/analyst/users-per-day');
        return response.data;
    },
    getAnalystDiseaseTrend: async () => {
        const response = await api.get('/api/analytics/analyst/disease-trend');
        return response.data;
    },
    getAnalystRecoveryStats: async () => {
        const response = await api.get('/api/analytics/analyst/recovery-stats');
        return response.data;
    },
    getAnalystPredictionVolume: async () => {
        const response = await api.get('/api/analytics/analyst/prediction-volume');
        return response.data;
    },
    getAnalystSeverityHeatmap: async () => {
        const response = await api.get('/api/analytics/analyst/severity-heatmap');
        return response.data;
    },
    getAnalystPredictionsVsReviews: async () => {
        const response = await api.get('/api/analytics/analyst/predictions-vs-reviews');
        return response.data;
    }
};

export default api;
