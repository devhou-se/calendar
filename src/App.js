import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DevhouseView from './DevhouseView';
import EditorView from './EditorView';
import LocationsView from './LocationsView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DevhouseView />} />
      <Route path="/editor" element={<EditorView />} />
      <Route path="/locations" element={<LocationsView />} />
    </Routes>
  );
}

export default App;
