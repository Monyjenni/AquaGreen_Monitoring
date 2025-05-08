# AquaGreen Monitoring Website

AquaGreen Monitoring is a full-stack web application for greenhouse monitoring, crop image management, and data processing. It allows users to upload Excel data files, CSV mapping files, and crop images with metadata.

## Features

- User authentication and authorization
- Excel file upload and processing
- Crop image management with metadata
- CSV mapping file integration
- Data visualization and analysis
- Kafka integration for real-time data processing
- Secure communications with TLS/SSL

## Technology Stack

### Backend
- Django REST Framework
- PostgreSQL (production) / SQLite (development)
- Kafka for message streaming
- JWT authentication

### Frontend
- Vue.js 3
- Bootstrap 5
- Vuex for state management
- Vue Router

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 14+
- Docker and Docker Compose (optional, for containerized deployment)
- Kafka & Zookeeper (for real-time data processing)

### Installation

#### Clone the repository
```bash
git clone git@github.com:AquagreenRUPP/frontend.git
cd AquaGreen_Monitoring
```

#### Backend Setup

1. Set up a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a .env file in the backend directory with the following variables:
```
SECRET_KEY=your_secret_key
DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
KAFKA_ENABLED=True
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=excel_data
```

4. Run migrations:
```bash
cd backend
python manage.py migrate
```

5. Create a superuser (for admin access):
```bash
python manage.py createsuperuser
```

6. Start the Django server:
```bash
python manage.py runserver
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run serve
```

### Running with Docker

The application can be run using Docker Compose:

```bash
docker-compose up -d
```

This will start the following services:
- PostgreSQL database
- Zookeeper
- Kafka
- Kafka UI (accessible at http://localhost:8080)
- Django backend (accessible at http://localhost:8000)
- Vue.js frontend (accessible at http://localhost:8081)

## Security

### TLS/SSL Configuration

For production deployment, the application is configured to use Let's Encrypt for SSL certificates. To enable HTTPS:

1. Obtain SSL certificates from Let's Encrypt:
```bash
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

2. Configure Nginx to use the SSL certificates (if using Nginx as a reverse proxy):
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Other SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    
    # Proxy to backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Serve frontend
    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

3. In production mode, Django will enforce HTTPS connections, secure cookies, and HSTS headers.

## File Structure

```
AquaGreen_Monitoring/
├── backend/
│   ├── data_processor/        # Django project settings
│   ├── file_uploader/         # File upload and processing app
│   ├── kafka_producer/        # Kafka integration
│   ├── media/                 # Uploaded files
│   ├── static/                # Static files
│   ├── templates/             # HTML templates
│   ├── manage.py              # Django management script
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/           # Images and styles
│   │   ├── components/        # Vue components
│   │   ├── router/            # Vue Router configuration
│   │   ├── store/             # Vuex store
│   │   ├── views/             # Vue page components
│   │   ├── App.vue            # Main app component
│   │   └── main.js            # App entry point
│   ├── package.json           # NPM dependencies
│   └── vue.config.js          # Vue CLI configuration
├── docker-compose.yml         # Docker Compose configuration
└── README.md                  # This file
```

## Development

### Making Changes

1. **Backend**: Follow Django best practices and ensure migrations are created when models change.

2. **Frontend**: Components should be reusable and follow the Vue.js style guide.

### Adding New Features

1. Create a new branch for your feature.
2. Implement the feature with appropriate tests.
3. Submit a pull request for review.

## Troubleshooting

### Kafka Connection Issues

If you encounter issues connecting to Kafka:

1. Ensure Zookeeper is running before starting Kafka.
2. Check that the bootstrap servers are correctly configured in the .env file.
3. Verify that the Kafka topic exists (it will be created automatically if `auto.create.topics.enable` is set to true).

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

For any questions or support, please contact the development team.
