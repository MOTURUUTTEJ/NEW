require('dotenv').config();
const dynamoService = require('./services/dynamoService');

async function test() {
    try {
        const overviewRes = await dynamoService.getAdminDashboardOverview();
        console.log("Overview Users Count:", overviewRes.users.length);
        console.log("User Roles:", overviewRes.users.map(u => u.role));

        const teams = overviewRes.users.filter(u => u.role === 'team');
        console.log("Teams Count:", teams.length);

        const hackathons = await dynamoService.getGlobalHackathons();
        console.log("Global Hackathons Count:", hackathons.length);
    } catch (err) {
        console.error(err);
    }
}
test();
