import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { format } from 'date-fns';

const StudentTimetable = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/timetables/upcoming');
        setTimetables(res.data.timetables);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Exam Timetable</h1>
      {timetables.length === 0 ? (
        <p className="text-gray-600">No upcoming exams found.</p>
      ) : (
        <div className="space-y-4">
          {timetables.map((t) => (
            <div key={t._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">{t.subject?.name || 'Unknown Subject'}</h2>
                <span className="text-sm text-gray-500">Semester {t.semester}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center">
                  <FiCalendar className="mr-1" /> {format(new Date(t.date), 'PPP')}
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-1" /> {t.startTime} - {t.endTime}
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-1" /> {t.venue}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
