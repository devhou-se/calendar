import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DevhouseView from './DevhouseView';
import EditorView from './EditorView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DevhouseView />} />
      <Route path="/editor" element={<EditorView />} />
    </Routes>
  );
}

export default App;
