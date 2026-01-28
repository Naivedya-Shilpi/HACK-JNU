# Environment Setup Guide

## 🔐 Security Notice

**IMPORTANT**: Never commit `.env` files with actual API keys to Git. All sensitive credentials should be stored in `.env.local` files which are excluded from version control.

## 📋 Setup Instructions

### 1. Backend Environment Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` and add your actual API keys:
   ```bash
   # Open in your editor
   notepad .env.local  # Windows
   # or
   nano .env.local     # Linux/Mac
   ```

4. Update the following variables:

   **Grok API Key** (Required for AI features):
   - Get your API key from: https://console.x.ai
   - Replace `your_grok_api_key_here` with your actual key
   
   **OpenAI API Key** (Optional alternative):
   - Get your API key from: https://platform.openai.com
   - Replace `your_openai_api_key_here` with your actual key

   **JWT Secret** (Required for authentication):
   - Generate a secure random string
   - Replace `your_jwt_secret_key_here` with your secret

### 2. Environment Variables Reference

#### Server Configuration
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `FRONTEND_URL`: Frontend application URL

#### AI/LLM Configuration
- `GROK_API_KEY`: Your Grok API key from https://console.x.ai
- `OPENAI_API_KEY`: Your OpenAI API key (alternative to Grok)
- `GROK_API_URL`: Grok API endpoint (default: https://api.x.ai/v1)
- `LLM_MODEL`: Model to use (grok-2-latest or gpt-3.5-turbo)
- `USE_GROK`: Set to 'true' to use Grok, 'false' for OpenAI

#### Database Configuration
- `MONGODB_URI`: MongoDB connection string (optional)

#### Security
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRES_IN`: Token expiration time (default: 7d)

#### External APIs (Optional)
- `GOVERNMENT_API_KEY`: Government portal API key
- `GST_API_KEY`: GST portal API key

#### Logging & Rate Limiting
- `LOG_LEVEL`: Logging level (info/debug/error)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## 🚀 Running the Application

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
npm install
npm run dev
```

## 🔒 Security Best Practices

1. **Never commit `.env` or `.env.local` files**
   - These are already in `.gitignore`
   - Only commit `.env.example` as a template

2. **Rotate API keys regularly**
   - Especially if they were accidentally exposed

3. **Use different keys for development and production**

4. **Store production secrets securely**
   - Use environment variable management tools
   - Consider using services like AWS Secrets Manager, Azure Key Vault, etc.

## 🆘 Troubleshooting

### "API key not found" error
- Ensure `.env.local` exists in the backend directory
- Check that `GROK_API_KEY` or `OPENAI_API_KEY` is set
- Verify the API key is valid and active

### Backend won't start
- Check if port 3001 is already in use
- Verify all required environment variables are set
- Check the console for specific error messages

### AI responses not working
- Verify your API key is correct
- Check your API quota/credits
- Ensure `USE_GROK=true` is set if using Grok
- Check backend logs for API errors

## 📝 Notes

- The `.env.example` file shows the structure but contains placeholder values
- The `.env.local` file (not tracked by Git) should contain your actual secrets
- The backend will use fallback responses if no API key is configured
- You can switch between Grok and OpenAI by changing the `USE_GROK` variable
