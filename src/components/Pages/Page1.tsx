import React from 'react';
import { Link } from 'react-router-dom';

const FinancialManagement: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">صفحة الإدارة المالية</h1>
      <p className="mb-4">هذه الصفحة تعرض تطبيق الإدارة المالية داخل التطبيق.</p>

      <div className="mb-4">
        <Link to="/page2" className="text-blue-500 hover:underline">
          انتقل إلى الصفحة 2
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <iframe
          src="https://script.google.com/macros/s/AKfycbw8rOIT4Lyfapq_G2O2QgEx2xf4_5NCtnG_USPArk2XcqjxMesI9zWhcBtvMsO1ekn0_A/exec"
          width="100%"
          height="600"
          frameBorder="0"
          title="الإدارة المالية"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default FinancialManagement;