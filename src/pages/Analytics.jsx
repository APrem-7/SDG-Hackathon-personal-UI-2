import React from "react";

const Analytics = () => {
  const analyticsData = [
    { metric: "Monthly Growth", value: "+12.5%", trend: "up" },
    { metric: "Customer Satisfaction", value: "94.2%", trend: "up" },
    { metric: "Delivery Time", value: "2.3 days", trend: "down" },
    { metric: "Cost Per Shipment", value: "$45.67", trend: "down" },
  ];

  const recentAnalytics = [
    "Shipment volume increased by 15% in the last quarter",
    "Top performing route: East Coast to Midwest",
    "Peak shipping hours: 10 AM - 2 PM",
    "Most shipped product category: Electronics",
    "Average customer rating improved to 4.7/5",
  ];

  return (
    <main className="main-content">
      <h1 className="dashboard-title">Advanced Analytics</h1>
      <p className="dashboard-subtitle">
        Deep insights and performance metrics
      </p>

      {/* Key Metrics */}
      <div className="analytics-section">
        <h2 className="section-title">Key Performance Indicators</h2>
        <div className="analytics-grid">
          {analyticsData.map((item, index) => (
            <div key={index} className="analytics-card">
              <div className="analytics-metric">{item.metric}</div>
              <div className={`analytics-value ${item.trend}`}>
                {item.value}
                <span className={`trend-indicator ${item.trend}`}>
                  {item.trend === "up" ? "↗" : "↘"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Insights */}
      <div className="analytics-section">
        <h2 className="section-title">Recent Insights</h2>
        <div className="insights-list">
          {recentAnalytics.map((insight, index) => (
            <div key={index} className="insight-item">
              <span className="insight-bullet">•</span>
              <span className="insight-text">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="analytics-section">
        <h2 className="section-title">Visual Analytics</h2>
        <div className="chart-placeholder">
          <div className="chart-mock">
            <p>
              📊 Interactive charts and visualizations will be displayed here
            </p>
            <p>Connect to your data source to see real-time analytics</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Analytics;
