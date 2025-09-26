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
