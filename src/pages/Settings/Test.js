// Test.js
import React, { useState } from 'react';
import './Test.css';

const Test = ({ ipAddress }) => {
  const [formData, setFormData] = useState({
    lift_height: '',
    
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (field) => {
    const value = formData[field];
    
    fetch(`http://${ipAddress}/e${field}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [field]: value }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(`Response for http://${ipAddress}/${field}: ${JSON.stringify(data)}`);
      })
      .catch((error) => {
        alert(`Error for http://${ipAddress}/${field}: ${error.message}`);
      });
  };

  return (
    <div className="test">
      {Object.keys(formData).map((field) => (
        <div key={field} className="input-group">
          <input
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={field.replace(/_/g, ' ')}
            className="input-field"
          />
          <button onClick={() => handleSubmit(field)} className="send-button">전송</button>
        </div>
      ))}
    </div>
  );
};

export default Test;
