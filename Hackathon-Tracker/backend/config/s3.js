const { S3Client } = require('@aws-sdk/client-s3');

const clientConfig = {
    region: process.env.AWS_S3_REGION || "eu-north-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    console.log("[S3] Using credentials from environment variables.");
} else {
    console.log("[S3] No explicit credentials found. Relying on IAM Role / instance metadata.");
}

const s3Client = new S3Client(clientConfig);

module.exports = s3Client;
