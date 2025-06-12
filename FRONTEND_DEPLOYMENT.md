# 🌿 AquaGreen Frontend Deployment Guide

## 📋 Overview

This repository contains the Vue.js frontend for the AquaGreen Agricultural Platform. This guide will help you deploy the frontend along with the backend.

## 🏗️ Repository Structure

```
Monyjenni/AquaGreen_Monitoring (Frontend)
├── frontend/              # Vue.js application
├── templates/            # Django templates (if any)
├── docker-compose.yml    # Local development setup
├── Dockerfile           # Frontend container build
└── FRONTEND_DEPLOYMENT.md # This guide
```

## 🚀 Complete Platform Deployment

### Prerequisites

The AquaGreen platform consists of two repositories:
- **Frontend**: `https://github.com/Monyjenni/AquaGreen_Monitoring`
- **Backend**: `https://github.com/AquagreenRUPP/backend`

### Method 1: Deploy from Backend Repository (Recommended)

The backend repository contains a complete docker-compose setup that includes both frontend and backend.

```bash
# On your VM:
git clone https://github.com/AquagreenRUPP/backend.git
cd backend
git checkout deployment

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Deploy entire platform
chmod +x deploy.sh
./deploy.sh production
```

This will automatically:
✅ Clone the frontend repository  
✅ Build the Vue.js application  
✅ Set up Nginx reverse proxy  
✅ Connect frontend to backend API  
✅ Configure database and encryption  

### Method 2: Development Setup (Frontend Only)

For frontend development with existing backend:

```bash
# Clone frontend repository
git clone https://github.com/Monyjenni/AquaGreen_Monitoring.git
cd AquaGreen_Monitoring

# Install dependencies
cd frontend
npm install

# Configure API endpoint
# Edit src/config/api.js or .env.local
echo "VUE_APP_API_URL=http://your-backend-url:8000" > .env.local

# Start development server
npm run serve
```

## 🔧 Frontend Configuration

### Environment Variables

Create `.env.local` in the frontend directory:

```bash
VUE_APP_API_URL=http://your-backend-url:8000
VUE_APP_API_TIMEOUT=10000
VUE_APP_UPLOAD_SIZE_LIMIT=50MB
```

### Build Configuration

The frontend includes:
- **Vue 3**: Modern reactive framework
- **Vue Router**: SPA routing
- **Vuex**: State management
- **Axios**: API communication
- **Bootstrap**: UI framework
- **Chart.js**: Data visualization
- **XLSX**: Excel file handling

## 🐳 Docker Configuration

### Dockerfile Features:
- **Multi-stage build**: Optimized production build
- **Nginx serving**: High-performance static file serving
- **Security headers**: Production security configuration
- **Health checks**: Container monitoring

### Build Frontend Container:
```bash
docker build -t agri-frontend ./frontend
docker run -p 8080:80 agri-frontend
```

## 🔗 API Integration

The frontend communicates with the Django backend through:

### API Endpoints:
- **Authentication**: `/api/auth/`
- **File Upload**: `/api/file-uploader/`
- **Data Processing**: `/api/processed-data/`
- **Dashboard**: `/api/dashboard/`
- **Admin**: `/admin/`

### Request Flow:
```
Vue.js Frontend → Nginx → Django Backend → PostgreSQL
```

## 🛠️ Development Workflow

### Local Development:
```bash
# Frontend development
cd frontend
npm run serve  # Runs on http://localhost:8080

# Backend API (separate terminal)
cd ../backend
python manage.py runserver  # Runs on http://localhost:8000
```

### Production Build:
```bash
cd frontend
npm run build  # Creates dist/ folder
```

## 🔐 Security Features

### Frontend Security:
✅ **XSS Protection**: Input sanitization  
✅ **CSRF Tokens**: Request validation  
✅ **JWT Handling**: Secure token storage  
✅ **File Validation**: Upload restrictions  
✅ **SSL Ready**: HTTPS configuration  

## 📊 Features Overview

### User Interface:
- **Dashboard**: Data visualization and analytics
- **File Upload**: Excel, CSV, and image uploads
- **Data Processing**: Real-time data transformation
- **User Management**: Registration and authentication
- **Responsive Design**: Mobile and desktop friendly

### Data Handling:
- **Encrypted Uploads**: Files encrypted before storage
- **Progress Tracking**: Upload and processing progress
- **Error Handling**: User-friendly error messages
- **Data Validation**: Input verification

## 🚨 Troubleshooting

### Common Frontend Issues:

#### 1. API Connection Failed
```bash
# Check backend URL in environment
cat frontend/.env.local

# Verify backend is running
curl http://your-backend-url:8000/api/
```

#### 2. Build Failures
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. CORS Issues
```bash
# Ensure CORS is configured in Django backend
# Check backend/data_processor/settings.py:
# CORS_ALLOW_ALL_ORIGINS = True
```

## 📈 Performance Optimization

### Frontend Optimizations:
- **Code Splitting**: Lazy loading of routes
- **Asset Compression**: Gzip and brotli
- **Caching**: Browser and CDN caching
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Compressed assets

## 🔄 Updates and Maintenance

### Update Frontend:
```bash
git pull origin main
cd frontend
npm install  # Update dependencies
npm run build  # Rebuild
docker-compose restart frontend  # If using Docker
```

## 📞 Support

For frontend-specific issues:
1. Check browser console for errors
2. Verify API connectivity
3. Check network requests in DevTools
4. Review frontend logs: `docker-compose logs frontend`

---

## 🎯 Quick Start Summary

**For Complete Platform Deployment:**
```bash
git clone https://github.com/AquagreenRUPP/backend.git
cd backend && git checkout deployment
cp .env.example .env && nano .env
chmod +x deploy.sh && ./deploy.sh production
```

**For Frontend Development:**
```bash
git clone https://github.com/Monyjenni/AquaGreen_Monitoring.git
cd AquaGreen_Monitoring/frontend
npm install && npm run serve
```

**🌱 Happy Coding with AquaGreen! 🚀** 