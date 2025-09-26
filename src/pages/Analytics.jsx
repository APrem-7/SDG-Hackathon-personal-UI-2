import React, { useState, useEffect, useRef } from "react";
import vegaEmbed from "vega-embed";
import { GraphicWalker } from "@kanaries/graphic-walker";

import { generateDynamicChart } from "../utils/chartGeneration.js";
import {
  generateGraphicWalkerFields,
  validateDataForGraphicWalker,
} from "../utils/fieldMapping.js";
import {
  fetchDataFromLangChain,
  testLangChainConnectivity,
  generateMockData,
  formatAPIError,
} from "../services/apiService.js";

const Analytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [activeView, setActiveView] = useState("charts");
  const [queryInput, setQueryInput] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // Fetch data from LangChain backend using the new API service
  const fetchData = async (
    question = "Show me a general overview of my shipment data"
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchDataFromLangChain(question);

      if (result.success) {
        setData(result.data);
        setSqlQuery(result.sqlQuery);
        setUserQuestion(result.userQuestion);
        setError(null);
      } else {
        // Fallback to mock data if API fails
        console.log("🔄 Falling back to mock data");
        const mockResult = generateMockData();
        setData(mockResult.data);
        setSqlQuery(mockResult.sqlQuery);
        setUserQuestion(mockResult.userQuestion);
        setError(formatAPIError(result.error));
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      // Fallback to mock data
      const mockResult = generateMockData();
      setData(mockResult.data);
      setSqlQuery(mockResult.sqlQuery);
      setUserQuestion(mockResult.userQuestion);
      setError("Unexpected error occurred. Using mock data.");
    } finally {
      setLoading(false);
    }
  };

  const getGraphicWalkerData = () => {
    return generateGraphicWalkerFields(data);
  };

  const generateAIVisualization = () => {
    if (!data.length) return;

    try {
      const spec = generateDynamicChart(data, sqlQuery, userQuestion);

      vegaEmbed(chartRef.current, spec, {
        actions: false,
        tooltip: true,
        renderer: "svg",
      })
        .then(() => setAiGenerated(true))
        .catch(console.error);
    } catch (error) {
      console.error("Error generating visualization:", error);
      setAiGenerated(false);
    }
  };

  useEffect(() => {
    fetchData("Show me a general overview of my shipment data");
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      generateAIVisualization();
    }
  }, [data]);

  const handleCustomQuery = async () => {
    if (queryInput.trim()) {
      await fetchData(queryInput);
      setQueryInput(""); // Clear input after query
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCustomQuery();
    }
  };

  const testAPIConnectivity = async () => {
    setLoading(true);
    try {
      const result = await testLangChainConnectivity();

      if (result.success) {
        console.log(" Connection test successful!");
        setError(null);
      } else {
        console.log("Connection test failed");
        setError(formatAPIError(result.error));
      }
    } catch (error) {
      console.error("Unexpected error during connectivity test:", error);
      setError("Unexpected error during connectivity test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      <div className="analytics-header">
        <h1 className="dashboard-title">AI-Powered Analytics</h1>
        {aiGenerated && (
          <div className="ai-status">
            <span className="ai-badge">AI visualization generated</span>
            <span className="ai-details">
              Dynamic chart based on your query: "{userQuestion}"
            </span>
          </div>
        )}
        {loading && (
          <div className="api-status loading">
            <span className="api-badge loading"> Loading data...</span>
          </div>
        )}
        {!loading && data.length === 0 && (
          <div className="api-status error">
            <span className="api-badge error">
              {" "}
              No data - Check API connection
            </span>
          </div>
        )}
        {!loading && data.length > 0 && (
          <div className="api-status success">
            <span className="api-badge success">
              {" "}
              {data.length} records loaded
            </span>
          </div>
        )}
      </div>

      {sqlQuery && (
        <div className="sql-query-section">
          <div className="sql-header">
            <h3>Generated SQL Query:</h3>
            <span className="sql-badge">AI Generated</span>
          </div>
          <div className="sql-code">
            <code>{sqlQuery}</code>
          </div>
        </div>
      )}

      {error && (
        <div className="error-section">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        </div>
      )}

      <div className="query-section">
        <div className="query-input-container">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI about your data (e.g., 'Show me sales trends', 'What are the top performing products?')"
            className="query-input"
            disabled={loading}
          />
          <button
            onClick={handleCustomQuery}
            disabled={loading || !queryInput.trim()}
            className="query-btn"
          >
            {loading ? "Processing..." : "Ask AI"}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`view-button ${activeView === "charts" ? "active" : ""}`}
          onClick={() => setActiveView("charts")}
        >
          AI Visualization
        </button>
        <button
          className={`view-button ${
            activeView === "graphicwalker" ? "active" : ""
          }`}
          onClick={() => setActiveView("graphicwalker")}
        >
          GraphicWalker
        </button>
        <button
          className="view-button api-test"
          onClick={testAPIConnectivity}
          disabled={loading}
        >
          Test API
        </button>
        <button
          className="view-button refresh"
          onClick={() => fetchData("Show me a general overview of the data")}
          disabled={loading}
        >
          Get Overview
        </button>
      </div>

      {activeView === "charts" ? (
        <div className="visualization-section">
          <div className="section-header">
            <h2>AI-Generated Visualization</h2>
            <p>Dynamically created based on data structure and your query</p>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="chart-loading">Loading data...</div>
            ) : (
              <div ref={chartRef} className="vega-chart"></div>
            )}
          </div>
        </div>
      ) : (
        <div className="graphicwalker-section">
          <div className="section-header">
            <h2>GraphicWalker - Advanced Data Exploration</h2>
            <p>
              Professional drag-and-drop analytics interface similar to Tableau
            </p>
          </div>
          {loading ? (
            <div className="chart-loading">
              Loading data for GraphicWalker...
            </div>
          ) : data.length > 0 ? (
            (() => {
              const validation = validateDataForGraphicWalker(data);
              const graphicWalkerData = getGraphicWalkerData();

              return (
                <div>
                  {!validation.isValid && (
                    <div className="graphicwalker-warning">
                      <span className="warning-icon">⚠️</span>
                      <span>{validation.reason}</span>
                    </div>
                  )}
                  {validation.suggestions.length > 0 && (
                    <div className="graphicwalker-suggestions">
                      <strong>Suggestions:</strong>
                      <ul>
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="graphicwalker-container">
                    <GraphicWalker
                      dataSource={graphicWalkerData.dataSource}
                      fields={graphicWalkerData.fields}
                      spec={[]}
                      i18nLang="en-US"
                      dark="light"
                      themeKey="vega"
                      storeRef={null}
                    />
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="no-data">No data available for visualization</div>
          )}
        </div>
      )}
    </main>
  );
};

export default Analytics;
