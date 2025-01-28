import express from 'express';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth';
import otpRouter from './routes/otp';

import { connectDB } from './db';

import { CORS } from './middlewares/CORS';
import { errorHandler } from './middlewares/error';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});
app.use(limiter);

app.use(CORS);

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: 'Too many authentication requests, please try again in an hour',
});
app.use('/auth', authLimiter, authRouter);

app.use(otpRouter);

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
