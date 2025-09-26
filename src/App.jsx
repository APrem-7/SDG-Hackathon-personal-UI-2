import React, { useState } from "react";
import "./App.css";
import Header from "./components/Header.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AIChat from "./pages/AIChat.jsx";
import Analytics from "./pages/Analytics.jsx";

const App = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const renderCurrentPage = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard />;
      case "AI Chat":
        return <AIChat />;
      case "Analytics":
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {renderCurrentPage()}
    </div>
  );
};

export default App;
