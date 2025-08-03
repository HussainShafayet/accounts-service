import React, { useState } from 'react';

function App() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/dummy/sum/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: Number(num1), b: Number(num2) }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      setResult(data.result);
      setCount(data.count);
    } catch (err) {
      setError('Failed to get result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Add Two Numbers
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            value={num1}
            onChange={(e) => setNum1(e.target.value)}
            placeholder="Enter first number"
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            value={num2}
            onChange={(e) => setNum2(e.target.value)}
            placeholder="Enter second number"
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </form>

        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

        {result !== null && count !== null && (
          <div className="mt-6 text-center">
            <p className="text-lg text-gray-700">
              <span className="font-semibold">Result:</span> {result}
            </p>
            <p className="text-sm text-gray-500">
              This calculation has been done <span className="font-semibold">{count}</span> times.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
