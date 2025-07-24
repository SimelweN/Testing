import React from "react";

const Developer = () => {
  console.log('Developer component rendering...');
  
  return (
    <div style={{ padding: '20px', background: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        Developer Dashboard - Minimal Test
      </h1>
      <p style={{ color: 'black', fontSize: '16px' }}>
        This is a minimal test component to ensure basic rendering works.
      </p>
      <div style={{ 
        background: '#e8f5e8', 
        border: '1px solid #4caf50', 
        padding: '10px', 
        borderRadius: '4px',
        marginTop: '20px' 
      }}>
        ✅ Component is rendering successfully!
      </div>
    </div>
  );
};

export default Developer;
