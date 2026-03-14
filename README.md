# FloraGuide - Your Digital Garden Assistant

FloraGuide is a full-stack AI-powered gardening application that helps you identify plants, get expert care advice, and maintain a digital history of your garden.

## Features

- **AI Plant Identification**: Take a photo or upload an image to identify plants instantly using Gemini 1.5 Flash.
- **Expert Care Advice**: Get detailed care instructions, including watering, sunlight, and soil requirements.
- **AI Gardening Assistant**: Chat with "Flora," an AI expert, for any gardening questions.
- **Digital Garden (History)**: Sign in with Google to save your identified plants to a personal history.
- **Responsive Design**: Beautiful, mobile-friendly interface built with Tailwind CSS and Framer Motion.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion.
- **Backend/Database**: Firebase (Authentication & Firestore).
- **AI**: Google Gemini API (@google/genai).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Cloud Project with the Gemini API enabled.
- A Firebase Project.

### Local Setup

1. **Clone the repository** (if exported to GitHub) or extract the ZIP.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Firebase Configuration**:
   The project uses `firebase-applet-config.json` for configuration. Ensure this file contains your Firebase project details:
   ```json
   {
     "apiKey": "...",
     "authDomain": "...",
     "projectId": "...",
     "storageBucket": "...",
     "messagingSenderId": "...",
     "appId": "...",
     "firestoreDatabaseId": "..."
   }
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```
6. **Open the app**: Navigate to `http://localhost:3000`.

## Deployment

### Firebase Rules
Before going live, ensure you deploy the Firestore security rules found in `firestore.rules` to your Firebase project via the Firebase Console or CLI.

### Hosting
You can deploy the frontend to services like Vercel, Netlify, or Firebase Hosting. For the full-stack features (if any server-side logic is added), Google Cloud Run is recommended.

## License
MIT
