import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiTrendingUp, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerProgress = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const lecturerId = user?.id || user?._id;
      const res = await api.get(`/api/lecturer-assignments/lecturer/${lecturerId}`);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching assignments', err);
      toast.error('Failed to load your assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const updateProgress = async (data) => {
    try {
      await api.put(`/api/lecturer-assignments/${selected._id}/progress`, data);
      toast.success('Progress updated');
      fetchAssignments();
      setSelected(null);
    } catch (err) {
      console.error('Progress update error', err);
      toast.error('Failed to update progress');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Teaching Progress</h1>
      {assignments.length === 0 ? (
        <p className="text-gray-600">You have no active assignments.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Year/Sem</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{a.subject?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    {a.academicYear} / Sem {a.semester}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${a.curriculum.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{a.curriculum.progressPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setSelected(a)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FiTrendingUp /> Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ProgressModal
          assignment={selected}
          onCancel={() => setSelected(null)}
          onSubmit={updateProgress}
        />
      )}
    </div>
  );
};

const ProgressModal = ({ assignment, onCancel, onSubmit }) => {
  const [data, setData] = useState({
    lecturesCompleted: assignment.curriculum.lecturesCompleted || 0,
    practicalsCompleted: assignment.curriculum.practicalsCompleted || 0,
    assignmentsCompleted: assignment.curriculum.assignmentsCompleted || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Update Progress</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Lectures Completed: {data.lecturesCompleted}/{assignment.curriculum.totalLectures}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalLectures}
              value={data.lecturesCompleted}
              onChange={(e) => setData(p => ({ ...p, lecturesCompleted: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Practicals Completed: {data.practicalsCompleted}/{assignment.curriculum.totalPracticals}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalPracticals}
              value={data.practicalsCompleted}
              onChange={(e) => setData(p => ({ ...p, practicalsCompleted: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Assignments Completed: {data.assignmentsCompleted}/{assignment.curriculum.totalAssignments}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalAssignments}
              value={data.assignmentsCompleted}
              onChange={(e) => setData(p => ({ ...p, assignmentsCompleted: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LecturerProgress;