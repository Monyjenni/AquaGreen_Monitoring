# AquaGreen Monitoring System Architecture

This document provides a comprehensive technical overview of the AquaGreen Monitoring system architecture, including frontend, backend, security implementations, and API workflows.

## System Overview

AquaGreen Monitoring is a full-stack application built using the following technology stack:

- **Frontend**: Vue.js 3 with Vuex and Vue Router
- **Backend**: Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Message Queue**: Apache Kafka
- **Security**: JWT authentication, TLS/SSL with Let's Encrypt

## System Architecture Diagram

```
+------------------+     +-------------------+     +----------------+
|    Frontend      |     |     Backend       |     |   Database     |
|  (Vue.js + Vuex) |<--->| (Django REST API) |<--->|  (PostgreSQL)  |
+------------------+     +-------------------+     +----------------+
                                  ^
                                  |
                                  v
                         +-------------------+
                         |     Kafka         |
                         | (Data Streaming)  |
                         +-------------------+
                                  ^
                                  |
                                  v
                         +-------------------+
                         |    ZooKeeper      |
                         | (Coordination)    |
                         +-------------------+
```

## Component Details

### Frontend Architecture

The frontend is a Single Page Application (SPA) built with Vue.js 3, using the following key components:

1. **Vuex Store**: Centralized state management with the following modules:
   - `auth`: Handles user authentication and session management
   - `files`: Manages uploaded Excel files and their processing status
   - `crop`: Manages crop images and their metadata
   - `csv`: Handles CSV mapping files

2. **Vue Router**: Manages application routing with nested routes and navigation guards for authentication

3. **Component Structure**:
   - `views/`: Page-level components (Home, Upload, Files, etc.)
   - `components/`: Reusable UI components
   - `components/common/`: Generic UI elements (BaseCard, BaseButton, etc.)

### Backend Architecture

The backend is built with Django REST Framework and follows a RESTful API design:

1. **Django Apps**:
   - `file_uploader`: Handles file uploads, processing, and management
   - `kafka_producer`: Manages Kafka integration for real-time data streaming

2. **Authentication**: JWT (JSON Web Tokens) via `rest_framework_simplejwt`

3. **API Endpoints**:
   - `/api/auth/`: Authentication endpoints (login, refresh, register)
   - `/api/excel-files/`: Excel file management
   - `/api/crop-images/`: Crop image management
   - `/api/csv-files/`: CSV file management

4. **Media Handling**: Django's built-in media handling for uploaded files

## Database Schema (ERD)

The application's database schema includes the following key models:

### User Model
- Django's built-in User model with standard fields

### ExcelFile Model
- `title`: CharField - Title of the Excel file
- `file`: FileField - The uploaded Excel file
- `uploaded_by`: ForeignKey to User - User who uploaded the file
- `uploaded_at`: DateTimeField - When the file was uploaded
- `processed`: BooleanField - Whether the file has been processed

### CropImage Model
- `sample_id`: CharField - Unique identifier for the crop sample
- `image`: ImageField - The uploaded crop image
- `description`: TextField - Optional description of the image
- `uploaded_by`: ForeignKey to User - User who uploaded the image
- `uploaded_at`: DateTimeField - When the image was uploaded

### ImageMetadata Model
- `image`: ForeignKey to CropImage - Associated crop image
- `label`: CharField - Metadata label
- `value`: CharField - Metadata value

### CsvFile Model
- `name`: CharField - Name of the CSV file
- `file`: FileField - The uploaded CSV file
- `uploaded_by`: ForeignKey to User - User who uploaded the file
- `uploaded_at`: DateTimeField - When the file was uploaded
- `processed`: BooleanField - Whether the file has been processed

## API Flow According to ERD

### Authentication Flow

1. **User Registration**:
   - Client sends POST to `/api/auth/register/` with username, email, password
   - Server creates user and returns success/error

2. **User Login**:
   - Client sends POST to `/api/auth/login/` with username, password
   - Server validates credentials and returns JWT tokens (access + refresh)
   - Client stores tokens for subsequent requests

3. **Token Refresh**:
   - Client sends POST to `/api/auth/refresh/` with refresh token
   - Server validates refresh token and returns new access token

### Excel File Management Flow

1. **Upload Excel File**:
   - Client sends POST to `/api/excel-files/` with file data (multipart/form-data)
   - Server saves file, associates with user, returns file metadata

2. **Process Excel File**:
   - Client sends POST to `/api/excel-files/{id}/process/`
   - Server processes file, publishes data to Kafka, updates processed flag

3. **List Excel Files**:
   - Client sends GET to `/api/excel-files/`
   - Server returns list of files uploaded by the user

### Crop Image Management Flow

1. **Upload Crop Image**:
   - Client sends POST to `/api/crop-images/` with image and metadata
   - Server saves image, creates metadata records, returns image data

2. **Add Metadata to Image**:
   - Client sends POST to `/api/crop-images/{id}/add_metadata/` with metadata items
   - Server adds metadata to image, returns updated metadata list

3. **View Crop Image Details**:
   - Client sends GET to `/api/crop-images/{id}/`
   - Server returns image details including associated metadata

### CSV File Management Flow

1. **Upload CSV File**:
   - Client sends POST to `/api/csv-files/` with CSV file
   - Server saves file, associates with user, returns file metadata

2. **Preview CSV File**:
   - Client sends GET to `/api/csv-files/{id}/preview/`
   - Server reads first few rows of CSV, returns as JSON

## Kafka Integration

Kafka is used for real-time data streaming and processing:

1. **Producer Configuration**:
   - Django backend produces messages to Kafka topics when files are processed
   - Messages include structured data extracted from Excel/CSV files

2. **Consumer Application**:
   - Separate Kafka consumer processes can subscribe to topics
   - Consumers process data for analytics, notifications, or other use cases

3. **ZooKeeper Integration**:
   - ZooKeeper provides coordination and synchronization for Kafka
   - Manages broker metadata, topic configuration, and consumer offsets

## Security Implementation

### Authentication Security

1. **JWT Authentication**:
   - Short-lived access tokens (1 day)
   - Longer-lived refresh tokens (7 days)
   - Token rotation with blacklisting after refresh

2. **Password Security**:
   - Django's built-in password hashing (PBKDF2 with SHA256)
   - Password validation rules (minimum length, complexity)

### TLS/SSL Security

1. **Let's Encrypt Integration**:
   - Automatic certificate issuance and renewal
   - HTTPS enforcement in production

2. **HTTPS Configuration**:
   - TLS 1.2+ only
   - Secure cipher suites
   - HTTP Strict Transport Security (HSTS)

3. **Django Security Settings**:
   - Secure cookies (httponly, secure)
   - CSRF protection
   - Content security policy
   - XSS protection

## Development and Deployment Workflow

### Development Environment

1. **Local Development**:
   - Django development server
   - Vue CLI development server
   - SQLite database
   - Local Kafka/ZooKeeper or disabled Kafka

### Production Deployment

1. **Containerized Deployment**:
   - Docker Compose for multi-container orchestration
   - PostgreSQL for production database
   - Nginx as reverse proxy and static file server
   - Let's Encrypt for SSL certificates

2. **Environment Configuration**:
   - Environment variables for sensitive configuration
   - Different settings for development/production

## Troubleshooting and Monitoring

1. **Logging**:
   - Django logging for backend events
   - Vue error tracking
   - Kafka producer/consumer logs

2. **Common Issues**:
   - Kafka connectivity issues
   - File upload size limits
   - Authentication token expiration

## Conclusion

The AquaGreen Monitoring system is designed as a modular, scalable application with robust security measures and real-time data processing capabilities. The architecture follows modern web development best practices and provides a solid foundation for future enhancements.
