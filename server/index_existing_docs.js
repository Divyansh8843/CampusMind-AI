import mongoose from 'mongoose';
import Document from './models/Document.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function backfill() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const docs = await Document.find({});
        console.log(`Found ${docs.length} documents to index.`);
        
        for (const doc of docs) {
            console.log(`Indexing ${doc.originalName} (${doc.url})...`);
            try {
                await axios.post('http://127.0.0.1:8000/upload', { file_url: doc.url });
                console.log(`Successfully indexed ${doc.originalName}`);
            } catch (err) {
                console.error(`Failed to index ${doc.originalName}:`, err.message);
            }
        }
    } catch (err) {
        console.error("Backfill failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

backfill();
