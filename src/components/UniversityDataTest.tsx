import React from 'react';
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from '@/constants/universities/index';

const UniversityDataTest: React.FC = () => {
  // Test our new comprehensive university data
  const universitiesWithPrograms = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(uni => 
    uni.faculties && uni.faculties.length > 0 && 
    uni.faculties.some(faculty => faculty.degrees && faculty.degrees.length > 0)
  );

  const totalPrograms = ALL_SOUTH_AFRICAN_UNIVERSITIES.reduce((total, uni) => 
    total + uni.faculties.reduce((facTotal, faculty) => 
      facTotal + (faculty.degrees ? faculty.degrees.length : 0), 0), 0
  );

  // Test specific universities from our new dataset
  const ulUniversity = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(uni => uni.id === 'ul');
  const uctUniversity = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(uni => uni.id === 'uct');
  const witsUniversity = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(uni => uni.id === 'wits');
  const ujUniversity = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(uni => uni.id === 'uj');

  const ulPrograms = ulUniversity ? ulUniversity.faculties.reduce((total, faculty) => 
    total + (faculty.degrees ? faculty.degrees.length : 0), 0) : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">University Data Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg">Total Universities</h3>
            <p className="text-2xl font-bold text-blue-600">{ALL_SOUTH_AFRICAN_UNIVERSITIES.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg">Universities with Programs</h3>
            <p className="text-2xl font-bold text-green-600">{universitiesWithPrograms.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg">Total Programs</h3>
            <p className="text-2xl font-bold text-purple-600">{totalPrograms}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg">UL Programs</h3>
            <p className="text-2xl font-bold text-orange-600">{ulPrograms}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* University of Limpopo Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">University of Limpopo (UL)</h2>
            {ulUniversity ? (
              <div>
                <p className="text-green-600 mb-2">✅ Found in dataset</p>
                <p><strong>Faculties:</strong> {ulUniversity.faculties.length}</p>
                <p><strong>Programs:</strong> {ulPrograms}</p>
                <div className="mt-4">
                  <h4 className="font-semibold">Faculties:</h4>
                  <ul className="list-disc list-inside">
                    {ulUniversity.faculties.map((faculty, index) => (
                      <li key={index} className="text-sm">
                        {faculty.name} ({faculty.degrees ? faculty.degrees.length : 0} programs)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ Not found in dataset</p>
            )}
          </div>

          {/* UCT Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">University of Cape Town (UCT)</h2>
            {uctUniversity ? (
              <div>
                <p className="text-green-600 mb-2">✅ Found in dataset</p>
                <p><strong>Scoring System:</strong> {uctUniversity.scoringSystem || 'Standard'}</p>
                <p><strong>Faculties:</strong> {uctUniversity.faculties.length}</p>
                <div className="mt-4">
                  <h4 className="font-semibold">Faculties:</h4>
                  <ul className="list-disc list-inside">
                    {uctUniversity.faculties.map((faculty, index) => (
                      <li key={index} className="text-sm">
                        {faculty.name} ({faculty.degrees ? faculty.degrees.length : 0} programs)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ Not found in dataset</p>
            )}
          </div>

          {/* Wits Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">University of the Witwatersrand (Wits)</h2>
            {witsUniversity ? (
              <div>
                <p className="text-green-600 mb-2">✅ Found in dataset</p>
                <p><strong>Scoring System:</strong> {witsUniversity.scoringSystem || 'Standard'}</p>
                <p><strong>Faculties:</strong> {witsUniversity.faculties.length}</p>
                <div className="mt-4">
                  <h4 className="font-semibold">Faculties:</h4>
                  <ul className="list-disc list-inside">
                    {witsUniversity.faculties.map((faculty, index) => (
                      <li key={index} className="text-sm">
                        {faculty.name} ({faculty.degrees ? faculty.degrees.length : 0} programs)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ Not found in dataset</p>
            )}
          </div>

          {/* UJ Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">University of Johannesburg (UJ)</h2>
            {ujUniversity ? (
              <div>
                <p className="text-green-600 mb-2">✅ Found in dataset</p>
                <p><strong>Faculties:</strong> {ujUniversity.faculties.length}</p>
                <div className="mt-4">
                  <h4 className="font-semibold">Faculties:</h4>
                  <ul className="list-disc list-inside">
                    {ujUniversity.faculties.map((faculty, index) => (
                      <li key={index} className="text-sm">
                        {faculty.name} ({faculty.degrees ? faculty.degrees.length : 0} programs)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ Not found in dataset</p>
            )}
          </div>
        </div>

        {/* Sample Programs from UL */}
        {ulUniversity && ulUniversity.faculties.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Sample Programs from University of Limpopo</h2>
            {ulUniversity.faculties[0].degrees && ulUniversity.faculties[0].degrees.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">{ulUniversity.faculties[0].name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ulUniversity.faculties[0].degrees.slice(0, 4).map((degree, index) => (
                    <div key={index} className="border border-gray-200 p-3 rounded">
                      <h4 className="font-medium">{degree.name}</h4>
                      <p className="text-sm text-gray-600">APS: {degree.apsRequirement}</p>
                      <p className="text-sm text-gray-600">Duration: {degree.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityDataTest;
