const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAnalytics,
    getTeams,
    getTeamById,
    deleteTeam,
    gradeReport,
    rateProject,
    deleteReport,
    getSignedDownloadUrl,
    listS3Files,
    getActivities,
    deleteActivity,
    createGlobalHackathon,
    getGlobalHackathons,
    deleteGlobalHackathon,
    getDashboardFull
} = require('../controllers/adminController');

const router = express.Router();

router.route('/analytics').get(protect, admin, getAnalytics);

// Activity logs
router.route('/activities').get(protect, admin, getActivities);
router.route('/activities/delete').delete(protect, admin, deleteActivity);

// Teams
router.route('/teams').get(protect, admin, getTeams);
router.route('/teams/:id')
    .get(protect, admin, getTeamById)
    .delete(protect, admin, deleteTeam);

// Reports / artifacts
router.route('/reports/:id/grade').put(protect, admin, gradeReport);
router.route('/projects/:id/rate').put(protect, admin, rateProject);
router.route('/reports/:id/download').get(protect, admin, getSignedDownloadUrl);
router.route('/reports/:id').delete(protect, admin, deleteReport);

// S3
router.route('/s3/list').get(protect, admin, listS3Files);

// Global (admin-managed) hackathons
router.get('/dashboard/full', protect, admin, getDashboardFull);
router.route('/hackathons')
    .post(protect, admin, createGlobalHackathon)
    .get(protect, admin, getGlobalHackathons);
router.route('/hackathons/:id')
    .delete(protect, admin, deleteGlobalHackathon);

module.exports = router;
