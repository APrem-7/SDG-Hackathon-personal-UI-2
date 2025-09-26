import React, { useState, useEffect } from 'react';
import { analyzeTrafficControlTower } from '../utils/dataAnalysis.js';
import { fetchDataFromLangChain, generateMockData } from '../services/apiService.js';

const TrafficControlTower = () => {
  const [data, setData] = useState([]);
  const [trafficAnalysis, setTrafficAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTrafficData();
    // Set up auto-refresh every 30 seconds for demo
    const interval = setInterval(loadTrafficData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTrafficData = async () => {
    setLoading(true);
    try {
      // Try to fetch real data, fallback to mock
      const result = await fetchDataFromLangChain("Show me all terminal lane operations and shipment data");
      let dataToUse = result.success ? result.data : generateMockData().data;
      
      // If no lane data, generate terminal-specific mock data
      if (!hasTerminalData(dataToUse)) {
        dataToUse = generateTerminalMockData();
      }
      
      setData(dataToUse);
      setTrafficAnalysis(analyzeTrafficControlTower(dataToUse));
    } catch (error) {
      console.error('Error loading traffic data:', error);
      const mockData = generateTerminalMockData();
      setData(mockData);
      setTrafficAnalysis(analyzeTrafficControlTower(mockData));
    } finally {
      setLoading(false);
    }
  };

  const hasTerminalData = (data) => {
    if (!data || data.length === 0) return false;
    const fields = Object.keys(data[0] || {});
    return fields.some(field => 
      field.toLowerCase().includes('lane') ||
      field.toLowerCase().includes('bay') ||
      field.toLowerCase().includes('dock')
    );
  };

  const generateTerminalMockData = () => {
    const lanes = ['LANE01', 'LANE02', 'LANE03', 'LANE04', 'LANE05'];
    const mockData = [];
    
    for (let i = 0; i < 100; i++) {
      const startTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + (Math.random() * 120 + 15) * 60 * 1000);
      
      mockData.push({
        shipment_id: `190817${String(i).padStart(3, '0')}`,
        ticket_id: `TKT${String(i + 1000).padStart(4, '0')}`,
        lane: lanes[Math.floor(Math.random() * lanes.length)],
        truck_id: `T${String(Math.floor(Math.random() * 500) + 100)}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        load_type: ['Container', 'Bulk', 'Liquid', 'General'][Math.floor(Math.random() * 4)],
        weight_tons: Math.floor(Math.random() * 40) + 10,
        status: ['Completed', 'In Progress', 'Loading'][Math.floor(Math.random() * 3)]
      });
    }
    
    return mockData;
  };

  if (loading) {
    return (
      <div className="traffic-control-loading">
        <h1>🚦 Traffic Control Tower</h1>
        <div className="loading-indicator">Loading terminal operations data...</div>
      </div>
    );
  }

  if (!trafficAnalysis || trafficAnalysis.isEmpty) {
    return (
      <div className="traffic-control-error">
        <h1>🚦 Traffic Control Tower</h1>
        <div className="error-message">No terminal data available</div>
      </div>
    );
  }

  return (
    <main className="traffic-control-tower">
      {/* Header */}
      <div className="traffic-header">
        <h1>🚦 Traffic Control Tower</h1>
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          LIVE - Updates every 30s
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-dashboard">
        <div className="kpi-card">
          <div className="kpi-value">{trafficAnalysis.kpis.totalShipments}</div>
          <div className="kpi-label">Total Shipments</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{trafficAnalysis.kpis.activeLanes}</div>
          <div className="kpi-label">Active Lanes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{trafficAnalysis.kpis.avgTurnaroundMinutes || '--'}</div>
          <div className="kpi-label">Avg Turnaround (min)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{trafficAnalysis.kpis.onTimePercentage}%</div>
          <div className="kpi-label">On-Time Performance</div>
        </div>
      </div>

      {/* Alerts Section */}
      {trafficAnalysis.alerts.length > 0 && (
        <div className="alerts-section">
          <h3>🚨 Active Alerts</h3>
          <div className="alerts-container">
            {trafficAnalysis.alerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.severity.toLowerCase()}`}>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Lane Overview
        </button>
        <button 
          className={`tab ${activeTab === 'congestion' ? 'active' : ''}`}
          onClick={() => setActiveTab('congestion')}
        >
          Congestion Monitor
        </button>
        <button 
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Scores
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="lane-overview">
            <h3>Lane Utilization Overview</h3>
            <div className="lane-grid">
              {Object.entries(trafficAnalysis.laneMetrics).map(([lane, metrics]) => (
                <div key={lane} className="lane-card">
                  <div className="lane-header">
                    <h4>{lane}</h4>
                    <span className={`status-indicator ${metrics.congestionLevel.toLowerCase()}`}>
                      {metrics.congestionLevel}
                    </span>
                  </div>
                  <div className="lane-stats">
                    <div className="stat">
                      <span className="stat-value">{metrics.totalShipments}</span>
                      <span className="stat-label">Shipments</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{metrics.efficiency}</span>
                      <span className="stat-label">Grade</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'congestion' && (
          <div className="congestion-monitor">
            <h3>Congestion Heatmap</h3>
            <div className="congestion-info">
              <p>Real-time analysis of lane congestion patterns throughout the day</p>
              <div className="legend">
                <span className="legend-item normal">🟢 Normal (1-5 shipments/hour)</span>
                <span className="legend-item moderate">🟡 Moderate (6-10 shipments/hour)</span>
                <span className="legend-item heavy">🔴 Heavy (10+ shipments/hour)</span>
              </div>
            </div>
            <div className="congestion-grid">
              {Object.entries(trafficAnalysis.congestionAnalysis).map(([lane, hours]) => (
                <div key={lane} className="congestion-lane">
                  <h4>{lane}</h4>
                  <div className="hour-grid">
                    {Object.entries(hours).map(([hour, info]) => (
                      <div key={hour} className={`hour-cell ${info.level.toLowerCase()}`}>
                        <div className="hour">{hour}:00</div>
                        <div className="count">{info.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-scores">
            <h3>Lane Performance Scoreboard</h3>
            <div className="scoreboard">
              {Object.entries(trafficAnalysis.utilizationScores).map(([lane, score]) => (
                <div key={lane} className="score-card">
                  <div className="lane-name">{lane}</div>
                  <div className={`grade grade-${score.grade.toLowerCase()}`}>
                    {score.grade}
                  </div>
                  <div className="score-details">
                    <div className="detail">
                      <span>Utilization:</span>
                      <span>{score.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="detail">
                      <span>Shipments:</span>
                      <span>{score.shipmentCount}</span>
                    </div>
                    <div className="detail">
                      <span>Efficiency:</span>
                      <span className={`efficiency ${score.efficiency.toLowerCase()}`}>
                        {score.efficiency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stuck Shipments Section */}
      {trafficAnalysis.stuckShipments.length > 0 && (
        <div className="stuck-shipments">
          <h3>⚠️ Delayed Shipments</h3>
          <div className="stuck-list">
            {trafficAnalysis.stuckShipments.map((shipment, index) => (
              <div key={index} className={`stuck-item ${shipment.severity.toLowerCase()}`}>
                <div className="shipment-id">{shipment.shipmentId}</div>
                <div className="delay-info">
                  Delayed {Math.round(shipment.delayMinutes)} minutes
                </div>
                <div className="severity-badge">{shipment.severity}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default TrafficControlTower;