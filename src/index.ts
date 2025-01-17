import express from 'express';

import authRouter from './routes/auth';
import otpRouter from './routes/otp';

import { connectDB } from './db';

import { CORS } from './middlewares/CORS';
import { errorHandler } from './middlewares/error';

const app = express();

app.use(CORS);

app.use(express.json());
app.use('/auth', authRouter);
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
