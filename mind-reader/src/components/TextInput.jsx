/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from 'react';

const TextInput = ({ value, onChange }) => {
  return (
    <div className="w-full max-w-lg mx-auto">
      <textarea
        className="w-full p-4 border rounded-lg shadow-sm min-h-[200px]"
        placeholder="Analiz edilecek metni buraya girin..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TextInput;