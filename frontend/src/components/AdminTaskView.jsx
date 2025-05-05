/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

const AdminTaskView = ({ allTasks: initialTasks, adminEmail, removeTask }) => {
  const [allTasks, setAllTasks] = useState(initialTasks);

  // Sync tasks with initialTasks when it changes
  useEffect(() => {
    setAllTasks(initialTasks);
  }, [initialTasks]);

  // Filter tasks assigned by the admin
  const adminAssignedTasks = allTasks.filter((task) => task.assignedby === adminEmail);
  // Remove admin tasks from the general tasks list
  const otherTasks = allTasks.filter((task) => task.assignedby !== adminEmail);

  const handleRemoveTask = (taskId) => {
    // Call the removeTask function provided via props
    removeTask(taskId);
    // Remove task from the local state
    setAllTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
  };

  return (
    <div className="bg-white rounded-lg pt-4 px-6 overflow-hidden">
      
      {/* Tasks Assigned by Admin */}
      <h3 className="text-3xl font-thin text-gray-800 mb-1">Tasks Assigned by Admin</h3>
      {adminAssignedTasks.length > 0 ? (
        <div className="overflow-x-auto max-h-80 rounded-lg">
          <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden table-auto">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Task</th>
                <th className="px-6 py-3 text-left">Assigned To</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Deadline</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminAssignedTasks.map((task, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                  } hover:bg-gray-200 transition-all duration-300`}
                >
                  <td className="px-6 py-4">{task.taskdata}</td>
                  <td className="px-6 py-4">{task.assignedto}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        task.status === "Done"
                          ? "bg-green-500 text-white"
                          : task.status === "Delayed"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Display only the date */}
                    {new Date(task.deadline).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="mt-2 text-red-600 hover:text-red-800 transition-all duration-300"
                      onClick={() => handleRemoveTask(task._id)}
                    >
                      Remove Task
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-4">No tasks assigned by admin.</p>
      )}

      {/* Other Tasks */}
      <h3 className="text-3xl font-thin text-gray-800 mt-2 mb-1">Other Tasks</h3>
      {otherTasks.length > 0 ? (
        <div className="overflow-x-auto max-h-80 rounded-lg">
          <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden table-auto">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Task</th>
                <th className="px-6 py-3 text-left">Assigned By</th>
                <th className="px-6 py-3 text-left">Assigned To</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Deadline</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {otherTasks.map((task, index) => (
                <tr
                  key={task._id}
                  className={`${
                    index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                  } hover:bg-gray-200 transition-all duration-300`}
                >
                  <td className="px-6 py-4">{task.taskdata}</td>
                  <td className="px-6 py-4">{task.assignedby}</td>
                  <td className="px-6 py-4">{task.assignedto}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        task.status === "Done"
                          ? "bg-green-500 text-white"
                          : task.status === "Delayed"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Display only the date */}
                    {new Date(task.deadline).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="mt-2 text-red-600 hover:text-red-800 transition-all duration-300"
                      onClick={() => handleRemoveTask(task._id)}
                    >
                      Remove Task
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-4">No other tasks available.</p>
      )}
    </div>
  );
};

export default AdminTaskView;
