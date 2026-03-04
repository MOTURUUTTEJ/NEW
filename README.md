# Hackathon Tracker System

![Hackathon Tracker](https://img.shields.io/badge/Hackathon%20Tracker-v1.0-brightgreen) ![React](https://img.shields.io/badge/React-16.13.1-blue) ![Express](https://img.shields.io/badge/Express-4.17.1-yellow) ![AWS](https://img.shields.io/badge/AWS-Services-orange)

## 📖 Project Information
The **Hackathon Tracker System** is a comprehensive platform designed to manage hackathons effectively. It provides an easy-to-use interface for participants and organizers to keep track of submissions, judges, and schedules. This system leverages modern technologies to ensure a smooth user experience.

## 🏗️ Architecture
The project is structured as a client-server application:
- **Frontend**: React.js creates a responsive user interface.
- **Backend**: Express.js serves as the web server, managing API requests and interactions with the database.
- **Database**: A NoSQL database (like MongoDB) stores participant data, submissions, and event details.

### Architectural Overview:
```
+---------------+           +------------------+           +--------------+ 
|   Frontend    |  <--->   |    Backend API    |  <--->   |   Database   | 
| (React.js)    |           |  (Express.js)    |           | (MongoDB)    | 
+---------------+           +------------------+           +--------------+ 
``` 

## 💻 Tech Stack
- **Frontend**: React.js
- **Backend**: Express.js
- **Database**: MongoDB
- **Cloud Services**: AWS (S3 for storage, Lambda for serverless functions)

## ✨ Features
- User authentication and authorization.
- Event creation and management for organizers.
- Submission tracking and feedback.
- Notifications and real-time updates.
- Admin dashboard for insights and reporting.

## 🚀 Setup Instructions
### Prerequisites
- Node.js (v14.0.0 or later)
- MongoDB (local or cloud instance)
- AWS Account (for deploying AWS services)

### Step-by-Step Setup
1. **Clone the repository:**  
   ```bash
   git clone https://github.com/MOTURUUTTEJ/AIH-T_M-System-
   cd AIH-T_M-System-
   ```

2. **Install dependencies:**  
   ```bash
   npm install
   ```

3. **Set up environment variables:**  
   Create a `.env` file in the root directory and add your database URI and AWS credentials.

4. **Run the application:**  
   - Start the backend:  
   ```bash
   cd backend  
   npm start
   ```  
   - Start the frontend:  
   ```bash
   cd frontend  
   npm start
   ```

5. **Visit the app:**  
   Open your browser and go to `http://localhost:3000` to see the Hackathon Tracker in action.

## 🎉 Contributing
Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.