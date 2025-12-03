# Deployment Guide

This application is built with Next.js and is ready to be deployed to Vercel.

## Prerequisites

1.  **GitHub Account**: You need a GitHub account to host your repository.
2.  **Vercel Account**: You need a Vercel account (can sign up with GitHub).

## Step 1: Push to GitHub

1.  Create a new repository on GitHub.
2.  Push your local code to the new repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## Step 2: Deploy to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./` (default).
    *   **Environment Variables**:
        *   Expand the "Environment Variables" section.
        *   Add the following variable:
            *   **Key**: `GIST_API_URL`
            *   **Value**: `https://library.gist.ac.kr:8443`
5.  Click **"Deploy"**.

## Step 3: Verify Deployment

1.  Wait for the deployment to finish (usually 1-2 minutes).
2.  Click on the **Domain** link provided by Vercel (e.g., `gist-library-reservation.vercel.app`).
3.  Test the application:
    *   Try logging in.
    *   Check if rooms are loaded.
    *   Try making a reservation.

## Troubleshooting

-   **CORS Issues**: If you see CORS errors, ensure the `next.config.ts` rewrite rule is working correctly. The `GIST_API_URL` environment variable must be set correctly in Vercel.
-   **API Errors**: Check the Vercel **Function Logs** (under the "Logs" tab) to see if the API requests are failing on the server side.
