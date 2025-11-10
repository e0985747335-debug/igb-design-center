import React from 'react';

export default function Header({ title }) {
  return (
    <header className="flex justify-between items-center bg-white shadow p-4 mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <span className="text-sm text-gray-500">IGB ERP Prototype</span>
    </header>
  );
}
