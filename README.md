# Flatify AI: AI-Powered Logo Generation and Image Editing

## 🚀 Project Description

Flatify AI is a cutting-edge web application designed to empower users with AI-driven logo generation and intuitive image editing capabilities. Leveraging advanced AI models, Flatify AI allows users to effortlessly create unique logos from text prompts, refine existing designs, and perform various image manipulations. The platform caters to different user needs with specialized generation modes: Novice, Professional, and an Image Editor.

## ✨ Features

*   **AI-Powered Logo Generation**: Generate unique and creative logos from simple text descriptions using state-of-the-art AI models.
*   **Multiple Generation Modes**:
    *   **Novice Mode**: Simplified interface for quick and easy logo creation, ideal for beginners.
    *   **Professional Mode**: Advanced controls and options for experienced designers seeking precise customization.
    *   **Image Editor**: Tools for refining generated logos or editing other images, including features like background removal, color adjustments, and more.
*   **Logo Refinement**: Iterate on generated logos by providing additional prompts to refine style, elements, and overall appearance.
*   **User Authentication**: Secure user login and signup powered by Clerk for personalized experiences and prompt history management.
*   **Prompt History**: Keep track of past logo generation prompts and their results for easy access and re-use.
*   **Responsive Design**: A seamless user experience across various devices, from desktops to mobile phones.

## 💻 Technologies Used

*   **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
*   **Backend**: Next.js API Routes
*   **Authentication**: Clerk
*   **AI/ML**: Genkit, Google AI (likely for model integration)
*   **Database**: MongoDB (for prompt history and user data)
*   **Deployment**: Google Cloud Platform (indicated by `apphosting.yaml`)

## 🏁 Getting Started

Follow these steps to set up and run Flatify AI locally on your machine.

### Prerequisites

*   Node.js (v18 or higher)
*   npm or Yarn
*   MongoDB instance (local or cloud-based)
*   Clerk account for authentication
*   Google Cloud Project with Genkit setup (if running AI locally)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bhargavtz/flatify-ai.git
    cd flatify-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory of the project and add the following:

    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    MONGODB_URI=your_mongodb_connection_string
    GOOGLE_AI_API_KEY=your_google_ai_api_key # Required if using Google AI models
    ```
    Replace the placeholder values with your actual keys and connection strings.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

    The application will be accessible at `http://localhost:3000`.

## 💡 Usage

1.  **Sign Up/Log In**: Register for a new account or log in using your Clerk credentials.
2.  **Navigate to Dashboard**: Access the main dashboard where you can choose your desired generation mode.
3.  **Generate Logos**:
    *   **Novice/Professional Mode**: Enter a text prompt describing the logo you want to create and initiate the generation process.
    *   **Image Editor**: Upload an image or select a generated logo to apply various editing tools.
4.  **Review and Refine**: View your generated logos, save them, or use the refinement options to iterate on designs.

## 📁 Project Structure

```
.
├── public/                 # Static assets
├── src/
│   ├── ai/                 # AI-related configurations and flows (Genkit)
│   │   ├── flows/          # AI generation flows (e.g., logo generation, refinement)
│   ├── app/                # Next.js application routes and pages
│   │   ├── (app)/          # Authenticated routes (dashboard, generate, help)
│   │   ├── api/            # API routes for AI generation and user data
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable React components
│   │   └── ui/             # Shadcn UI components
│   ├── contexts/           # React Context API for global state
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions and MongoDB connection
├── docs/                   # Documentation files (e.g., Clerk docs, blueprints)
├── .env                    # Environment variables
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── README.md               # This file
└── tsconfig.json           # TypeScript configuration
```

## 🤝 Contributing

We welcome contributions to Flatify AI! Please see our `CONTRIBUTING.md` (if available) for guidelines on how to submit pull requests, report issues, and contribute to the development.

## � License

This project is licensed under the [MIT License](LICENSE).


## 🙏 Acknowledgments

- Special thanks to the developers and communities behind Next.js, React, Tailwind CSS, and Shadcn UI for providing robust frameworks and components.
- Gratitude to Google AI and Genkit for the powerful AI capabilities that drive the logo generation and image editing features.
- Appreciation for Clerk for simplifying user authentication.
- Thanks to the open-source community for various libraries and tools that made this project possible.

---
Made with ❤️ by Bhargavtz
