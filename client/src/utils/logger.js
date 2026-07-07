import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const logActivity = async (action, details = "") => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await axios.post(`${API_BASE_URL}/api/log/log`, {
            action,
            details
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        console.error("Logger Error (Silent):", error);
    }
};
