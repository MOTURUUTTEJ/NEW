import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';

// Explicitly apply the plugin
applyPlugin(jsPDF);

/**
 * Generates a Tech Stack & Architecture Design PDF for the Hackathon Tracker
 */
export const generateTechStackPDF = () => {
    try {
        const doc = new jsPDF();
        const primaryColor = [59, 130, 246]; // #3b82f6
        const secondaryColor = [139, 92, 246]; // #8b5cf6

        // --- Title Page ---
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Avanthi Innovation Hub', 105, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.text('Hackathon Tracker - Architecture & Tech Stack', 105, 30, { align: 'center' });

        // --- Section 1: Introduction ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.text('1. System Overview', 20, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const introText = "The Hackathon Tracker is a cloud-native platform designed to manage multiple hackathons, team progress, and project artifacts. It provides a real-time dashboard for administrators to monitor team performance and for teams to manage their project lifecycle.";
        doc.text(doc.splitTextToSize(introText, 170), 20, 65);

        // --- Section 2: Frontend Tech Stack ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Frontend Technologies', 20, 90);

        const frontendData = [
            ['Library', 'React.js (v18)', 'Core UI library for building the SPA.'],
            ['Build Tool', 'Vite', 'Ultra-fast development server and optimized build pipeline.'],
            ['Styling', 'Tailwind CSS', 'Utility-first CSS framework for modern aesthetics.'],
            ['Animations', 'Framer Motion', 'Used for smooth transitions and micro-animations.'],
            ['Charts', 'Recharts', 'SVG-based charting for real-time analytics.'],
            ['Icons', 'Lucide React', 'Consistent, lightweight icon set.'],
            ['State Mgmt', 'React Context API', 'Lightweight state management for Auth and Admin data.'],
            ['HTTP Client', 'Axios', 'Handles API communication with the backend.'],
        ];

        autoTable(doc, {
            startY: 95,
            head: [['Category', 'Technology', 'Purpose']],
            body: frontendData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor }
        });

        // --- Section 3: Backend Tech Stack ---
        const finalY1 = (doc.lastAutoTable?.finalY || 180) + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Backend & Infrastructure', 20, finalY1);

        const backendData = [
            ['Runtime', 'Node.js', 'Asynchronous JS runtime for scalable APIs.'],
            ['Framework', 'Express.js (v5)', 'Fast, minimalist web framework for Node.'],
            ['Persistence', 'AWS DynamoDB', 'NoSQL Serverless database using One-Table Design.'],
            ['Storage', 'AWS S3', 'Object storage for team artifacts and PDF reports.'],
            ['Auth', 'AWS Cognito / JWT', 'Identity management and secure token-based access.'],
            ['API SDK', 'AWS SDK v3', 'Modular AWS clients for DynamoDB and S3.'],
            ['Cloud Mode', 'Cloud-Only', 'Optimized for AWS deployment (Global scalability).'],
        ];

        autoTable(doc, {
            startY: finalY1 + 5,
            head: [['Category', 'Technology', 'Purpose']],
            body: backendData,
            theme: 'striped',
            headStyles: { fillColor: secondaryColor }
        });

        // --- New Page for Architecture Design ---
        doc.addPage();
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text('Architecture Design & Schema', 105, 10, { align: 'center' });

        // --- Section 4: Architecture Components ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('4. System Architecture', 20, 30);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const archText = "The system follows a classic Client-Server architecture with a Serverless Persistence layer. The Frontend communicates with the Express.js Backend via RESTful APIs. The Backend interacts with AWS services (DynamoDB/S3) for data and file storage.";
        doc.text(doc.splitTextToSize(archText, 170), 20, 38);

        // --- Section 5: Database Schema (One-Table Design) ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('5. AWS DynamoDB One-Table Schema', 20, 60);

        const schemaData = [
            ['USER/TEAM', 'USER#<email>', 'METADATA', 'Profile, Role, Password Hash'],
            ['HACKATHON', 'USER#<email>', 'HACK#<id>', 'Local Hackathon details'],
            ['GLOBAL HACK', 'GLOBAL#HACKATHONS', 'GHACK#<id>', 'Visible to every team'],
            ['PROJECT', 'HACK#<id>', 'PROJ#<id>', 'Team project under a hackathon'],
            ['ARTIFACT', 'PROJ#<id>', 'ARTIFACT#<id>', 'S3 links, grading, feedback'],
            ['LOGS', 'GLOBAL#ACTIVITY', 'ACTIVITY#<ts>', 'System-wide audit trail'],
            ['TEAM LOGS', 'USER#<email>', 'ACTIVITY#<ts>', 'Filtered logs for specific teams'],
        ];

        autoTable(doc, {
            startY: 65,
            head: [['Entity', 'Partition Key (PK)', 'Sort Key (SK)', 'Storage Content']],
            body: schemaData,
            theme: 'grid',
            headStyles: { fillColor: [75, 85, 99] }
        });

        // --- Section 6: Security ---
        const finalY2 = (doc.lastAutoTable?.finalY || 150) + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('6. Security & Authorization', 20, finalY2);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const securityItems = [
            '• Role-Based Access Control (RBAC): Admin vs Team roles.',
            '• JWT Authentication: Secure stateless communication.',
            '• S3 Presigned URLs: Artifacts are private by default; URLs generated on-demand.',
            '• Middleware: Protected routes for both API and UI navigation.',
        ];
        securityItems.forEach((item, i) => {
            doc.text(item, 25, finalY2 + 10 + (i * 7));
        });

        // --- Footer ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated on ${new Date().toLocaleDateString()} | Avanthi Innovation Hub - Internal Tech Spec`, 105, 285, { align: 'center' });
            doc.text(`Page ${i} of ${pageCount}`, 190, 285);
        }

        doc.save('Hackathon_Tracker_Architecture_TechStack.pdf');
    } catch (err) {
        console.error('Failed to generate PDF:', err);
        alert('Failed to generate PDF. Check console for details.');
    }
};

export default generateTechStackPDF;
