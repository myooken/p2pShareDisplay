# Deploying to GitHub Pages

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

## Prerequisites

1.  **GitHub Repository**: Ensure this project is pushed to a GitHub repository.
2.  **Package.json**: Update the `homepage` field in `package.json` with your actual GitHub Pages URL.
    ```json
    "homepage": "https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>"
    ```

## Enabling GitHub Pages

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Pages**.
3.  Under **Build and deployment**, select **GitHub Actions** as the source.
    *   *Note: If you don't see "GitHub Actions", you might need to push the `.github/workflows/deploy.yml` file first.*

## Deployment Process

1.  Push your changes to the `main` branch.
2.  The GitHub Action defined in `.github/workflows/deploy.yml` will automatically run.
3.  It will build the project and deploy it to the `gh-pages` environment.
4.  Once finished, your site will be live at the URL specified in your repository settings (usually `https://<username>.github.io/<repo-name>/`).

## Troubleshooting

-   **404 Errors**: If you see a 404 error, ensure the `base` in `vite.config.js` is set to `'./'` (which it is) and that your `homepage` in `package.json` is correct.
-   **Routing Issues**: The app uses `HashRouter`, so reloading pages should work fine on GitHub Pages.
