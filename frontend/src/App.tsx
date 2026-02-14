import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚨 IntelliRelief</h1>
      <p>Disaster Management Platform</p>
      <p>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>Environment Ready ✓</span></p>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>🎯 System Status:</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>✅ Backend API running on <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a></li>
          <li>✅ Database initialized with sample data</li>
          <li>✅ Redis cache ready</li>
          <li>✅ Development environment configured</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h2>📋 Next Steps:</h2>
        <ol style={{ lineHeight: '2' }}>
          <li>Review Module Interface Specification</li>
          <li>Implement Core Infrastructure (EventBus, Auth)</li>
          <li>Build AlertModule (first complete module)</li>
          <li>Add tests and iterate</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
        <p><strong>Default Users:</strong></p>
        <ul>
          <li>Admin: username=<code>admin</code>, password=<code>admin123</code></li>
          <li>Operator: username=<code>operator1</code>, password=<code>admin123</code></li>
          <li>Responder: username=<code>responder1</code>, password=<code>admin123</code></li>
        </ul>
        <p style={{ color: 'red', fontSize: '12px' }}>⚠️ Change passwords in production!</p>
      </div>
    </div>
  )
}

export default App
