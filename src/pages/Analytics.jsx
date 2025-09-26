import React, { useState, useEffect, useRef } from "react";
import vegaEmbed from "vega-embed";
import axios from "axios";
import { GraphicWalker } from "@kanaries/graphic-walker";

const Analytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [activeView, setActiveView] = useState("charts"); // 'charts' or 'graphicwalker'
  const [queryInput, setQueryInput] = useState("");
  const chartRef = useRef(null);

  // Fetch data from LangChain backend
  const fetchData = async (userQuestion = "Show me all shipment data for analytics") => {
    setLoading(true);
    try {
      const endpoint = "https://langchain-backend.loca.lt/query";
      
      console.log(`Querying LangChain backend: ${endpoint}`);
      console.log(`Question: ${userQuestion}`);
      
      const response = await axios.post(endpoint, {
        question: userQuestion
      }, {
        timeout: 30000, // 30 seconds for AI processing
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      console.log("LangChain AI pipeline response:", response.data);
      
      if (response && response.data) {
        // Handle different response formats from LangChain
        let processedData = [];
        
        if (Array.isArray(response.data)) {
          processedData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          processedData = response.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          processedData = response.data.results;
        } else if (typeof response.data === 'object') {
          processedData = [response.data];
        }
        
        console.log("Processed data:", processedData);
        setData(processedData);
      } else {
        throw new Error("No data received from LangChain backend");
      }
    } catch (error) {
      console.error("LangChain backend query failed:", error);
      console.log("Error details:", error.response?.data || error.message);
      console.log("Falling back to mock data");
      // Fallback to mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data similar to what we'd expect from the API
  const generateMockData = () => {
    const mockData = [];
    const bayCodes = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const shipmentComparts = ["Container1", "Container2", "Bulk", "Liquid"];

    for (let i = 0; i < 50; i++) {
      mockData.push({
        BayCode: bayCodes[Math.floor(Math.random() * bayCodes.length)],
        GrossQuantity: Math.floor(Math.random() * 100) + 10,
        ShipmentID: `S${1000 + i}`,
        FlowRate: Math.random() * 50 + 10,
        BaseProductID: `P${100 + Math.floor(Math.random() * 50)}`,
        ShipmentCompart:
          shipmentComparts[Math.floor(Math.random() * shipmentComparts.length)],
        ExitTime_DayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ][Math.floor(Math.random() * 5)],
        BaseProductCode: Math.floor(Math.random() * 1000) + 100,
        ShipmentCode: Math.floor(Math.random() * 10000) + 1000,
        ExitTime: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        ScheduledDate: new Date(
          Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }
    setData(mockData);
  };

  // Transform data for GraphicWalker
  const getGraphicWalkerData = () => {
    if (!data.length) return { dataSource: [], fields: [] };

    // Define field metadata for GraphicWalker
    const fields = [
      {
        fid: "BayCode",
        name: "Bay Code",
        semanticType: "nominal",
        analyticType: "dimension",
      },
      {
        fid: "ShipmentCompart",
        name: "Shipment Compartment",
        semanticType: "nominal",
        analyticType: "dimension",
      },
      {
        fid: "BaseProductID",
        name: "Base Product ID",
        semanticType: "nominal",
        analyticType: "dimension",
      },
      {
        fid: "ShipmentID",
        name: "Shipment ID",
        semanticType: "nominal",
        analyticType: "dimension",
      },
      {
        fid: "ExitTime_DayOfWeek",
        name: "Exit Day of Week",
        semanticType: "nominal",
        analyticType: "dimension",
      },
      {
        fid: "GrossQuantity",
        name: "Gross Quantity",
        semanticType: "quantitative",
        analyticType: "measure",
      },
      {
        fid: "FlowRate",
        name: "Flow Rate",
        semanticType: "quantitative",
        analyticType: "measure",
      },
      {
        fid: "BaseProductCode",
        name: "Base Product Code",
        semanticType: "quantitative",
        analyticType: "measure",
      },
      {
        fid: "ShipmentCode",
        name: "Shipment Code",
        semanticType: "quantitative",
        analyticType: "measure",
      },
      {
        fid: "ExitTime",
        name: "Exit Time",
        semanticType: "temporal",
        analyticType: "dimension",
      },
      {
        fid: "ScheduledDate",
        name: "Scheduled Date",
        semanticType: "temporal",
        analyticType: "dimension",
      },
    ];

    return {
      dataSource: data,
      fields,
    };
  };

  // Generate AI visualization (bar chart of shipment distribution by bay code)
  const generateAIVisualization = () => {
    if (!data.length) return;

    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      title: "Shipment Distribution by Bay Code",
      data: { values: data },
      mark: "bar",
      encoding: {
        x: { field: "BayCode", type: "nominal", title: "Bay Code" },
        y: {
          aggregate: "sum",
          field: "GrossQuantity",
          type: "quantitative",
          title: "Gross Quantity",
        },
        color: {
          field: "BayCode",
          type: "nominal",
          scale: { scheme: "category10" },
        },
      },
      width: 500,
      height: 300,
    };

    vegaEmbed(chartRef.current, spec, { actions: false })
      .then(() => setAiGenerated(true))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData("Show me a general overview of my shipment data");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data.length > 0) {
      generateAIVisualization();
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle custom query submission
  const handleCustomQuery = async () => {
    if (queryInput.trim()) {
      await fetchData(queryInput);
      setQueryInput(""); // Clear input after query
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCustomQuery();
    }
  };

  // Test API connectivity
  const testAPIConnectivity = async () => {
    setLoading(true);
    try {
      const baseUrl = "https://langchain-backend.loca.lt";
      console.log("Testing LangChain backend connectivity...");

      // Test the query endpoint with a simple question
      const testResponse = await axios.post(`${baseUrl}/query`, {
        question: "Test connection"
      }, { 
        timeout: 10000,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        }
      });
      console.log("LangChain backend is reachable:", testResponse.status);
      console.log("Test response:", testResponse.data);
    } catch (error) {
      console.error("LangChain backend connectivity test failed:", error);
      console.log("Error details:", error.response?.data || error.message);
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
            <span className="ai-badge">AI bar chart generated</span>
            <span className="ai-details">
              X-axis: BayCodeID • Y-axis: GrossQuantity
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

      {/* AI Query Section */}
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
        /* AI-Generated Visualization Section */
        <div className="visualization-section">
          <div className="section-header">
            <h2>AI-Generated Visualization</h2>
            <p>Automatically created based on your query</p>
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
        /* GraphicWalker Section */
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
            <div className="graphicwalker-container">
              <GraphicWalker
                dataSource={getGraphicWalkerData().dataSource}
                fields={getGraphicWalkerData().fields}
                spec={[]}
                i18nLang="en-US"
                dark="light"
                themeKey="vega"
                storeRef={null}
              />
            </div>
          ) : (
            <div className="no-data">No data available for visualization</div>
          )}
        </div>
      )}
    </main>
  );
};

export default Analytics;
