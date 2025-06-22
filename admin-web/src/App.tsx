import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/jogosOnline" replace />} />
        <Route path="/jogosOnline" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
