/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from 'react';
const Button = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
    >
      {isLoading ? 'Analiz ediliyor...' : 'Analiz Et'}
    </button>
  );
};

export default Button;