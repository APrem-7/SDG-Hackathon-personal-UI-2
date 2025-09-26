import React from "react";

const Header = ({ activeTab, onTabChange }) => {
  const navItems = ["Dashboard", "AI Chat", "Analytics", "Traffic Control"];

  return (
    <header className="header">
      <h1>ShipmentIQ Analytics</h1>
      <nav className="header-nav">
        {navItems.map((item) => (
          <div
            key={item}
            className={`nav-item ${activeTab === item ? "active" : ""}`}
            onClick={() => onTabChange(item)}
          >
            {item}
          </div>
        ))}
        <div className="theme-toggle">🌙</div>
      </nav>
    </header>
  );
};

export default Header;
