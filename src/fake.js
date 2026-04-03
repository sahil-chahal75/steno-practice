import React from 'react';

// Ye sirf ek temporary testing file hai
const App = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#2563eb' }}>StenoPulse Debug Mode</h1>
      <p>System is online. This is a temporary test file.</p>
      <button 
        onClick={() => alert('Logic is working!')}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#10b981',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Test Connection
      </button>
    </div>
  );
};

export default App;
