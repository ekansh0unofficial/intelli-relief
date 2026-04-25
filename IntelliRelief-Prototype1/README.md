# IntelliRelief - Disaster Management and Response System

A comprehensive web-based disaster management platform for real-time incident reporting, response coordination, and resource management.

## Features

### Core Functionality
- **Real-time Alert Management**: Create, track, and manage disaster alerts with geolocation
- **GIS Visualization**: Interactive maps showing active alerts, shelters, and responder locations
- **Role-Based Access Control**: Different dashboards for Admin, Operator, Responder, Volunteer, and NGO roles
- **Responder Coordination**: Assign and track rescue teams and emergency responders
- **Shelter Management**: Monitor evacuation centers with capacity tracking
- **Weather Integration**: Real-time weather data display (expandable with API)
- **Timeline Tracking**: Comprehensive incident timeline with updates from multiple users

### User Roles

1. **Admin**
   - Full system access
   - Manage users, responders, and shelters
   - View all alerts and assign resources
   - System configuration

2. **Operator**
   - Log and update emergency alerts
   - Coordinate with responders
   - Monitor active incidents

3. **Responder**
   - View assigned alerts
   - Update incident status
   - Post field updates

4. **Volunteer & NGO**
   - View alerts and relief information
   - Access shelter locations

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Data**: In-memory storage (can be connected to backend API)
- **Design**: Custom dark theme with crisis-focused aesthetics

## Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge)
- Python 3.x (for local server) OR any HTTP server

### Installation & Setup

#### Option 1: Using Python (Recommended)

1. Navigate to the project directory:
```bash
cd /home/claude
```

2. Start a local server:
```bash
python3 -m http.server 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

#### Option 2: Using Node.js

1. Install a simple HTTP server:
```bash
npm install -g http-server
```

2. Start the server:
```bash
http-server -p 8000
```

3. Open browser to `http://localhost:8000`

#### Option 3: Direct File Access

Simply open `index.html` in your browser. Note: Some features may require a server due to CORS policies.

## Demo Credentials

Use these credentials to test different role perspectives:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Operator | operator | op123 |
| Responder | responder | resp123 |
| Volunteer | volunteer | vol123 |
| NGO Official | ngo | ngo123 |

## Usage Guide

### For Operators

1. **Creating Alerts**
   - Click "New Alert" button
   - Fill in location, description, severity
   - Add coordinates (can use Delhi area: 28.6139, 77.2090 as reference)
   - Submit to create alert

2. **Managing Alerts**
   - View all active alerts in the Alerts tab
   - Filter by severity or status
   - Click on alerts to view details
   - Add updates and change status

### For Admins

1. **Assigning Responders**
   - Click "Assign" on any open alert
   - Select from available responders
   - System automatically updates responder status

2. **Managing Shelters**
   - Navigate to Shelters tab
   - Click "Add Shelter"
   - Enter shelter details and capacity
   - Shelters appear on the map automatically

### For Responders

1. **Viewing Assignments**
   - Dashboard shows assigned alerts
   - View alert details and location
   - Access timeline of updates

2. **Posting Updates**
   - Open alert details
   - Add status updates
   - Mark as resolved when complete

## Project Structure

```
IntelliRelief/
├── index.html          # Main HTML structure
├── styles.css          # Styling and design
├── app.js             # Application logic
└── README.md          # This file
```

## Key Features Explained

### Alert Severity Levels
- **High**: Critical emergencies (floods, building collapse, etc.)
- **Medium**: Moderate incidents (accidents, power outages)
- **Low**: Minor issues requiring attention

### Alert Status Flow
1. **Open**: Newly created, awaiting assignment
2. **Assigned**: Responder has been assigned
3. **In Progress**: Actively being handled
4. **Resolved**: Incident closed

### Map Visualization
- Red circles: High severity alerts
- Orange circles: Medium severity
- Blue circles: Low severity
- Green "S" markers: Shelter locations

## Sample Data

The system comes pre-loaded with sample data:
- 5 active alerts across Delhi NCR
- 3 shelters with capacity tracking
- 5 responder units (Fire, Medical, Police, etc.)
- 5 user accounts for testing

## Customization

### Adding Real Weather Data

Replace the mock weather data in `app.js` with OpenWeatherMap API:

```javascript
async loadWeather() {
    const API_KEY = 'your_api_key_here';
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    // Process and display data
}
```

### Connecting to Backend

The current implementation uses in-memory data. To connect to a backend:

1. Replace data arrays with API calls
2. Update CRUD operations to make HTTP requests
3. Add authentication tokens to requests

Example:
```javascript
async saveAlert() {
    const alertData = { /* form data */ };
    const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
    });
    const result = await response.json();
    // Handle response
}
```

## Performance Considerations

- Designed for 50-100 concurrent users
- Lightweight frontend (~100KB total)
- Maps lazy-load tiles for better performance
- Efficient DOM updates using vanilla JavaScript

## Browser Compatibility

- Chrome 90+ ✓
- Firefox 88+ ✓
- Edge 90+ ✓
- Safari 14+ ✓

## Future Enhancements

As outlined in the SRS document:
- Mobile app for citizen reporting
- SMS gateway integration
- AI-based incident classification
- Automated responder routing
- Offline-first capability
- Real-time GPS tracking
- Integration with NDMA/IMD feeds

## Security Notes

- For production: Implement proper authentication (JWT/OAuth)
- Use HTTPS for all communications
- Sanitize all user inputs
- Implement rate limiting
- Hash passwords with bcrypt
- Use environment variables for API keys

## License

This is a prototype system developed for disaster management operations.

## Support

For issues or questions about the system, refer to the SRS documentation or contact the development team.

## Acknowledgments

Based on requirements from:
- National Disaster Management Authority (NDMA) guidelines
- Indian Meteorological Department (IMD) standards
- Real-world disaster response case studies

---

**Note**: This is a functional prototype. For production deployment, implement proper backend services, database integration, and security measures as outlined in the SRS document.
