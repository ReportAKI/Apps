import { Router } from 'express';
import healthCheck from './health-check.js';
import searchRouter from './search.js';
import propertyRouter from './property.js';
import exportRouter from './export.js';
import arcgisRouter from './arcgis.js';
import geocodeRouter from './geocode.js';
import ktimatilogiuRouter from './ktimatilogiu.js';
import sdigmapRouter from './sdigmap.js';
import sdigmapScrapeRouter from './sdigmap-scrape.js';
import sdigmapFullRouter from './sdigmap-full.js';
import sdigmapLayersRouter from './sdigmap-layers.js';
import propertySummaryRouter from './property-summary.js';
import exportCodeRouter from './export-code.js';
import mobileDownloadRouter from './mobile-download.js';
import installApkRouter from './install-apk.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.get('/export-code', exportCodeRouter);
    mobileDownloadRouter(router);
    installApkRouter(router);
    router.use('/property-summary', propertySummaryRouter);
    router.use('/search', searchRouter);
    router.use('/property', propertyRouter);
    router.use('/export', exportRouter);
    router.use('/arcgis', arcgisRouter);
    router.use('/ktimatilogiu', ktimatilogiuRouter);
    router.use('/sdigmap', sdigmapRouter);
    router.use('/sdigmap-scrape', sdigmapScrapeRouter);
    router.use('/sdigmap-full', sdigmapFullRouter);
    router.use('/sdigmap-layers', sdigmapLayersRouter);
    router.use('/', geocodeRouter);

    return router;
};
