import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
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
import { PhaseList } from './components/Phases/PhaseList';
import { CompanySettings } from './components/Settings/CompanySettings';
import { TestConnection } from './components/TestConnection';
import ImageGallery from './components/Pages/ImageGallery';
import FinancialPlanning from './components/Pages/Page2';
import TechnicalAuditReport from './components/Pages/TechnicalAuditReport';
import ProjectArchive from './components/Pages/ProjectArchive';
import ProjectCalculator from './components/Pages/ProjectCalculator';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DataProvider>
          <NotificationProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/test-connection" element={<TestConnection />} />
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
                    <Route path="phases" element={<PhaseList />} />
                    <Route path="teams" element={<TeamList />} />
                    <Route path="members" element={<MemberList />} />
                    <Route path="tasks" element={<TaskList />} />
                    <Route path="task-tracker" element={<TaskTracker />} />
                    <Route path="task-tracker/:taskId" element={<TaskTracker />} />
                    <Route path="gantt" element={<GanttChart />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<CompanySettings />} />
                    <Route path="page1" element={<ImageGallery />} />
                    <Route path="page2" element={<FinancialPlanning />} />
                    <Route path="technical-audit" element={<TechnicalAuditReport />} />
                    <Route path="project-archive" element={<ProjectArchive />} />
                    <Route path="project-calculator" element={<ProjectCalculator />} />
                  </Route>
                </Routes>
              </div>
            </Router>
          </NotificationProvider>
        </DataProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;