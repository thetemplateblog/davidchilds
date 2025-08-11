import React from 'react';
import IdeaValidationForm from '../components/IdeaValidationForm';

export default function IdeaValidationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              AI-Powered Idea Validation Canvas
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Let our AI help you refine and validate your startup idea in minutes
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12">
        <IdeaValidationForm />
      </div>

      {/* Optional: Add testimonials or trust badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">50+</div>
            <div className="text-gray-600">Ideas Validated</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">15 min</div>
            <div className="text-gray-600">Average Completion Time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">92%</div>
            <div className="text-gray-600">Found It Helpful</div>
          </div>
        </div>
      </div>
    </div>
  );
}