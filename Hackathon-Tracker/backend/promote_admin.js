const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_S3_REGION || "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const docClient = DynamoDBDocumentClient.from(client);

async function run() {
    try {
        await docClient.send(new UpdateCommand({
            TableName: 'HackathonTracker',
            Key: {
                PK: 'USER#creators@gmail.com',
                SK: 'METADATA'
            },
            UpdateExpression: "SET #r = :r",
            ExpressionAttributeNames: { "#r": "role" },
            ExpressionAttributeValues: { ":r": "admin" }
        }));
        console.log("Updated creators@gmail.com to admin");
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
