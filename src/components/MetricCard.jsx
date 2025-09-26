import React from "react";

const MetricCard = ({ label, value, color = "default" }) => {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${color}`}>{value}</div>
    </div>
  );
};

export default MetricCard;
