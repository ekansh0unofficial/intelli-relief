# IntelliRelief - Quick Setup Guide

## 🚀 FASTEST WAY TO RUN

### Option 1: Using Python (Recommended - One Command!)

```bash
python3 server.py
```

That's it! The server will start and automatically open your browser.

---

## 📋 Detailed Setup Instructions

### Requirements
- Python 3.x (usually pre-installed on Mac/Linux)
- OR any modern web browser

### Step-by-Step Setup

#### Windows:
1. Extract all files to a folder
2. Open Command Prompt in that folder
3. Run: `python server.py`
4. Browser will open automatically to http://localhost:8000

#### Mac/Linux:
1. Extract all files to a folder
2. Open Terminal in that folder
3. Run: `python3 server.py`
4. Browser will open automatically to http://localhost:8000

#### Alternative (No Python):
1. Open `index.html` directly in your browser
2. Note: Map features work best with a local server

---

## 🔐 Login Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | admin | admin123 | Full system access |
| **Operator** | operator | op123 | Create/manage alerts |
| **Responder** | responder | resp123 | View & update assigned alerts |
| **Volunteer** | volunteer | vol123 | View alerts & shelters |
| **NGO** | ngo | ngo123 | View relief information |

---

## 📱 What You'll See

### Admin Dashboard
- System overview with statistics
- Active alerts management
- Responder assignment
- Shelter management
- User management
- Full GIS map with all incidents

### Operator Dashboard
- Create new emergency alerts
- Update existing alerts
- View all active incidents
- Coordinate with responders

### Responder Dashboard
- View assigned alerts
- Update incident status
- Post field updates
- Mark incidents as resolved

---

## 🗺️ Using the System

### Creating an Alert (Operator/Admin)
1. Click "New Alert" button
2. Fill in:
   - Description of emergency
   - Location name
   - Coordinates (or use sample: 28.6139, 77.2090 for Delhi)
   - Severity (High/Medium/Low)
   - Caller information
3. Click "Save Alert"

### Assigning Responders (Admin/Operator)
1. Go to "Active Alerts" tab
2. Click "Assign" on any open alert
3. Select available responder from the list
4. Responder automatically gets the assignment

### Viewing on Map
1. Click "GIS Map" in sidebar
2. See color-coded alerts:
   - 🔴 Red = High severity
   - 🟠 Orange = Medium severity
   - 🔵 Blue = Low severity
   - 🟢 Green "S" = Shelter locations
3. Click markers for details

---

## 🎯 Key Features to Try

✅ **Real-time Dashboard**: See live statistics updating
✅ **Interactive Maps**: Click and explore alert locations
✅ **Alert Management**: Create, assign, and resolve incidents
✅ **Status Tracking**: Follow incident timeline with updates
✅ **Shelter Monitoring**: View evacuation center capacity
✅ **Responder Coordination**: Assign and track response teams

---

## 📊 Sample Data Included

The system comes pre-loaded with:
- 5 realistic emergency alerts (floods, building collapse, accidents)
- 3 shelter locations across Delhi NCR
- 5 responder units (Fire, Medical, Police, Hazmat, Rescue)
- 5 user accounts for each role

---

## 🔧 Troubleshooting

**Map not loading?**
- Ensure you're using the Python server (not opening HTML directly)
- Check internet connection (maps use OpenStreetMap tiles)

**Port 8000 already in use?**
- Edit `server.py` and change `PORT = 8000` to another number (e.g., 8001)

**Browser not opening automatically?**
- Manually navigate to http://localhost:8000

---

## 📁 Project Files

- `index.html` - Main application structure
- `styles.css` - Design and styling
- `app.js` - Application logic
- `server.py` - Development server
- `README.md` - Full documentation

---

## 🎨 Design Features

- Dark theme optimized for emergency operations
- Monospace typography for data clarity
- Color-coded severity indicators
- Responsive layout for different screens
- Smooth animations and transitions

---

## 💡 Tips for Testing

1. **Login as Admin first** to see full system capabilities
2. **Create a new alert** to see the workflow
3. **Assign a responder** to understand coordination
4. **Switch to Responder role** to see their view
5. **Explore the map view** to visualize all data

---

## 🚀 Next Steps

For production deployment:
- Connect to real backend API
- Integrate actual weather services (OpenWeatherMap)
- Add SMS/email notifications
- Implement proper authentication
- Set up database (PostgreSQL/MongoDB)
- Deploy to cloud (AWS/Azure/Railway)

---

## 📞 Support

Refer to the full `README.md` for:
- Detailed feature descriptions
- API integration examples
- Customization guides
- Security considerations

---

**Happy Testing! 🚨**

The IntelliRelief system is ready to demonstrate comprehensive disaster management capabilities.
