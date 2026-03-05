const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// Build client config - only pass explicit credentials if they are set in env.
// On EC2 with an IAM Role attached, credentials are auto-resolved from the
// instance metadata service (IMDS), so NO explicit credentials block is needed.
const clientConfig = {
    region: process.env.DYNAMODB_REGION || process.env.AWS_S3_REGION || "eu-north-1",
};

// When running locally, use env credentials.
// When running on EC2 with an IAM Role, the SDK will automatically use IMDS.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    console.log("[DynamoDB] Using credentials from environment variables.");
} else {
    console.log("[DynamoDB] No explicit credentials found. Relying on IAM Role / instance metadata.");
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    },
});

module.exports = { docClient, TABLE_NAME: process.env.DYNAMODB_TABLE || "HackathonTracker" };
