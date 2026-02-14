import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
    url: redisUrl,
    socket: {
        tls: redisUrl.startsWith('rediss://'),
        rejectUnauthorized: false // Often needed for some cloud providers (like Upstash/Redis Cloud)
    }
});

client.on('error', (err) => {
    // Suppress verbose connection errors
    if (err.code === 'ECONNREFUSED') {
        // Only log once or keep it minimal
    } else {
        console.log('Redis Client Error', err);
    }
});

// Connect immediately
(async () => {
    try {
        await client.connect();
        console.log('✅ Redis Cache Connected');
    } catch (err) {
        console.log('⚠️ Redis Connection Failed (Caching Disabled):', err.message);
    }
})();

export default client;
