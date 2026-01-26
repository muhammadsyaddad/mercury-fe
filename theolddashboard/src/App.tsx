import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx'
import { CurrencyProvider } from './contexts/CurrencyContext.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Layout from './components/Layout.tsx'
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Cameras from './pages/Cameras.tsx'
import History from './pages/History.tsx'
import ReviewedDetections from './pages/ReviewedDetections.tsx'
import Users from './pages/Users.tsx'
import Account from './pages/Account.tsx'
import TrayManagement from './pages/TrayManagement.tsx'
import ExecutiveDashboard from './pages/ExecutiveDashboard.tsx'
import ModernExecutiveDashboard from './pages/ModernExecutiveDashboard.tsx'
import PricingManagement from './pages/PricingManagement.tsx'
import WasteTargets from './pages/WasteTargets.tsx'
import Settings from './pages/Settings.tsx'
import RestaurantMetrics from './pages/RestaurantMetrics.tsx'
import MenuManagement from './pages/MenuManagement.tsx'
import GlobalSSEHandler from './components/GlobalSSEHandler.tsx'
import InactivityWeightModal from './components/InactivityWeightModal.tsx'
import { useInactivityDetection } from './hooks/useInactivityDetection'
import { sseService } from './services/sse'
import { toast } from 'react-hot-toast'
import { Detection, UserRole } from './types/index.ts'

const AppContent: React.FC = () => {
  const { user, hasAnyRole, hasRole } = useAuth();
  const [newDetection, setNewDetection] = useState<Detection | null>(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false);

  // Only show popup for users who can review detections
  const canReviewDetections = hasAnyRole([UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]);
  
  // Only show inactivity modal for users with STAFF role (kitchen staff)
  const isKitchenStaff = hasRole(UserRole.STAFF);

  // Inactivity detection - 10 seconds timeout
  useInactivityDetection({
    timeoutMs: 10000,
    onInactive: () => {
      if (isKitchenStaff && user) {
        setShowInactivityModal(true);
      }
    },
    disabled: !isKitchenStaff || !user || showInactivityModal
  });

  useEffect(() => {
    if (!user) return;

    // Set up global SSE connection
    sseService.connect(
      (event) => {
        switch (event.type) {
          // PROGRESSIVE DETECTION EVENTS
          case 'detection_analyzing':
            if (event.data && canReviewDetections) {
              setNewDetection(event.data);
              toast.success('New detection captured - analyzing...', { id: `detection-${event.data.id}` });
            }
            window.dispatchEvent(new CustomEvent('newDetection', { detail: event.data }));
            break;
            
          case 'detection_food_classified':
            if (event.data && canReviewDetections) {
              setNewDetection(prev => prev?.id === event.data.id ? { ...prev, ...event.data } : event.data);
              toast.success(`Food classified: ${event.data.description}`, { id: `detection-${event.data.id}` });
            }
            window.dispatchEvent(new CustomEvent('newDetection', { detail: event.data }));
            break;
            
          case 'detection_initial_ocr_complete':
            if (event.data && canReviewDetections) {
              setNewDetection(prev => prev?.id === event.data.id ? { ...prev, ...event.data } : event.data);
              toast.success(`Initial weight: ${event.data.initial_weight ? (event.data.initial_weight / 1000).toFixed(3) + 'kg' : 'N/A'}`, { id: `detection-${event.data.id}` });
            }
            window.dispatchEvent(new CustomEvent('newDetection', { detail: event.data }));
            break;
            
          case 'detection_complete':
            if (event.data && canReviewDetections) {
              setNewDetection(prev => prev?.id === event.data.id ? { ...prev, ...event.data } : event.data);
              toast.success(`Detection complete - Net waste: ${event.data.net_weight ? (event.data.net_weight / 1000).toFixed(3) + 'kg' : 'N/A'}`, { id: `detection-${event.data.id}` });
            }
            window.dispatchEvent(new CustomEvent('newDetection', { detail: event.data }));
            break;
            
          case 'detection_ai_error':
            if (event.data && canReviewDetections) {
              setNewDetection(prev => prev?.id === event.data.id ? { ...prev, ...event.data } : event.data);
              toast.error(`AI processing failed: ${event.data.error_message}`, { id: `detection-${event.data.id}` });
            }
            window.dispatchEvent(new CustomEvent('newDetection', { detail: event.data }));
            break;
            
          // LEGACY SUPPORT - keep for backward compatibility
          case 'new_detection':
            if (event.data && canReviewDetections) {
              setNewDetection(event.data);
              toast.success(`New ${event.data.category} detection received!`);
            } else if (event.data) {
              // For non-reviewers, just show a toast
              toast.success(`New ${event.data.category} detected!`);
            }
            
            // Dispatch custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('newDetection', { detail: event.data }));
            break;
          case 'camera_status':
            window.dispatchEvent(new CustomEvent('cameraStatus', { detail: event.data }));
            break;
          case 'recent_detections':
            window.dispatchEvent(new CustomEvent('recentDetections', { detail: event.data }));
            break;
          case 'system_alert':
            if (event.data.severity === 'error') {
              toast.error(event.data.message);
            } else {
              toast.success(event.data.message);
            }
            window.dispatchEvent(new CustomEvent('systemAlert', { detail: event.data }));
            break;
          default:
            break;
        }
      },
      (error) => {
        console.error('Global SSE connection error:', error);
      }
    );

    return () => {
      sseService.disconnect();
    };
  }, [user, canReviewDetections]);

  const handleDetectionProcessed = () => {
    setNewDetection(null);
  };

  return (
    <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#059669',
                },
              },
              error: {
                style: {
                  background: '#dc2626',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              <Route path="dashboard" element={
                <ProtectedRoute requiredRoles={[UserRole.USER, UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="cameras" element={
                <ProtectedRoute requiredRoles={[UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]}>
                  <Cameras />
                </ProtectedRoute>
              } />
              
              <Route path="history" element={
                <ProtectedRoute requiredRoles={[UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]}>
                  <History />
                </ProtectedRoute>
              } />
              
              <Route path="reviewed" element={
                <ProtectedRoute requiredRoles={[UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN]}>
                  <ReviewedDetections />
                </ProtectedRoute>
              } />
              
              <Route path="users" element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <Users />
                </ProtectedRoute>
              } />

              <Route path="trays" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <TrayManagement />
                </ProtectedRoute>
              } />

              <Route path="executive" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <ExecutiveDashboard />
                </ProtectedRoute>
              } />

              <Route path="modern-executive" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <ModernExecutiveDashboard />
                </ProtectedRoute>
              } />

              <Route path="menu" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <MenuManagement />
                </ProtectedRoute>
              } />

              <Route path="pricing" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <PricingManagement />
                </ProtectedRoute>
              } />

              <Route path="targets" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <WasteTargets />
                </ProtectedRoute>
              } />

              <Route path="settings" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <Settings />
                </ProtectedRoute>
              } />

              <Route path="restaurant-metrics" element={
                <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                  <RestaurantMetrics />
                </ProtectedRoute>
              } />
              
              <Route path="account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Global SSE Handler for Detection Popups */}
          <GlobalSSEHandler 
            newDetection={newDetection}
            onDetectionProcessed={handleDetectionProcessed}
          />

          {/* Inactivity Weight Modal - Only for STAFF role (kitchen staff) */}
          <InactivityWeightModal 
            isOpen={showInactivityModal}
            onClose={() => setShowInactivityModal(false)}
          />
        </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <AppContent />
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App