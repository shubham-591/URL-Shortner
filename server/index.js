import express from 'express';
import { createClient } from "redis";
import cors from 'cors';
import { encodeBase62 } from './services/base_62_encoding_service.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initializing redis
const redisClient = createClient({
    url: "redis://localhost:6379"
})

redisClient.on('connect', () => {
    console.log('Redis is connected');
})

redisClient.on('error', () => {
    console.log('Redis connection failed');
})

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.log(error);
    }
};

connectRedis();

app.post('/shortenUrl', async (req, res) => {
    const originalUrl = req.body["originalUrl"];
    if (!originalUrl) {
        res.json({
            status: false,
            error: "Please pass the long url",
        });
    } else {
        try {
            const id = await redisClient.incr('global_counter');
            // console.log(id);

            const shortUrlId = encodeBase62(id);
            // console.log(shortUrlId);


            await redisClient.hSet('urls', shortUrlId, originalUrl)
            res.json({
                status: true,
                data: "http://microurl.com/" + shortUrlId
            })

        } catch (error) {
            console.log(error);
            res.json({
                status: false,
                error: error
            })
        }
    }
})


// Get a long URL from the shorten URL
app.get('/:shortUrlId', async (req, res) => {
    const shortUrlId = req.params.shortUrlId;
    const originalUrl = await redisClient.hGet("urls", shortUrlId);
    res.json({
        status: true,
        data: originalUrl,
    })
})

app.listen((3001), () => {
    console.log(`Server is running on port 3001`);
})      