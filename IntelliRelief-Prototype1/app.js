// IntelliRelief Application
class IntelliReliefApp {
    constructor() {
        this.currentUser = null;
        this.alerts = [];
        this.shelters = [];
        this.responders = [];
        this.users = [];
        this.map = null;
        this.miniMap = null;
        this.markers = [];
        
        this.init();
    }
    
    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.showScreen('loginScreen');
    }
    
    loadSampleData() {
        // Sample Alerts
        this.alerts = [
            {
                id: 1,
                description: 'Severe flooding reported in residential area. Multiple families trapped on rooftops. Water level rising rapidly.',
                location: 'Sector 15, Dwarka',
                lat: 28.5921,
                lng: 77.0460,
                severity: 'high',
                status: 'open',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                operator_id: 2,
                caller_info: 'Rahul Sharma - 9876543210',
                updates: [
                    {
                        message: 'Alert created from emergency call',
                        author: 'Operator Kumar',
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    }
                ]
            },
            {
                id: 2,
                description: 'Building collapse due to structural failure. Approximately 10-15 people believed to be trapped inside.',
                location: 'Noida Sector 62',
                lat: 28.6270,
                lng: 77.3740,
                severity: 'high',
                status: 'assigned',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                operator_id: 2,
                caller_info: 'Anonymous',
                responder_id: 1,
                updates: [
                    {
                        message: 'Alert received from local authority',
                        author: 'Operator Kumar',
                        timestamp: new Date(Date.now() - 7200000).toISOString()
                    },
                    {
                        message: 'Fire and rescue team dispatched',
                        author: 'Admin Singh',
                        timestamp: new Date(Date.now() - 6000000).toISOString()
                    }
                ]
            },
            {
                id: 3,
                description: 'Road accident involving multiple vehicles. Medical assistance required urgently.',
                location: 'NH-8, Gurgaon',
                lat: 28.4595,
                lng: 77.0266,
                severity: 'medium',
                status: 'in-progress',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                operator_id: 2,
                caller_info: 'Highway Patrol',
                responder_id: 2,
                updates: [
                    {
                        message: 'Multiple vehicle collision reported',
                        author: 'Operator Kumar',
                        timestamp: new Date(Date.now() - 1800000).toISOString()
                    },
                    {
                        message: 'Ambulance en route to location',
                        author: 'Responder Mehta',
                        timestamp: new Date(Date.now() - 1200000).toISOString()
                    },
                    {
                        message: 'On scene, treating casualties',
                        author: 'Responder Mehta',
                        timestamp: new Date(Date.now() - 600000).toISOString()
                    }
                ]
            },
            {
                id: 4,
                description: 'Power outage affecting entire neighborhood. Transformer explosion reported.',
                location: 'Mayur Vihar Phase 2',
                lat: 28.6080,
                lng: 77.3010,
                severity: 'low',
                status: 'open',
                timestamp: new Date(Date.now() - 900000).toISOString(),
                operator_id: 2,
                caller_info: 'Resident Association',
                updates: []
            },
            {
                id: 5,
                description: 'Gas leak detected in apartment complex. Residents evacuating.',
                location: 'Vasant Kunj',
                lat: 28.5244,
                lng: 77.1580,
                severity: 'high',
                status: 'assigned',
                timestamp: new Date(Date.now() - 2700000).toISOString(),
                operator_id: 2,
                caller_info: 'Security Guard - 9123456789',
                responder_id: 3,
                updates: [
                    {
                        message: 'Gas leak reported, fire department alerted',
                        author: 'Operator Kumar',
                        timestamp: new Date(Date.now() - 2700000).toISOString()
                    }
                ]
            }
        ];
        
        // Sample Shelters
        this.shelters = [
            {
                id: 1,
                name: 'Central Relief Center',
                location: 'Connaught Place',
                lat: 28.6315,
                lng: 77.2167,
                capacity: 500,
                occupancy: 234
            },
            {
                id: 2,
                name: 'School Evacuation Point',
                location: 'Rohini Sector 10',
                lat: 28.7428,
                lng: 77.0690,
                capacity: 300,
                occupancy: 87
            },
            {
                id: 3,
                name: 'Community Hall Shelter',
                location: 'Saket',
                lat: 28.5245,
                lng: 77.2066,
                capacity: 200,
                occupancy: 156
            }
        ];
        
        // Sample Responders
        this.responders = [
            {
                id: 1,
                name: 'Fire Team Alpha',
                type: 'Fire',
                status: 'busy',
                assigned_alert: 2
            },
            {
                id: 2,
                name: 'Medical Unit 5',
                type: 'Medical',
                status: 'busy',
                assigned_alert: 3
            },
            {
                id: 3,
                name: 'Hazmat Team 1',
                type: 'Hazmat',
                status: 'busy',
                assigned_alert: 5
            },
            {
                id: 4,
                name: 'Police Unit 12',
                type: 'Police',
                status: 'available',
                assigned_alert: null
            },
            {
                id: 5,
                name: 'Rescue Team Beta',
                type: 'Rescue',
                status: 'available',
                assigned_alert: null
            }
        ];
        
        // Sample Users
        this.users = [
            { id: 1, name: 'Admin Singh', role: 'admin', email: 'admin@intellirelief.in', contact: '9999999999' },
            { id: 2, name: 'Operator Kumar', role: 'operator', email: 'operator@intellirelief.in', contact: '9999999998' },
            { id: 3, name: 'Responder Mehta', role: 'responder', email: 'responder@intellirelief.in', contact: '9999999997' },
            { id: 4, name: 'Volunteer Priya', role: 'volunteer', email: 'volunteer@intellirelief.in', contact: '9999999996' },
            { id: 5, name: 'NGO Raj', role: 'ngo', email: 'ngo@intellirelief.in', contact: '9999999995' }
        ];
    }
    
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        
        // New Alert button
        const newAlertBtn = document.getElementById('newAlertBtn');
        if (newAlertBtn) {
            newAlertBtn.addEventListener('click', () => {
                this.openNewAlertModal();
            });
        }
        
        // Alert form
        document.getElementById('alertForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAlert();
        });
        
        // Modal close buttons
        document.getElementById('closeAlertModal').addEventListener('click', () => {
            this.closeModal('alertModal');
        });
        
        document.getElementById('closeEditAlertModal').addEventListener('click', () => {
            this.closeModal('editAlertModal');
        });
        
        document.getElementById('cancelAlertBtn').addEventListener('click', () => {
            this.closeModal('editAlertModal');
        });
        
        // Shelter modal
        const newShelterBtn = document.getElementById('newShelterBtn');
        if (newShelterBtn) {
            newShelterBtn.addEventListener('click', () => {
                this.openNewShelterModal();
            });
        }
        
        document.getElementById('shelterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveShelter();
        });
        
        document.getElementById('closeShelterModal').addEventListener('click', () => {
            this.closeModal('shelterModal');
        });
        
        document.getElementById('cancelShelterBtn').addEventListener('click', () => {
            this.closeModal('shelterModal');
        });
        
        // Filters
        document.getElementById('filterSeverity').addEventListener('change', () => {
            this.renderAlertsList();
        });
        
        document.getElementById('filterStatus').addEventListener('change', () => {
            this.renderAlertsList();
        });
        
        // Refresh
        document.getElementById('refreshDataBtn').addEventListener('click', () => {
            this.refreshData();
        });
    }
    
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        // Simple authentication (in production, this would be server-side)
        const validCredentials = {
            'admin': 'admin123',
            'operator': 'op123',
            'responder': 'resp123',
            'volunteer': 'vol123',
            'ngo': 'ngo123'
        };
        
        if (validCredentials[role] === password) {
            this.currentUser = {
                username: username,
                role: role,
                name: this.users.find(u => u.role === role)?.name || username
            };
            
            this.showDashboard();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    }
    
    handleLogout() {
        this.currentUser = null;
        document.getElementById('loginForm').reset();
        this.showScreen('loginScreen');
        
        // Clean up maps
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if (this.miniMap) {
            this.miniMap.remove();
            this.miniMap = null;
        }
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    showDashboard() {
        document.body.className = `role-${this.currentUser.role}`;
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userRole').textContent = this.currentUser.role.toUpperCase();
        
        this.showScreen('dashboardScreen');
        this.switchView('overview');
        this.loadWeather();
        this.updateStats();
    }
    
    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        const viewElement = document.getElementById(`${viewName}View`);
        if (viewElement) {
            viewElement.classList.add('active');
        }
        
        // Load view-specific content
        switch(viewName) {
            case 'overview':
                this.renderOverview();
                break;
            case 'alerts':
                this.renderAlertsList();
                break;
            case 'map':
                this.renderMap();
                break;
            case 'shelters':
                this.renderSheltersList();
                break;
            case 'responders':
                this.renderRespondersList();
                break;
            case 'users':
                this.renderUsersList();
                break;
        }
    }
    
    async loadWeather() {
        const widget = document.getElementById('weatherWidget');
        
        try {
            // Using OpenWeatherMap API (requires API key in production)
            // For demo, showing sample data
            const weatherData = {
                temp: 28,
                humidity: 65,
                wind: 12,
                condition: 'Partly Cloudy'
            };
            
            widget.innerHTML = `
                <div class="weather-info">
                    <div class="weather-item">
                        <strong>${weatherData.temp}°C</strong>
                        <span>${weatherData.condition}</span>
                    </div>
                    <div class="weather-item">
                        <span>💧 ${weatherData.humidity}%</span>
                    </div>
                    <div class="weather-item">
                        <span>💨 ${weatherData.wind} km/h</span>
                    </div>
                </div>
            `;
        } catch (error) {
            widget.innerHTML = '<div class="weather-loading">Weather unavailable</div>';
        }
    }
    
    updateStats() {
        const activeAlerts = this.alerts.filter(a => a.status !== 'resolved').length;
        const inProgress = this.alerts.filter(a => a.status === 'in-progress').length;
        const resolvedToday = this.alerts.filter(a => {
            const today = new Date().toDateString();
            return a.status === 'resolved' && new Date(a.timestamp).toDateString() === today;
        }).length;
        const activeResponders = this.responders.filter(r => r.status === 'busy').length;
        
        document.getElementById('statActiveAlerts').textContent = activeAlerts;
        document.getElementById('statInProgress').textContent = inProgress;
        document.getElementById('statResolved').textContent = resolvedToday;
        document.getElementById('statResponders').textContent = activeResponders;
        document.getElementById('alertCount').textContent = activeAlerts;
    }
    
    renderOverview() {
        // Render recent alerts
        const recentAlerts = this.alerts.slice(0, 5);
        const alertsList = document.getElementById('recentAlertsList');
        
        if (recentAlerts.length === 0) {
            alertsList.innerHTML = '<div class="empty-state">No recent alerts</div>';
        } else {
            alertsList.innerHTML = recentAlerts.map(alert => `
                <div class="alert-item severity-${alert.severity}" onclick="app.viewAlertDetails(${alert.id})">
                    <div class="alert-header">
                        <span class="alert-location">${alert.location}</span>
                        <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
                    </div>
                    <div class="alert-description">${alert.description}</div>
                    <div class="alert-footer">
                        <span class="severity-badge ${alert.severity}">${alert.severity}</span>
                        <span class="status-badge">${alert.status}</span>
                    </div>
                </div>
            `).join('');
        }
        
        // Initialize mini map
        setTimeout(() => this.initMiniMap(), 100);
    }
    
    initMiniMap() {
        const container = document.getElementById('miniMap');
        if (!container || this.miniMap) return;
        
        this.miniMap = L.map('miniMap').setView([28.6139, 77.2090], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.miniMap);
        
        // Add alert markers
        this.alerts.forEach(alert => {
            const color = this.getSeverityColor(alert.severity);
            L.circleMarker([alert.lat, alert.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.miniMap)
              .bindPopup(`<strong>${alert.location}</strong><br>${alert.severity}`);
        });
    }
    
    renderAlertsList() {
        const container = document.getElementById('alertsListContainer');
        const severityFilter = document.getElementById('filterSeverity').value;
        const statusFilter = document.getElementById('filterStatus').value;
        
        let filteredAlerts = this.alerts;
        
        if (severityFilter) {
            filteredAlerts = filteredAlerts.filter(a => a.severity === severityFilter);
        }
        if (statusFilter) {
            filteredAlerts = filteredAlerts.filter(a => a.status === statusFilter);
        }
        
        if (filteredAlerts.length === 0) {
            container.innerHTML = '<div class="empty-state">No alerts found</div>';
            return;
        }
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Location</th>
                        <th>Description</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredAlerts.map(alert => `
                        <tr onclick="app.viewAlertDetails(${alert.id})">
                            <td><strong>${alert.location}</strong></td>
                            <td>${alert.description.substring(0, 60)}...</td>
                            <td><span class="severity-badge ${alert.severity}">${alert.severity}</span></td>
                            <td><span class="status-badge">${alert.status}</span></td>
                            <td>${this.formatTime(alert.timestamp)}</td>
                            <td onclick="event.stopPropagation()">
                                <div class="table-actions">
                                    ${alert.status === 'open' && (this.currentUser.role === 'admin' || this.currentUser.role === 'operator') ? 
                                        `<button class="btn-small btn-assign" onclick="app.assignAlert(${alert.id})">Assign</button>` : ''}
                                    ${alert.status !== 'resolved' ? 
                                        `<button class="btn-small btn-update" onclick="app.updateAlertStatus(${alert.id})">Update</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    renderMap() {
        setTimeout(() => {
            if (!this.map) {
                this.map = L.map('mainMap').setView([28.6139, 77.2090], 11);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.map);
            }
            
            // Clear existing markers
            this.markers.forEach(marker => marker.remove());
            this.markers = [];
            
            // Add alert markers
            this.alerts.forEach(alert => {
                const color = this.getSeverityColor(alert.severity);
                const marker = L.circleMarker([alert.lat, alert.lng], {
                    radius: 10,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(this.map);
                
                marker.bindPopup(`
                    <strong>${alert.location}</strong><br>
                    <span class="severity-badge ${alert.severity}">${alert.severity}</span>
                    <span class="status-badge">${alert.status}</span><br>
                    ${alert.description.substring(0, 80)}...<br>
                    <button onclick="app.viewAlertDetails(${alert.id})" style="margin-top: 8px; padding: 4px 8px; background: var(--color-urgent); color: white; border: none; border-radius: 3px; cursor: pointer;">View Details</button>
                `);
                
                this.markers.push(marker);
            });
            
            // Add shelter markers
            this.shelters.forEach(shelter => {
                const marker = L.marker([shelter.lat, shelter.lng], {
                    icon: L.divIcon({
                        className: 'shelter-marker',
                        html: `<div style="background: var(--color-success); width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">S</div>`
                    })
                }).addTo(this.map);
                
                marker.bindPopup(`
                    <strong>${shelter.name}</strong><br>
                    ${shelter.location}<br>
                    Capacity: ${shelter.occupancy}/${shelter.capacity}
                `);
                
                this.markers.push(marker);
            });
            
            this.map.invalidateSize();
        }, 100);
    }
    
    renderSheltersList() {
        const container = document.getElementById('sheltersListContainer');
        
        if (this.shelters.length === 0) {
            container.innerHTML = '<div class="empty-state">No shelters registered</div>';
            return;
        }
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Capacity</th>
                        <th>Occupancy</th>
                        <th>Availability</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.shelters.map(shelter => {
                        const utilization = (shelter.occupancy / shelter.capacity * 100).toFixed(0);
                        return `
                            <tr>
                                <td><strong>${shelter.name}</strong></td>
                                <td>${shelter.location}</td>
                                <td>${shelter.capacity}</td>
                                <td>${shelter.occupancy}</td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="flex: 1; height: 8px; background: var(--color-bg-secondary); border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${utilization}%; height: 100%; background: ${utilization > 80 ? 'var(--color-urgent)' : 'var(--color-success)'}"></div>
                                        </div>
                                        <span>${utilization}%</span>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    renderRespondersList() {
        const container = document.getElementById('respondersListContainer');
        
        if (this.responders.length === 0) {
            container.innerHTML = '<div class="empty-state">No responders registered</div>';
            return;
        }
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Assigned Alert</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.responders.map(responder => `
                        <tr>
                            <td><strong>${responder.name}</strong></td>
                            <td>${responder.type}</td>
                            <td>
                                <span class="status-badge" style="background: ${responder.status === 'available' ? 'var(--color-success)' : 'var(--color-warning)'}; color: white;">
                                    ${responder.status}
                                </span>
                            </td>
                            <td>
                                ${responder.assigned_alert ? 
                                    `Alert #${responder.assigned_alert} - ${this.alerts.find(a => a.id === responder.assigned_alert)?.location || 'Unknown'}` : 
                                    'None'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    renderUsersList() {
        const container = document.getElementById('usersListContainer');
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Contact</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.users.map(user => `
                        <tr>
                            <td><strong>${user.name}</strong></td>
                            <td><span class="status-badge">${user.role}</span></td>
                            <td>${user.email}</td>
                            <td>${user.contact}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    viewAlertDetails(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return;
        
        const responder = alert.responder_id ? 
            this.responders.find(r => r.id === alert.responder_id) : null;
        
        const modalBody = document.getElementById('alertModalBody');
        modalBody.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${alert.location}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Coordinates</div>
                    <div class="detail-value">${alert.lat}, ${alert.lng}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Severity</div>
                    <div class="detail-value">
                        <span class="severity-badge ${alert.severity}">${alert.severity}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge">${alert.status}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Timestamp</div>
                    <div class="detail-value">${this.formatDateTime(alert.timestamp)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Caller Information</div>
                    <div class="detail-value">${alert.caller_info || 'Not provided'}</div>
                </div>
                ${responder ? `
                    <div class="detail-item">
                        <div class="detail-label">Assigned Responder</div>
                        <div class="detail-value">${responder.name} (${responder.type})</div>
                    </div>
                ` : ''}
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${alert.description}</div>
                </div>
            </div>
            
            ${alert.updates && alert.updates.length > 0 ? `
                <div class="timeline">
                    <h4>Timeline</h4>
                    <div class="timeline-list">
                        ${alert.updates.map(update => `
                            <div class="timeline-item">
                                <div class="timeline-header">
                                    <span class="timeline-author">${update.author}</span>
                                    <span class="timeline-time">${this.formatTime(update.timestamp)}</span>
                                </div>
                                <div class="timeline-message">${update.message}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${(this.currentUser.role === 'admin' || this.currentUser.role === 'operator' || this.currentUser.role === 'responder') && alert.status !== 'resolved' ? `
                <div class="update-form">
                    <h4>Add Update</h4>
                    <form onsubmit="app.addAlertUpdate(event, ${alert.id})">
                        <div class="form-group">
                            <textarea id="updateMessage" rows="3" placeholder="Enter update message..." required></textarea>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="submit" class="btn-primary">Post Update</button>
                            ${alert.status !== 'resolved' ? `
                                <button type="button" class="btn-resolve" onclick="app.resolveAlert(${alert.id})">Mark as Resolved</button>
                            ` : ''}
                        </div>
                    </form>
                </div>
            ` : ''}
        `;
        
        this.openModal('alertModal');
    }
    
    addAlertUpdate(event, alertId) {
        event.preventDefault();
        const message = document.getElementById('updateMessage').value;
        const alert = this.alerts.find(a => a.id === alertId);
        
        if (alert) {
            alert.updates.push({
                message: message,
                author: this.currentUser.name,
                timestamp: new Date().toISOString()
            });
            
            // Re-render the modal
            this.closeModal('alertModal');
            setTimeout(() => this.viewAlertDetails(alertId), 100);
        }
    }
    
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'resolved';
            alert.updates.push({
                message: 'Alert marked as resolved',
                author: this.currentUser.name,
                timestamp: new Date().toISOString()
            });
            
            // Update responder status if assigned
            if (alert.responder_id) {
                const responder = this.responders.find(r => r.id === alert.responder_id);
                if (responder) {
                    responder.status = 'available';
                    responder.assigned_alert = null;
                }
            }
            
            this.closeModal('alertModal');
            this.updateStats();
            this.refreshCurrentView();
        }
    }
    
    assignAlert(alertId) {
        const availableResponders = this.responders.filter(r => r.status === 'available');
        
        if (availableResponders.length === 0) {
            alert('No available responders at the moment.');
            return;
        }
        
        const responderList = availableResponders.map((r, idx) => 
            `${idx + 1}. ${r.name} (${r.type})`
        ).join('\n');
        
        const selection = prompt(`Select responder:\n\n${responderList}\n\nEnter number (1-${availableResponders.length}):`);
        
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < availableResponders.length) {
                const responder = availableResponders[index];
                const alert = this.alerts.find(a => a.id === alertId);
                
                alert.status = 'assigned';
                alert.responder_id = responder.id;
                alert.updates.push({
                    message: `Assigned to ${responder.name}`,
                    author: this.currentUser.name,
                    timestamp: new Date().toISOString()
                });
                
                responder.status = 'busy';
                responder.assigned_alert = alertId;
                
                this.refreshCurrentView();
                this.updateStats();
            }
        }
    }
    
    updateAlertStatus(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return;
        
        const statuses = ['open', 'assigned', 'in-progress', 'resolved'];
        const currentIndex = statuses.indexOf(alert.status);
        const options = statuses.map((s, idx) => 
            `${idx + 1}. ${s.toUpperCase()}${idx === currentIndex ? ' (current)' : ''}`
        ).join('\n');
        
        const selection = prompt(`Update status:\n\n${options}\n\nEnter number (1-4):`);
        
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < statuses.length) {
                const newStatus = statuses[index];
                alert.status = newStatus;
                alert.updates.push({
                    message: `Status changed to ${newStatus}`,
                    author: this.currentUser.name,
                    timestamp: new Date().toISOString()
                });
                
                if (newStatus === 'resolved' && alert.responder_id) {
                    const responder = this.responders.find(r => r.id === alert.responder_id);
                    if (responder) {
                        responder.status = 'available';
                        responder.assigned_alert = null;
                    }
                }
                
                this.refreshCurrentView();
                this.updateStats();
            }
        }
    }
    
    openNewAlertModal() {
        document.getElementById('alertForm').reset();
        document.getElementById('alertId').value = '';
        document.getElementById('editModalTitle').textContent = 'New Alert';
        // Set default coordinates (Delhi)
        document.getElementById('alertLat').value = '28.6139';
        document.getElementById('alertLng').value = '77.2090';
        this.openModal('editAlertModal');
    }
    
    saveAlert() {
        const id = document.getElementById('alertId').value;
        const description = document.getElementById('alertDescription').value;
        const location = document.getElementById('alertLocation').value;
        const severity = document.getElementById('alertSeverity').value;
        const lat = parseFloat(document.getElementById('alertLat').value);
        const lng = parseFloat(document.getElementById('alertLng').value);
        const callerInfo = document.getElementById('callerInfo').value;
        
        if (id) {
            // Edit existing alert
            const alert = this.alerts.find(a => a.id === parseInt(id));
            if (alert) {
                alert.description = description;
                alert.location = location;
                alert.severity = severity;
                alert.lat = lat;
                alert.lng = lng;
                alert.caller_info = callerInfo;
            }
        } else {
            // Create new alert
            const newAlert = {
                id: this.alerts.length > 0 ? Math.max(...this.alerts.map(a => a.id)) + 1 : 1,
                description,
                location,
                lat,
                lng,
                severity,
                status: 'open',
                timestamp: new Date().toISOString(),
                operator_id: this.currentUser.id || 1,
                caller_info: callerInfo,
                updates: [
                    {
                        message: 'Alert created',
                        author: this.currentUser.name,
                        timestamp: new Date().toISOString()
                    }
                ]
            };
            
            this.alerts.unshift(newAlert);
        }
        
        this.closeModal('editAlertModal');
        this.updateStats();
        this.refreshCurrentView();
    }
    
    openNewShelterModal() {
        document.getElementById('shelterForm').reset();
        // Set default coordinates (Delhi)
        document.getElementById('shelterLat').value = '28.6139';
        document.getElementById('shelterLng').value = '77.2090';
        this.openModal('shelterModal');
    }
    
    saveShelter() {
        const name = document.getElementById('shelterName').value;
        const location = document.getElementById('shelterLocation').value;
        const lat = parseFloat(document.getElementById('shelterLat').value);
        const lng = parseFloat(document.getElementById('shelterLng').value);
        const capacity = parseInt(document.getElementById('shelterCapacity').value);
        const occupancy = parseInt(document.getElementById('shelterOccupancy').value);
        
        const newShelter = {
            id: this.shelters.length > 0 ? Math.max(...this.shelters.map(s => s.id)) + 1 : 1,
            name,
            location,
            lat,
            lng,
            capacity,
            occupancy
        };
        
        this.shelters.push(newShelter);
        this.closeModal('shelterModal');
        this.refreshCurrentView();
    }
    
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    refreshCurrentView() {
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            const view = activeNav.dataset.view;
            this.switchView(view);
        }
    }
    
    refreshData() {
        this.updateStats();
        this.loadWeather();
        this.refreshCurrentView();
    }
    
    getSeverityColor(severity) {
        const colors = {
            'high': '#dc2626',
            'medium': '#f59e0b',
            'low': '#3b82f6'
        };
        return colors[severity] || colors.low;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }
    
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new IntelliReliefApp();
});
