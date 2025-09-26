import React from "react";
import MetricCard from "../components/MetricCard.jsx";
import AIAssistant from "../components/AIAssistant.jsx";

const Dashboard = () => {
  const metrics = [
    {
      label: "Total Shipments",
      value: "0",
      color: "default",
    },
    {
      label: "Average Flow Rate",
      value: "0 L/min",
      color: "green",
    },
    {
      label: "Unique Products",
      value: "0",
      color: "default",
    },
    {
      label: "Average Quantity",
      value: "0 units",
      color: "default",
    },
  ];

  return (
    <main className="main-content">
      <h1 className="dashboard-title">AI-Powered Analytics Dashboard</h1>
      <p className="dashboard-subtitle">
        Real-time insights from 0 shipment records
      </p>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            label={metric.label}
            value={metric.value}
            color={metric.color}
          />
        ))}
      </div>

      {/* AI Assistant Section */}
      <AIAssistant />
    </main>
  );
};

export default Dashboard;
