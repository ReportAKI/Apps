import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

const app = express();

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

// 1. Προσαρμογή του Helmet ώστε να μην μπλοκάρει πόρους και HTTP κλήσεις στο τοπικό δίκτυο
app.use(helmet({
	contentSecurityPolicy: false,
	crossOriginResourcePolicy: false,
	crossOriginEmbedderPolicy: false
}));

// 2. Ρύθμιση CORS: Επιτρέπει τόσο το localhost όσο και όλες τις διευθύνσεις του τοπικού δικτύου (κινητά Android/iOS)
app.use(cors({
	origin: (origin, callback) => {
		// Επιτρέπονται εργαλεία χωρίς origin (π.χ. mobile webviews/apps, curl, postman) ή οποιοδήποτε origin στο local dev
		callback(null, true);
	},
	credentials: true,
}));

app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

app.use('/', routes());

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3000;

// 3. Δεσμεύουμε την ακρόαση στο 0.0.0.0 ώστε να δέχεται συνδέσεις από κινητά στο Wi-Fi
app.listen(port, '0.0.0.0', () => {
	logger.info(`🚀 API Server running on http://0.0.0.0:${port} (Accessible locally via your PC IP)`);
});

export default app;