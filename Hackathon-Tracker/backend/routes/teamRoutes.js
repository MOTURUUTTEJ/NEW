const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
    getTeamProfile,
    updateTeamProfile,
    createHackathon,
    getHackathons,
    updateHackathon,
    deleteHackathon,
    createProject,
    getProjects,
    updateProjectStatus,
    deleteProject,
    uploadReport,
    deleteArtifact,
    reportIssue,
    getTeamIssues,
    deleteIssue,
    solveIssue,
    replyIssue,
    getSignedDownloadUrl,
    getLeaderboard,
    getActivities,
    getGlobalHackathons,
    getReports,
    getProjectHistory,
    getTeams
} = require('../controllers/teamController');

const router = express.Router();

router.route('/teams').get(protect, getTeams);

router.route('/activity').get(protect, getActivities);

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
});

router.route('/profile')
    .get(protect, getTeamProfile)
    .put(protect, updateTeamProfile);

router.route('/hackathons')
    .post(protect, createHackathon)
    .get(protect, getHackathons);

// Must come before /:id to avoid route collision
router.route('/hackathons/global')
    .get(protect, getGlobalHackathons);

router.route('/hackathons/:id')
    .put(protect, updateHackathon)
    .delete(protect, deleteHackathon);

router.route('/projects')
    .post(protect, createProject);

router.route('/projects/:hackathonId')
    .get(protect, getProjects);

router.route('/projects/:id/status')
    .put(protect, updateProjectStatus);

router.route('/projects/:id/history')
    .get(protect, getProjectHistory);

// Delete a project (requires ?hackathon_id=... query param)
router.route('/projects/:id')
    .delete(protect, deleteProject);

router.route('/reports/:id/download')
    .get(protect, getSignedDownloadUrl);

router.route('/projects/:id/report')
    .post(protect, upload.single('pdf'), uploadReport);

router.route('/projects/:id/reports')
    .get(protect, getReports);

// Delete a team's own artifact (requires ?project_id=... query param)
router.route('/reports/:id')
    .delete(protect, deleteArtifact);

router.route('/issues').post(protect, upload.single('image'), reportIssue);
router.route('/issues').get(protect, getTeamIssues);

router.route('/issues/:id/solve')
    .put(protect, solveIssue);

router.route('/issues/:id/reply').put(protect, replyIssue);

router.route('/issues/:id').delete(protect, deleteIssue);

router.route('/leaderboard')
    .get(protect, getLeaderboard);

module.exports = router;
