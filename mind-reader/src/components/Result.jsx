/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from 'react';

const Result = ({ sentiment }) => {
  if (!sentiment) return null;

  const getEmoji = () => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      case 'neutral':
        return '😐';
      default:
        return '❓';
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg">
      <h3 className="text-xl font-bold mb-2">Duygu Analizi Sonucu</h3>
      <div className="text-center text-2xl">
        <span>{getEmoji()}</span>
        <p className="mt-2">{sentiment}</p>
      </div>
    </div>
  );
};

export default Result;