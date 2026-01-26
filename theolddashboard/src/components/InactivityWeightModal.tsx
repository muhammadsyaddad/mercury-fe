import React, { useEffect, useState } from 'react';
import { Scale, Clock, TrendingUp, X } from 'lucide-react';
import { apiService } from '../services/api';
import { WeightAnalytics } from '../types';
import { financialAnalyticsApi } from '../services/financialApi';
import { getTodayLocalDate } from '../utils/dateUtils';

interface InactivityWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InactivityWeightModal: React.FC<InactivityWeightModalProps> = ({
  isOpen,
  onClose
}) => {
  const [weightData, setWeightData] = useState<WeightAnalytics | null>(null);
  const [financialTrends, setFinancialTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWeightData = async () => {
      try {
        setLoading(true);
        // Use the same data sources as dashboard for consistency
        const [weightAnalytics, trends] = await Promise.all([
          apiService.getWeightAnalytics({ days: 30 }),
          financialAnalyticsApi.getCostTrends(31)
        ]);
        setWeightData(weightAnalytics);
        setFinancialTrends(trends);
      } catch (error) {
        console.error('Failed to fetch weight analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeightData();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    // Close modal when new detection activity occurs
    const handleNewDetection = (event: any) => {
      if (isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Listen for detection SSE events to close modal on activity
      window.addEventListener('newDetection', handleNewDetection);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('newDetection', handleNewDetection);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const formatWeight = (weight: number | undefined) => {
    if (weight == null || weight === 0) return '0.00';
    return (weight / 1000).toFixed(2);
  };

  const getTodayData = () => {
    const today = getTodayLocalDate();
    // Use financial trends data for consistency with dashboard
    if (financialTrends && financialTrends.length > 0) {
      const todayFinancialData = financialTrends.find(trend => trend.date === today);
      if (todayFinancialData) {
        return {
          weight: todayFinancialData.weight_kg * 1000, // Convert to grams
          detectionCount: todayFinancialData.detection_count || 0
        };
      }
    }
    // Fallback to weight analytics if no financial trends
    if (!weightData?.daily_totals?.length) return { weight: 0, detectionCount: 0 };
    const todayData = weightData.daily_totals.find(d => d.date === today);
    return {
      weight: todayData?.total_weight || 0,
      detectionCount: todayData?.count || 0
    };
  };

  const getTodayTotal = () => {
    return getTodayData().weight;
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: scale(0.95); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes pulse { 
          0%, 100% { opacity: 0.8; } 
          50% { opacity: 1; } 
        }
        .modal-enter { animation: fadeIn 0.3s ease-out; }
        .weight-pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center modal-enter">
        {/* Touch-friendly close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 w-12 h-12 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Compact main content */}
        <div className="text-center text-white w-full max-w-4xl mx-auto px-6">
          {/* Minimal header */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <Scale className="w-8 h-8 text-white weight-pulse" />
            <h1 className="text-2xl font-light text-white/90">Today's Waste</h1>
            <span className="text-lg text-white/60">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-white/20 border-t-white/80 rounded-full mx-auto"></div>
              <p className="text-lg text-white/60">Loading...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* MASSIVE weight display - center stage */}
              <div className="text-center py-8">
                <div className="flex items-baseline justify-center gap-4">
                  <div className="text-[12rem] font-black text-white weight-pulse tracking-tight leading-none">
                    {formatWeight(getTodayTotal())}
                  </div>
                  <div className="text-4xl text-white/60 font-light">kg</div>
                </div>
                <p className="text-lg text-white/40 font-light mt-4">total waste today</p>
              </div>

              {/* Bottom stats */}
              <div className="flex justify-center gap-8">
                <div className="text-center bg-white/10 rounded-lg p-3 min-w-[100px]">
                  <div className="text-xl font-bold text-blue-300">
                    {getTodayData().detectionCount}
                  </div>
                  <p className="text-white/60 text-xs">Items</p>
                </div>
                
                <div className="text-center bg-white/10 rounded-lg p-3 min-w-[100px]">
                  <div className="text-xl font-bold text-green-300">
                    {(() => {
                      const todayData = getTodayData();
                      const avgWeight = todayData.detectionCount > 0 ? todayData.weight / todayData.detectionCount : 0;
                      return formatWeight(avgWeight);
                    })()}
                  </div>
                  <p className="text-white/60 text-xs">Avg kg</p>
                </div>
              </div>
            </div>
          )}

          {/* Compact footer */}
          <div className="mt-8 text-white/40 text-sm">
            <p>Auto-close on activity • Press ESC or tap X</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InactivityWeightModal;