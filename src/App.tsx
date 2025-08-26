import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProjectList } from './components/Projects/ProjectList';
import { TeamList } from './components/Teams/TeamList';
import { MemberList } from './components/Members/MemberList';
import { TaskList } from './components/Tasks/TaskList';
import { TaskTracker } from './components/Tasks/TaskTracker';
import { GanttChart } from './components/Gantt/GanttChart';
import { Analytics } from './components/Analytics/Analytics';
import { Reports } from './components/Reports/Reports';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<ProjectList />} />
                <Route path="teams" element={<TeamList />} />
                <Route path="members" element={<MemberList />} />
                <Route path="tasks" element={<TaskList />} />
                <Route path="task-tracker" element={<TaskTracker />} />
                <Route path="gantt" element={<GanttChart />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;