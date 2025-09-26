import React, { useState } from "react";

const AIAssistant = () => {
  const [inputValue, setInputValue] = useState("");

  const suggestions = [
    "Show me total shipments by year",
    "Create a pie chart of product distribution",
    "Bar chart of flow rates by bay code",
    "Show shipment trends over time",
    "Analyze top performing products",
    "Display monthly shipment volumes",
  ];

  const handleAskAI = () => {
    if (inputValue.trim()) {
      alert(`AI Query: ${inputValue}`);
      setInputValue("");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAskAI();
    }
  };

  return (
    <div className="ai-assistant">
      <h2>AI Assistant</h2>

      <div className="ai-input-container">
        <input
          type="text"
          className="ai-input"
          placeholder="Ask me anything about your shipment data..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="ask-button" onClick={handleAskAI}>
          Ask AI
        </button>
      </div>

      <div className="query-suggestions">
        <p>Try these queries:</p>
        <div className="suggestion-tags">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-tag"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
