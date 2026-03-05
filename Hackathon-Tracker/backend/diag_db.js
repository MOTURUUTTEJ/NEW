const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_S3_REGION || "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

async function run() {
    try {
        const data = await client.send(new ScanCommand({ TableName: 'HackathonTracker' }));
        console.log("Total Items:", data.Items.length);
        const types = data.Items.reduce((acc, item) => {
            const typeValue = item.type ? item.type.S : 'UNDEFINED';
            acc[typeValue] = (acc[typeValue] || 0) + 1;
            return acc;
        }, {});
        console.log("Item Types:", types);

        // Let's also see some USER items if they exist
        const users = data.Items.filter(i => i.type && i.type.S === 'USER');
        console.log("Sample Users:", JSON.stringify(users.slice(0, 2), null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
