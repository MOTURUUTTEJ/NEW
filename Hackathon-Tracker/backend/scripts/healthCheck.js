/**
 * scripts/healthCheck.js
 *
 * Run with:  node scripts/healthCheck.js
 *
 * Validates:
 *   1. Required environment variables are set
 *   2. DynamoDB is reachable
 *   3. S3 bucket is accessible
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

// ─── 1. Check Required Env Vars ─────────────────────────────────────────────
const REQUIRED_VARS = [
    'PORT',
    'JWT_SECRET',
    'DYNAMODB_REGION',
    'DYNAMODB_PROJECTS_TABLE',
    'DYNAMODB_HACKATHONS_TABLE',
];

let allGood = true;
console.log('\n=== Hackathon Backend Health Check ===\n');

console.log('[1/3] Checking environment variables...');
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
    console.error(`  ❌ Missing required env vars: ${missing.join(', ')}`);
    allGood = false;
} else {
    console.log('  ✅ All required env vars are present.');
}

// Credentials check
const hasExplicitCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
if (hasExplicitCreds) {
    console.log('  ℹ  AWS credentials: using explicit env vars (local/manual mode).');
} else {
    console.log('  ℹ  AWS credentials: relying on IAM Role / instance metadata (EC2 mode).');
}

// ─── 2. Check DynamoDB ───────────────────────────────────────────────────────
async function checkDynamo() {
    console.log('\n[2/3] Checking DynamoDB connectivity...');
    const config = {
        region: process.env.DYNAMODB_REGION || 'eu-north-1',
    };
    if (hasExplicitCreds) {
        config.credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
    }
    const client = new DynamoDBClient(config);
    try {
        const data = await client.send(new ListTablesCommand({}));
        const tables = data.TableNames || [];
        const requiredTables = [
            process.env.DYNAMODB_PROJECTS_TABLE,
            process.env.DYNAMODB_HACKATHONS_TABLE,
            process.env.DYNAMODB_REPORTS_TABLE,
            process.env.DYNAMODB_ISSUES_TABLE,
            process.env.DYNAMODB_PROGRESS_LOGS_TABLE,
        ].filter(Boolean);

        requiredTables.forEach((t) => {
            if (tables.includes(t)) {
                console.log(`  ✅ Table found: ${t}`);
            } else {
                console.error(`  ❌ Table MISSING: ${t}`);
                allGood = false;
            }
        });
    } catch (err) {
        console.error(`  ❌ DynamoDB connection failed: ${err.message}`);
        allGood = false;
    }
}

// ─── 3. Check S3 ────────────────────────────────────────────────────────────
async function checkS3() {
    console.log('\n[3/3] Checking S3 bucket accessibility...');
    if (!process.env.AWS_S3_BUCKET) {
        console.log('  ⚠  AWS_S3_BUCKET not set, skipping S3 check.');
        return;
    }
    const config = {
        region: process.env.AWS_S3_REGION || 'eu-north-1',
    };
    if (hasExplicitCreds) {
        config.credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
    }
    const client = new S3Client(config);
    try {
        await client.send(new HeadBucketCommand({ Bucket: process.env.AWS_S3_BUCKET }));
        console.log(`  ✅ S3 bucket accessible: ${process.env.AWS_S3_BUCKET}`);
    } catch (err) {
        console.error(`  ❌ S3 bucket check failed: ${err.message}`);
        allGood = false;
    }
}

// ─── Run All Checks ──────────────────────────────────────────────────────────
(async () => {
    await checkDynamo();
    await checkS3();

    console.log('\n=== Health Check Result ===');
    if (allGood) {
        console.log('✅  All checks passed. Backend is ready to run.\n');
        process.exit(0);
    } else {
        console.error('❌  One or more checks failed. Fix the issues above before deploying.\n');
        process.exit(1);
    }
})();
