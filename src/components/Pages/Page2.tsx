import React from 'react';
import { Link } from 'react-router-dom';

const Page2: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Page 2</h1>
      <p>This is the second page. Click the link below to go back to Page 1.</p>
      <Link to="/page1" className="text-blue-500 hover:underline">
        Go to Page 1
      </Link>
    </div>
  );
};

export default Page2;