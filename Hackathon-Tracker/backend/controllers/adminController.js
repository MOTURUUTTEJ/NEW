const dynamoService = require('../services/dynamoService');
const { ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require('../config/s3');

/**
 * @desc Get global analytics
 */
const getAnalytics = async (req, res) => {
    try {
        const { users, hackathons, projects } = await dynamoService.getAdminDashboardOverview();
        const teams = users.filter(u => u.role === 'team');

        const completed = projects.filter(p => p.status === 'Completed').length;
        const active = projects.filter(p => p.status !== 'Completed' && p.status !== 'Idea').length;

        const statusCounts = projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});
        const projectStatusDistribution = Object.entries(statusCounts).map(([id, count]) => ({ _id: id, count }));

        const teamAverageProgress = teams.map(t => {
            const teamProjs = projects.filter(p => p.team_id === t._id);
            const avg = teamProjs.length > 0 ? (teamProjs.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / teamProjs.length) : 0;
            return { team_name: t.team_name, avg_progress: Math.round(avg) };
        });

        const hackathonParticipation = hackathons.map(h => {
            const count = projects.filter(p => p.hackathon_id === h._id).length;
            return { name: h.hackathon_name, value: count };
        });

        res.json({
            overview: {
                totalTeams: teams.length,
                totalHackathons: hackathons.length,
                activeProjects: active,
                completedProjects: completed
            },
            projectStatusDistribution,
            teamAverageProgress,
            hackathonParticipation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get all teams list
 */
const getTeams = async (req, res) => {
    try {
        const users = await dynamoService.getAllUsers();
        const teams = users.filter(u => u.role === 'team');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get detailed team profile
 */
const getTeamById = async (req, res) => {
    try {
        const users = await dynamoService.getAllUsers();
        const team = users.find(u => u._id === req.params.id);

        if (team) {
            const [teamHackathons, globalHackathons, projects, activities] = await Promise.all([
                dynamoService.getHackathonsByUser(team.email),
                dynamoService.getGlobalHackathons(),
                dynamoService.getAllProjects(),
                dynamoService.getActivitiesByUser(team.email, 20)
            ]);

            const teamProjects = projects.filter(p => p.team_id === team._id);

            // Merge team hackathons with global hackathons (deduplicated)
            const teamHackIds = new Set(teamHackathons.map(h => h._id));
            const relevantGlobalHackathons = globalHackathons.filter(gh => {
                // Include global hackathon if team has projects under it, or always include to show availability
                return !teamHackIds.has(gh._id);
            });
            const allHackathons = [...teamHackathons, ...relevantGlobalHackathons];

            const populatedProjects = await Promise.all(teamProjects.map(async p => {
                const reports = await dynamoService.getReportsByProject(p._id);
                return { ...p, reports };
            }));

            res.json({ ...team, hackathons: allHackathons, projects: populatedProjects, activities: activities || [] });
        } else {
            res.status(404).json({ message: 'Team not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Delete a team from cloud
 */
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const users = await dynamoService.getAllUsers();
        const team = users.find(u => u._id === id);

        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Cascade: delete all hackathons → projects → reports → issues
        const hackathons = await dynamoService.getHackathonsByUser(team.email);
        for (const h of hackathons) {
            const projects = await dynamoService.getProjectsByHackathon(h._id);
            for (const p of projects) {
                const reports = await dynamoService.getReportsByProject(p._id);
                for (const r of reports) {
                    // Also delete from S3
                    try {
                        await s3Client.send(new DeleteObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: r.file_url
                        }));
                    } catch (s3Err) {
                        console.error('S3 delete error during team cleanup:', s3Err.message);
                    }
                    await dynamoService.deleteReport(p._id, r._id);
                }
                await dynamoService.deleteProject(h._id, p._id);
            }
            await dynamoService.deleteHackathon(team.email, h._id);
        }

        // Delete the user metadata record
        await dynamoService.deleteUser(team.email);
        res.json({ message: 'Team and all associated data removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Update artifact grading
 */
const gradeReport = async (req, res) => {
    try {
        const { rating, feedback, project_id } = req.body;
        const reports = await dynamoService.getReportsByProject(project_id);
        const report = reports.find(r => r._id === req.params.id);

        if (report) {
            const updated = await dynamoService.saveReport(project_id, {
                ...report,
                rating,
                feedback
            });
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Delete team artifact (Admin)
 */
const deleteReport = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) {
            return res.status(400).json({ message: 'project_id query param is required' });
        }
        const reports = await dynamoService.getReportsByProject(project_id);
        const report = reports.find(r => r._id === req.params.id);

        if (report) {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: report.file_url
            }));
            await dynamoService.deleteReport(project_id, req.params.id);
            res.json({ message: 'Artifact deleted from cloud' });
        } else {
            res.status(404).json({ message: 'Artifact not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc List all files in team artifacts bucket
 */
const listS3Files = async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET,
            Prefix: 'artifacts/'
        });
        const { Contents } = await s3Client.send(command);
        res.json(Contents || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Explicitly rate a project
 */
const rateProject = async (req, res) => {
    try {
        const { rating, hackathon_id } = req.body;
        const project = await dynamoService.getProject(hackathon_id, req.params.id);

        if (project) {
            const updated = await dynamoService.saveProject(hackathon_id, {
                ...project,
                rating,
                isRated: true
            });
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getSignedDownloadUrl = async (req, res) => {
    try {
        const { project_id, action } = req.query;
        if (!project_id) {
            return res.status(400).json({ message: 'project_id query param is required' });
        }
        // Look up the real S3 key from the report record
        const reports = await dynamoService.getReportsByProject(project_id);
        const report = reports.find(r => r._id === req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const commandParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: report.file_url,
        };

        // If action=view, set content disposition to inline so browser opens the file
        if (action === 'view') {
            commandParams.ResponseContentDisposition = 'inline';
        } else {
            // Force download with original filename
            const fileName = report.original_name || 'download';
            commandParams.ResponseContentDisposition = `attachment; filename="${fileName}"`;
        }

        const command = new GetObjectCommand(commandParams);
        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        res.json({ downloadUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivities = async (req, res) => {
    try {
        const activities = await dynamoService.getGlobalActivity(50);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch global logs' });
    }
};

/**
 * @desc Admin: Delete a single activity log entry
 */
const deleteActivity = async (req, res) => {
    try {
        const { sk } = req.body;
        const targetSk = sk || req.body.SK;

        if (!targetSk) {
            return res.status(400).json({ message: 'Sort key (sk) is required for deletion' });
        }

        await dynamoService.deleteActivity(targetSk);
        res.json({ message: 'Activity log deleted from cloud' });
    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get full dashboard package (Analytics + Logs + Hackathons)
 */
const getDashboardFull = async (req, res) => {
    try {
        const [overviewRes, activities, hackathons] = await Promise.all([
            dynamoService.getAdminDashboardOverview(),
            dynamoService.getGlobalActivity(100),
            dynamoService.getGlobalHackathons()
        ]);

        const { users, hackathons: hList, projects } = overviewRes;
        const teams = users.filter(u => u.role === 'team');
        const completed = projects.filter(p => p.status === 'Completed').length;
        const active = projects.filter(p => p.status !== 'Completed' && p.status !== 'Idea').length;

        const statusCounts = projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});
        const projectStatusDistribution = Object.entries(statusCounts).map(([id, count]) => ({ _id: id, count }));

        const teamAverageProgress = teams.map(t => {
            const teamProjs = projects.filter(p => p.team_id === t._id);
            const avg = teamProjs.length > 0 ? (teamProjs.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / teamProjs.length) : 0;
            return { team_name: t.team_name, avg_progress: Math.round(avg) };
        });

        const hackathonParticipation = hList.map(h => {
            const count = projects.filter(p => p.hackathon_id === h._id).length;
            return { name: h.hackathon_name, value: count };
        });

        res.json({
            metrics: {
                overview: { totalTeams: teams.length, totalHackathons: hList.length, activeProjects: active, completedProjects: completed },
                projectStatusDistribution,
                teamAverageProgress,
                hackathonParticipation
            },
            activities,
            hackathons,
            teams,
            projects
        });
    } catch (error) {
        console.error('Combined dashboard fetch error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Admin: Create a global hackathon (visible to all teams)
 */
const createGlobalHackathon = async (req, res) => {
    try {
        const { hackathon_name, start_date, end_date, description } = req.body;

        if (!hackathon_name) {
            return res.status(400).json({ message: 'Hackathon name is required' });
        }

        const hackathon = await dynamoService.saveGlobalHackathon({
            hackathon_name,
            start_date,
            end_date,
            description,
            created_by: req.user?.email || req.user?.loginEmail || 'Admin'
        });

        // Log the activity
        await dynamoService.saveActivity({
            action: 'ADMIN_HACKATHON_CREATE',
            detail: `Created global hackathon: ${hackathon_name}`,
            email: req.user?.email || req.user?.loginEmail || 'Admin',
            team_name: 'Admin System',
            icon: 'Globe'
        });

        res.status(201).json(hackathon);
    } catch (error) {
        console.error('Global Hackathon Creation Error (Full Stack):', error);
        res.status(500).json({
            message: 'Failed to create hackathon',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc Admin: Get all global hackathons
 */
const getGlobalHackathons = async (req, res) => {
    try {
        const hackathons = await dynamoService.getGlobalHackathons();
        res.json(hackathons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Admin: Delete a global hackathon
 */
const deleteGlobalHackathon = async (req, res) => {
    try {
        await dynamoService.deleteGlobalHackathon(req.params.id);
        await dynamoService.saveActivity({
            action: 'ADMIN_HACKATHON_DELETE',
            detail: `Admin removed hackathon ID: ${req.params.id}`,
            email: req.user.email,
            team_name: 'Admin',
            icon: 'Trash2'
        });
        res.json({ message: 'Global hackathon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnalytics, getTeams, getTeamById, deleteTeam,
    gradeReport, deleteReport, listS3Files, rateProject, getSignedDownloadUrl,
    getActivities, deleteActivity,
    createGlobalHackathon, getGlobalHackathons, deleteGlobalHackathon,
    getDashboardFull
};
