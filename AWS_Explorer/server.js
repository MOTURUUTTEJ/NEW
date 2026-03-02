const express = require('express');
const { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, GetBucketLocationCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

let s3Config = {};
let globalS3Client; // Default client for listing buckets (us-east-1)

// Helper: Get S3 Client for a specific bucket
const getS3Client = async (bucketName) => {
    if (!bucketName) return globalS3Client;

    try {
        // Try with global client first to get location
        const command = new GetBucketLocationCommand({ Bucket: bucketName });
        const data = await globalS3Client.send(command);
        let region = data.LocationConstraint || 'us-east-1';
        // 'EU' is eu-west-1
        if (region === 'EU') region = 'eu-west-1';

        console.log(`Bucket ${bucketName} is in region: ${region}`);

        return new S3Client({
            region: region,
            credentials: s3Config.credentials
        });
    } catch (error) {
        console.warn(`Could not determine region for ${bucketName}, defaulting to ap-south-1 (Mumbai) as fallback. Error: ${error.message}`);
        // Fallback for India region since user is likely there
        return new S3Client({
            region: 'ap-south-1',
            credentials: s3Config.credentials
        });
    }
};

// Function to load credentials and initialize S3 client
const initS3 = async () => {
    return new Promise((resolve, reject) => {
        try {
            const fileContent = fs.readFileSync('rootkey.csv', 'utf8');
            const lines = fileContent.trim().split('\n');
            if (lines.length < 2) {
                return reject(new Error('rootkey.csv format invalid or empty'));
            }

            const credentialLine = lines[1].trim();
            const parts = credentialLine.split(',');

            if (parts.length < 2) {
                return reject(new Error('Invalid credentials format in rootkey.csv'));
            }

            const accessKeyId = parts[0].trim();
            const secretAccessKey = parts[1].trim();

            console.log('Credentials loaded:', accessKeyId.substring(0, 5) + '...');

            s3Config.credentials = {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey
            };

            // Global client initialized with default region
            globalS3Client = new S3Client({
                region: 'us-east-1',
                credentials: s3Config.credentials
            });

            console.log('Global S3 Client initialized successfully');
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

// API: List Buckets
app.get('/api/buckets', async (req, res) => {
    if (!globalS3Client) return res.status(500).json({ error: 'S3 Client not initialized' });
    try {
        const command = new ListBucketsCommand({});
        const response = await globalS3Client.send(command);
        res.json(response.Buckets);
    } catch (error) {
        console.error('Error listing buckets:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Create Bucket
app.post('/api/buckets', async (req, res) => {
    if (!globalS3Client) return res.status(500).json({ error: 'S3 Client not initialized' });
    const { bucketName } = req.body;

    if (!bucketName) {
        return res.status(400).json({ error: 'Bucket name is required' });
    }

    try {
        const command = new CreateBucketCommand({ Bucket: bucketName });
        await globalS3Client.send(command);
        res.json({ message: 'Bucket created successfully', bucketName });
    } catch (error) {
        console.error('Error creating bucket:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: List Files in Bucket
app.get('/api/files/:bucketName', async (req, res) => {
    if (!globalS3Client) return res.status(500).json({ error: 'S3 Client not initialized' });
    const { bucketName } = req.params;
    try {
        const client = await getS3Client(bucketName);
        const command = new ListObjectsV2Command({ Bucket: bucketName });
        const response = await client.send(command);
        res.json(response.Contents || []);
    } catch (error) {
        console.error(`Error listing files in ${bucketName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// API: Upload File
app.post('/api/upload/:bucketName', upload.single('file'), async (req, res) => {
    if (!globalS3Client) return res.status(500).json({ error: 'S3 Client not initialized' });
    const { bucketName } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const client = await getS3Client(bucketName);
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: file.originalname,
            Body: file.buffer,
            ContentType: file.mimetype
        });
        await client.send(command);
        res.json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error(`Error uploading file to ${bucketName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// API: Download File (Generate Presigned URL)
app.get('/api/download/:bucketName/:key', async (req, res) => {
    if (!globalS3Client) return res.status(500).json({ error: 'S3 Client not initialized' });
    const { bucketName, key } = req.params;
    try {
        const client = await getS3Client(bucketName);
        const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        res.json({ url });
    } catch (error) {
        console.error(`Error generating download URL for ${bucketName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// API: Delete File
app.delete('/api/delete/:bucketName/:key', async (req, res) => {
    if (!globalS3Client) return res.status(500).json({ error: 'S3 Client not initialized' });
    const { bucketName, key } = req.params;
    try {
        const client = await getS3Client(bucketName);
        const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
        await client.send(command);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error(`Error deleting file from ${bucketName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
initS3()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize S3 client:', err);
    });
