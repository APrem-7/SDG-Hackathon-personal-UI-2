/**
 * Data Analysis Utilities
 * Automatically analyzes data structure and determines field types
 */

/**
 * Analyzes the structure of data and determines field types
 * @param {Array} data - Array of data objects
 * @returns {Object} - { fields, fieldTypes, analysis }
 */
export const analyzeDataStructure = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { fields: [], fieldTypes: {}, analysis: { isEmpty: true } };
  }

  const sampleSize = Math.min(10, data.length); // Sample first 10 records for analysis
  const sample = data.slice(0, sampleSize);

  const fields = Object.keys(sample[0] || {});
  const fieldTypes = {};
  const fieldStats = {};

  fields.forEach((field) => {
    const values = sample
      .map((row) => row[field])
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (values.length === 0) {
      fieldTypes[field] = "nominal";
      fieldStats[field] = { type: "empty", uniqueCount: 0 };
      return;
    }

    // Analyze field type
    const analysis = analyzeFieldType(values);
    fieldTypes[field] = analysis.type;
    fieldStats[field] = analysis.stats;
  });

  return {
    fields,
    fieldTypes,
    fieldStats,
    analysis: {
      isEmpty: false,
      recordCount: data.length,
      quantitativeFields: fields.filter(
        (f) => fieldTypes[f] === "quantitative"
      ),
      nominalFields: fields.filter((f) => fieldTypes[f] === "nominal"),
      temporalFields: fields.filter((f) => fieldTypes[f] === "temporal"),
      ordinalFields: fields.filter((f) => fieldTypes[f] === "ordinal"),
    },
  };
};

/**
 * Analyzes individual field type
 * @param {Array} values - Array of field values
 * @returns {Object} - { type, stats }
 */
const analyzeFieldType = (values) => {
  const uniqueValues = [...new Set(values)];
  const uniqueCount = uniqueValues.length;
  const totalCount = values.length;
  const uniqueRatio = uniqueCount / totalCount;

  // Check for temporal data
  if (isTemporalField(values)) {
    return {
      type: "temporal",
      stats: { uniqueCount, totalCount, uniqueRatio },
    };
  }

  // Check for quantitative data
  if (isQuantitativeField(values)) {
    const numericValues = values
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
    return {
      type: "quantitative",
      stats: {
        uniqueCount,
        totalCount,
        uniqueRatio,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
      },
    };
  }

  // Check for ordinal data (few unique values, might be ordered)
  if (uniqueCount <= 20 && uniqueRatio < 0.5) {
    return {
      type: "ordinal",
      stats: { uniqueCount, totalCount, uniqueRatio, categories: uniqueValues },
    };
  }

  // Default to nominal
  return {
    type: "nominal",
    stats: {
      uniqueCount,
      totalCount,
      uniqueRatio,
      categories: uniqueValues.slice(0, 10),
    },
  };
};

/**
 * Checks if field contains temporal data
 */
const isTemporalField = (values) => {
  const sample = values.slice(0, 5);
  return sample.every((value) => {
    if (typeof value === "string") {
      // Check for common date formats\
      const dateFormats = [
        /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
      ];

      return (
        dateFormats.some((format) => format.test(value)) ||
        !isNaN(Date.parse(value))
      );
    }
    return !isNaN(Date.parse(value));
  });
};

/**
 * Checks if field contains quantitative data
 */
const isQuantitativeField = (values) => {
  const sample = values.slice(0, 5);
  return sample.every((value) => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  });
};

/**
 * Suggests the best fields for X and Y axes
 * @param {Object} analysis - Result from analyzeDataStructure
 * @returns {Object} - { xField, yField, reasoning }
 */
export const suggestBestFields = (analysis) => {
  const { quantitativeFields, nominalFields, temporalFields, ordinalFields } =
    analysis.analysis;

  let xField, yField, reasoning;

  // Priority 1: Time series (temporal x, quantitative y)
  if (temporalFields.length > 0 && quantitativeFields.length > 0) {
    xField = temporalFields[0];
    yField = quantitativeFields[0];
    reasoning = "Time series: temporal data over time";
  }
  // Priority 2: Category vs Quantity (nominal/ordinal x, quantitative y)
  else if (
    (nominalFields.length > 0 || ordinalFields.length > 0) &&
    quantitativeFields.length > 0
  ) {
    xField = nominalFields[0] || ordinalFields[0];
    yField = quantitativeFields[0];
    reasoning = "Categorical analysis: categories vs quantities";
  }
  // Priority 3: Correlation (quantitative x, quantitative y)
  else if (quantitativeFields.length >= 2) {
    xField = quantitativeFields[0];
    yField = quantitativeFields[1];
    reasoning = "Correlation analysis: two quantitative variables";
  }
  // Fallback: Use first available fields
  else {
    const allFields = analysis.fields;
    xField = allFields[0];
    yField = allFields[1] || allFields[0];
    reasoning = "Default: using available fields";
  }

  return { xField, yField, reasoning };
};

/**
 * Determines the best chart type based on data analysis
 * @param {Object} analysis - Result from analyzeDataStructure
 * @returns {Object} - { chartType, reasoning }
 */
export const suggestChartType = (analysis) => {
  const { quantitativeFields, nominalFields, temporalFields, ordinalFields } =
    analysis.analysis;

  // Time series data
  if (temporalFields.length > 0 && quantitativeFields.length > 0) {
    return {
      chartType: "line",
      reasoning: "Line chart for time series data",
    };
  }

  // Categorical data with quantities
  if (
    (nominalFields.length > 0 || ordinalFields.length > 0) &&
    quantitativeFields.length > 0
  ) {
    return {
      chartType: "bar",
      reasoning: "Bar chart for categorical analysis",
    };
  }

  // Two quantitative variables
  if (quantitativeFields.length >= 2) {
    return {
      chartType: "scatter",
      reasoning: "Scatter plot for correlation analysis",
    };
  }

  // Single categorical field
  if (nominalFields.length > 0 || ordinalFields.length > 0) {
    return {
      chartType: "pie",
      reasoning: "Pie chart for categorical distribution",
    };
  }

  // Default fallback
  return {
    chartType: "bar",
    reasoning: "Default bar chart",
  };
};

// ==================== TRAFFIC CONTROL TOWER FEATURES ====================

/**
 * 🚚 Traffic Control Tower: Analyzes terminal operations data
 * @param {Array} data - Shipment/terminal data
 * @returns {Object} - Traffic analysis insights
 */
export const analyzeTrafficControlTower = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { isEmpty: true };
  }

  const analysis = analyzeDataStructure(data);
  const fields = analysis.fields;

  // Detect terminal-specific fields
  const laneFields = fields.filter(f => 
    f.toLowerCase().includes('lane') || 
    f.toLowerCase().includes('bay') ||
    f.toLowerCase().includes('dock') ||
    f.toLowerCase().includes('gate')
  );

  const shipmentFields = fields.filter(f =>
    f.toLowerCase().includes('shipment') ||
    f.toLowerCase().includes('ticket') ||
    f.toLowerCase().includes('load') ||
    f.toLowerCase().includes('truck')
  );

  const timeFields = analysis.analysis.temporalFields;

  return {
    isEmpty: false,
    recordCount: data.length,
    
    // Terminal Infrastructure
    laneFields,
    shipmentFields,
    timeFields,
    
    // Traffic Analysis
    laneMetrics: calculateLaneMetrics(data, laneFields),
    congestionAnalysis: analyzeCongestion(data, laneFields, timeFields),
    turnaroundTimes: calculateTurnaroundTimes(data, timeFields),
    stuckShipments: detectStuckShipments(data, shipmentFields, timeFields),
    utilizationScores: calculateUtilizationScores(data, laneFields),
    
    // Real-time Alerts
    alerts: generateTrafficAlerts(data, laneFields, timeFields),
    
    // Performance KPIs
    kpis: calculateTrafficKPIs(data, laneFields, timeFields)
  };
};

/**
 * Calculate metrics per lane/bay
 */
const calculateLaneMetrics = (data, laneFields) => {
  if (laneFields.length === 0) return {};

  const primaryLane = laneFields[0];
  const laneStats = {};

  data.forEach(row => {
    const lane = row[primaryLane];
    if (!lane) return;

    if (!laneStats[lane]) {
      laneStats[lane] = {
        name: lane,
        totalShipments: 0,
        avgWaitTime: 0,
        efficiency: 'A', // Will calculate
        congestionLevel: 'Normal'
      };
    }
    laneStats[lane].totalShipments++;
  });

  return laneStats;
};

/**
 * Analyze lane congestion patterns
 */
const analyzeCongestion = (data, laneFields, timeFields) => {
  if (laneFields.length === 0 || timeFields.length === 0) return {};

  const primaryLane = laneFields[0];
  const primaryTime = timeFields[0];
  const congestionMap = {};

  // Group by hour to detect peak times
  data.forEach(row => {
    const lane = row[primaryLane];
    const timestamp = row[primaryTime];
    
    if (!lane || !timestamp) return;

    const hour = new Date(timestamp).getHours();
    const key = `${lane}_${hour}`;
    
    congestionMap[key] = (congestionMap[key] || 0) + 1;
  });

  // Determine congestion levels
  const congestionLevels = {};
  Object.entries(congestionMap).forEach(([key, count]) => {
    const [lane, hour] = key.split('_');
    if (!congestionLevels[lane]) congestionLevels[lane] = {};
    
    let level = 'Normal';
    if (count > 10) level = 'Heavy';
    else if (count > 5) level = 'Moderate';
    
    congestionLevels[lane][hour] = { count, level };
  });

  return congestionLevels;
};

/**
 * Calculate turnaround times (if start/end times available)
 */
const calculateTurnaroundTimes = (data, timeFields) => {
  if (timeFields.length < 2) return null;

  const startField = timeFields[0];
  const endField = timeFields[1];
  const turnaroundTimes = [];

  data.forEach(row => {
    const startTime = new Date(row[startField]);
    const endTime = new Date(row[endField]);
    
    if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
      const turnaround = (endTime - startTime) / (1000 * 60); // minutes
      turnaroundTimes.push({
        shipmentId: row.shipment_id || row.ticket_id || 'Unknown',
        turnaroundMinutes: turnaround,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
    }
  });

  return {
    avgTurnaround: turnaroundTimes.reduce((sum, t) => sum + t.turnaroundMinutes, 0) / turnaroundTimes.length,
    maxTurnaround: Math.max(...turnaroundTimes.map(t => t.turnaroundMinutes)),
    minTurnaround: Math.min(...turnaroundTimes.map(t => t.turnaroundMinutes)),
    details: turnaroundTimes
  };
};

/**
 * Detect stuck/delayed shipments
 */
const detectStuckShipments = (data, shipmentFields, timeFields) => {
  const STUCK_THRESHOLD_MINUTES = 90; // 1.5 hours
  const stuckShipments = [];

  if (timeFields.length < 2) return stuckShipments;

  const turnaroundData = calculateTurnaroundTimes(data, timeFields);
  if (!turnaroundData) return stuckShipments;

  turnaroundData.details.forEach(shipment => {
    if (shipment.turnaroundMinutes > STUCK_THRESHOLD_MINUTES) {
      stuckShipments.push({
        ...shipment,
        status: 'DELAYED',
        delayMinutes: shipment.turnaroundMinutes - 45, // Assuming 45min is normal
        severity: shipment.turnaroundMinutes > 180 ? 'CRITICAL' : 'WARNING'
      });
    }
  });

  return stuckShipments;
};

/**
 * Calculate lane utilization scores
 */
const calculateUtilizationScores = (data, laneFields) => {
  if (laneFields.length === 0) return {};

  const primaryLane = laneFields[0];
  const laneScores = {};
  const laneCounts = {};

  // Count shipments per lane
  data.forEach(row => {
    const lane = row[primaryLane];
    if (lane) {
      laneCounts[lane] = (laneCounts[lane] || 0) + 1;
    }
  });

  // Calculate scores (A-F grading)
  const maxCount = Math.max(...Object.values(laneCounts));
  Object.entries(laneCounts).forEach(([lane, count]) => {
    const utilization = count / maxCount;
    let grade = 'F';
    if (utilization >= 0.9) grade = 'A';
    else if (utilization >= 0.7) grade = 'B';
    else if (utilization >= 0.5) grade = 'C';
    else if (utilization >= 0.3) grade = 'D';
    
    laneScores[lane] = {
      grade,
      utilization: utilization * 100,
      shipmentCount: count,
      efficiency: utilization >= 0.8 ? 'High' : utilization >= 0.5 ? 'Medium' : 'Low'
    };
  });

  return laneScores;
};

/**
 * Generate real-time traffic alerts
 */
const generateTrafficAlerts = (data, laneFields, timeFields) => {
  const alerts = [];
  
  // Add stuck shipment alerts
  const stuckShipments = detectStuckShipments(data, [], timeFields);
  stuckShipments.forEach(shipment => {
    alerts.push({
      type: 'DELAY',
      severity: shipment.severity,
      message: `⚠️ Shipment ${shipment.shipmentId} delayed for ${Math.round(shipment.delayMinutes)} minutes`,
      timestamp: new Date().toISOString(),
      data: shipment
    });
  });

  // Add congestion alerts
  const congestion = analyzeCongestion(data, laneFields, timeFields);
  Object.entries(congestion).forEach(([lane, hours]) => {
    Object.entries(hours).forEach(([hour, info]) => {
      if (info.level === 'Heavy') {
        alerts.push({
          type: 'CONGESTION',
          severity: 'WARNING',
          message: `🚨 Heavy congestion in ${lane} at ${hour}:00 (${info.count} shipments)`,
          timestamp: new Date().toISOString(),
          data: { lane, hour, count: info.count }
        });
      }
    });
  });

  return alerts;
};

/**
 * Calculate key performance indicators
 */
const calculateTrafficKPIs = (data, laneFields, timeFields) => {
  const totalShipments = data.length;
  const uniqueLanes = laneFields.length > 0 ? 
    [...new Set(data.map(row => row[laneFields[0]]).filter(Boolean))].length : 0;
  
  const turnaroundData = calculateTurnaroundTimes(data, timeFields);
  const avgTurnaround = turnaroundData ? turnaroundData.avgTurnaround : null;
  
  const stuckCount = detectStuckShipments(data, [], timeFields).length;
  const onTimePercentage = totalShipments > 0 ? 
    ((totalShipments - stuckCount) / totalShipments * 100).toFixed(1) : 100;

  return {
    totalShipments,
    activeLanes: uniqueLanes,
    avgTurnaroundMinutes: avgTurnaround ? Math.round(avgTurnaround) : null,
    onTimePercentage: parseFloat(onTimePercentage),
    delayedShipments: stuckCount,
    operationalEfficiency: onTimePercentage > 90 ? 'Excellent' : 
                          onTimePercentage > 80 ? 'Good' : 
                          onTimePercentage > 70 ? 'Fair' : 'Poor'
  };
};
