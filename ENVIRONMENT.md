# Environment Configuration Guide

This document explains how to configure environment variables for the Swift Assistant application.

## Environment Files

- `.env` - Development configuration
- `.env.production` - Production configuration for Vercel
- `.env.example` - Template with all available variables

## Key Environment Variables

### API Configuration

#### `PUBLIC_API_BASE_URL`
- **Description**: Main API base URL for all backend API calls
- **Development**: `http://127.0.0.1:8000`
- **Production**: `https://swift-ai-assist.e8demo.com`
- **Required**: Yes

#### `PUBLIC_CUSTOM_API_BASE_URL`
- **Description**: API URL specifically for chatbot builder functionality
- **Development**: `http://127.0.0.1:8000`
- **Production**: `https://swift-ai-assist.e8demo.com`
- **Required**: Yes

#### `PUBLIC_FRONTEND_ONLY`
- **Description**: Enable frontend-only mode (chatbot builder without full backend)
- **Values**: `true` or `false`
- **Default**: `false`
- **Required**: No

### Legacy Variables (Backward Compatibility)

#### `VITE_API_BASE_URL`
- **Description**: Legacy Vite API base URL
- **Note**: Maintained for backward compatibility

#### `LANGUAGES_API_BASE_URL`
- **Description**: Legacy languages API URL
- **Note**: Maintained for backward compatibility

### External Services

#### `OLLAMA_BASE_URL`
- **Description**: Ollama service URL for AI model integration
- **Development**: `http://localhost:11434`
- **Production**: `https://swift-ai-assist.e8demo.com/ollama`

## Deployment Configuration

### Vercel Environment Variables

When deploying to Vercel, set these environment variables in your Vercel dashboard:

```bash
PUBLIC_API_BASE_URL=https://swift-ai-assist.e8demo.com
PUBLIC_CUSTOM_API_BASE_URL=https://swift-ai-assist.e8demo.com
PUBLIC_FRONTEND_ONLY=true
OLLAMA_BASE_URL=https://swift-ai-assist.e8demo.com/ollama
NODE_ENV=production
VITE_BUILD_TARGET=vercel
```

### Setting Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values for Production, Preview, and Development environments

## Development Setup

1. Copy `.env.example` to `.env`
2. Update the URLs to match your local backend setup
3. Set `PUBLIC_FRONTEND_ONLY=true` if you only want the chatbot builder
4. Set `PUBLIC_FRONTEND_ONLY=false` if you have the full Swift backend running

## Production Setup

1. Use `.env.production` as reference
2. Set environment variables in your deployment platform
3. Ensure all URLs use HTTPS in production
4. Set `NODE_ENV=production` for optimized builds

## Troubleshooting

### Common Issues

1. **API calls failing**: Check that `PUBLIC_API_BASE_URL` is correct
2. **CORS errors**: Ensure your backend allows requests from your frontend domain
3. **Build failures**: Verify all required environment variables are set

### Testing Environment Variables

You can test your environment configuration by checking the browser console:

```javascript
console.log('API Base URL:', import.meta.env.PUBLIC_API_BASE_URL);
console.log('Frontend Only:', import.meta.env.PUBLIC_FRONTEND_ONLY);
```
