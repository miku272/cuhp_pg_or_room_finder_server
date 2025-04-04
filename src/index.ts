import express from 'express';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth';
import otpRouter from './routes/otp';
import propertyRouter from './routes/property';

import { connectDB } from './db';

import { CORS } from './middlewares/CORS';
import { errorHandler } from './middlewares/error';

const app = express();

const limiter = rateLimit({
  keyGenerator: (req) => {
    return req.ip + req.originalUrl;
  },
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});
app.use(limiter);

app.use(CORS);

app.use(express.json());

app.use('/auth', authRouter);

app.use(otpRouter);

app.use(propertyRouter);

app.get('/', (req, res) => {
  res.send('Hello World!!!');
});

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(8000, () => {
      console.log('Server started on http://localhost:8000');
    });
  } catch (error) {
    console.error('Failed to start the server: ', error);

    process.exit(1);
  }
};

void startServer();
