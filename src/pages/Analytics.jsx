import React, { useState, useEffect, useRef } from 'react';
import vegaEmbed from 'vega-embed';
import axios from 'axios';

const Analytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [selectedFields, setSelectedFields] = useState({
    xAxis: '',
    yAxis: '',
    color: '',
    size: '',
    opacity: ''
  });
  const chartRef = useRef(null);
  const customChartRef = useRef(null);

  // Sample field list based on the screenshot
  const fieldList = [
    { name: 'ShipmentCompart', type: 'dimension', icon: '📊' },
    { name: 'BaseProductID', type: 'dimension', icon: '📦' },
    { name: 'ShipmentID', type: 'dimension', icon: '🚚' },
    { name: 'BayCode', type: 'dimension', icon: '🏭' },
    { name: 'ExitTime_DayOfWeek', type: 'dimension', icon: '📅' },
    { name: 'Measure names', type: 'measure', icon: '📏' },
    { name: 'GrossQuantity', type: 'measure', icon: '#' },
    { name: 'FlowRate', type: 'measure', icon: '#' },
    { name: 'BaseProductCode', type: 'measure', icon: '#' },
    { name: 'ShipmentCode', type: 'measure', icon: '#' },
    { name: 'ExitTime', type: 'measure', icon: '#' },
    { name: 'ScheduledDate', type: 'measure', icon: '#' }
  ];

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://langchain-backend.loca.lt/api/shipment-data');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data similar to what we'd expect from the API
  const generateMockData = () => {
    const mockData = [];
    const bayCodes = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    for (let i = 0; i < 50; i++) {
      mockData.push({
        BayCode: bayCodes[Math.floor(Math.random() * bayCodes.length)],
        GrossQuantity: Math.floor(Math.random() * 100) + 10,
        ShipmentID: `S${1000 + i}`,
        FlowRate: Math.random() * 50 + 10,
        BaseProductID: `P${100 + Math.floor(Math.random() * 50)}`,
        ExitTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    setData(mockData);
  };

  // Generate AI visualization (bar chart of shipment distribution by bay code)
  const generateAIVisualization = () => {
    if (!data.length) return;

    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: 'Shipment Distribution by Bay Code',
      data: { values: data },
      mark: 'bar',
      encoding: {
        x: { field: 'BayCode', type: 'nominal', title: 'Bay Code' },
        y: { aggregate: 'sum', field: 'GrossQuantity', type: 'quantitative', title: 'Gross Quantity' },
        color: { field: 'BayCode', type: 'nominal', scale: { scheme: 'category10' } }
      },
      width: 500,
      height: 300
    };

    vegaEmbed(chartRef.current, spec, { actions: false })
      .then(() => setAiGenerated(true))
      .catch(console.error);
  };

  // Generate custom chart based on selected fields
  const generateCustomChart = () => {
    if (!data.length || !selectedFields.xAxis || !selectedFields.yAxis) return;

    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${selectedFields.yAxis} by ${selectedFields.xAxis}`,
      data: { values: data },
      mark: 'circle',
      encoding: {
        x: { field: selectedFields.xAxis, type: 'nominal' },
        y: { field: selectedFields.yAxis, type: 'quantitative' },
        ...(selectedFields.color && { color: { field: selectedFields.color, type: 'nominal' } }),
        ...(selectedFields.size && { size: { field: selectedFields.size, type: 'quantitative' } }),
        ...(selectedFields.opacity && { opacity: { field: selectedFields.opacity, type: 'quantitative' } })
      },
      width: 400,
      height: 300
    };

    vegaEmbed(customChartRef.current, spec, { actions: false }).catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data.length > 0) {
      generateAIVisualization();
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    generateCustomChart();
  }, [selectedFields, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldSelect = (fieldType, fieldName) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldType]: fieldName
    }));
  };

  const handleDragStart = (e, fieldName) => {
    e.dataTransfer.setData('text/plain', fieldName);
  };

  const handleDrop = (e, fieldType) => {
    e.preventDefault();
    const fieldName = e.dataTransfer.getData('text/plain');
    handleFieldSelect(fieldType, fieldName);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <main className="main-content">
      <div className="analytics-header">
        <h1 className="dashboard-title">Advanced Analytics</h1>
        {aiGenerated && (
          <div className="ai-status">
            <span className="ai-badge">AI bar chart generated</span>
            <span className="ai-details">X-axis: BayCodeID • Y-axis: GrossQuantity</span>
          </div>
        )}
      </div>

      <div className="analytics-layout">
        {/* AI-Generated Visualization Section */}
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

        {/* Custom Chart Builder Section */}
        <div className="chart-builder-section">
          <div className="section-header">
            <h2>Custom Chart Builder</h2>
            <p>Drag and drop fields to create custom visualizations</p>
          </div>

          <div className="builder-tabs">
            <button className="tab-button active">📊 Data</button>
            <button className="tab-button">📈 Visualization</button>
          </div>

          <div className="builder-content">
            <div className="builder-layout">
              {/* Field List */}
              <div className="field-list">
                <h3>Field List</h3>
                <div className="field-categories">
                  <div className="field-category">
                    <h4>Dimensions</h4>
                    {fieldList.filter(f => f.type === 'dimension').map((field, index) => (
                      <div
                        key={index}
                        className="field-item dimension"
                        draggable
                        onDragStart={(e) => handleDragStart(e, field.name)}
                      >
                        <span className="field-icon">{field.icon}</span>
                        <span className="field-name">{field.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="field-category">
                    <h4>Measures</h4>
                    {fieldList.filter(f => f.type === 'measure').map((field, index) => (
                      <div
                        key={index}
                        className="field-item measure"
                        draggable
                        onDragStart={(e) => handleDragStart(e, field.name)}
                      >
                        <span className="field-icon">{field.icon}</span>
                        <span className="field-name">{field.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="chart-controls">
                <div className="control-section">
                  <h4>Chart 1:</h4>
                  <button className="new-chart-btn">+ New</button>
                </div>

                <div className="control-groups">
                  <div className="control-group">
                    <label>X-Axis</label>
                    <div
                      className="drop-zone"
                      onDrop={(e) => handleDrop(e, 'xAxis')}
                      onDragOver={handleDragOver}
                    >
                      {selectedFields.xAxis || 'Drop Field Here'}
                    </div>
                  </div>

                  <div className="control-group">
                    <label>Y-Axis</label>
                    <div
                      className="drop-zone"
                      onDrop={(e) => handleDrop(e, 'yAxis')}
                      onDragOver={handleDragOver}
                    >
                      {selectedFields.yAxis || 'Drop Field Here'}
                    </div>
                  </div>

                  <div className="control-group">
                    <label>Color</label>
                    <div
                      className="drop-zone"
                      onDrop={(e) => handleDrop(e, 'color')}
                      onDragOver={handleDragOver}
                    >
                      {selectedFields.color || 'Drop Field Here'}
                    </div>
                  </div>

                  <div className="control-group">
                    <label>Size</label>
                    <div
                      className="drop-zone"
                      onDrop={(e) => handleDrop(e, 'size')}
                      onDragOver={handleDragOver}
                    >
                      {selectedFields.size || 'Drop Field Here'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Chart Display */}
            <div className="custom-chart-container">
              <div ref={customChartRef} className="vega-chart"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Analytics;
