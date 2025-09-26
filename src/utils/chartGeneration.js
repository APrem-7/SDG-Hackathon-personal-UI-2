/**
 * Dynamic Chart Generation Utilities
 * Creates Vega-Lite specifications based on data analysis
 */

import {
  analyzeDataStructure,
  suggestBestFields,
  suggestChartType,
} from "./dataAnalysis.js";

/**
 * Generates a dynamic Vega-Lite chart specification
 * @param {Array} data - The data to visualize
 * @param {string} sqlQuery - The SQL query that generated the data
 * @param {string} userQuestion - The original user question
 * @returns {Object} - Vega-Lite specification
 */
export const generateDynamicChart = (
  data,
  sqlQuery = "",
  userQuestion = ""
) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return createEmptyChart();
  }

  const analysis = analyzeDataStructure(data);
  const { xField, yField, reasoning } = suggestBestFields(analysis);
  const { chartType } = suggestChartType(analysis);

  // Generate title from user question or SQL query
  const title = generateChartTitle(
    userQuestion,
    sqlQuery,
    xField,
    yField,
    chartType
  );

  const baseSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: title,
      fontSize: 16,
      anchor: "start",
      color: "#1e293b",
    },
    data: { values: data },
    width: 600,
    height: 400,
    background: "white",
    config: {
      style: {
        "guide-label": {
          fontSize: 12,
        },
        "guide-title": {
          fontSize: 14,
        },
      },
    },
  };

  // Generate specific chart based on type
  switch (chartType) {
    case "line":
      return createLineChart(baseSpec, analysis, xField, yField);
    case "scatter":
      return createScatterChart(baseSpec, analysis, xField, yField);
    case "pie":
      return createPieChart(baseSpec, analysis, xField);
    case "bar":
    default:
      return createBarChart(baseSpec, analysis, xField, yField);
  }
};

/**
 * Creates a bar chart specification
 */
const createBarChart = (baseSpec, analysis, xField, yField) => {
  const xType = analysis.fieldTypes[xField] || "nominal";
  const yType = analysis.fieldTypes[yField] || "quantitative";

  return {
    ...baseSpec,
    mark: {
      type: "bar",
      cornerRadiusTopLeft: 3,
      cornerRadiusTopRight: 3,
    },
    encoding: {
      x: {
        field: xField,
        type: xType,
        title: formatFieldName(xField),
        axis: { labelAngle: -45 },
      },
      y: {
        field: yField,
        type: yType,
        title: formatFieldName(yField),
        aggregate: yType === "quantitative" ? "sum" : "count",
      },
      color: {
        field: xField,
        type: xType,
        scale: { scheme: "category10" },
        legend: analysis.analysis.nominalFields.length > 10 ? null : true,
      },
      tooltip: [
        { field: xField, type: xType, title: formatFieldName(xField) },
        { field: yField, type: yType, title: formatFieldName(yField) },
      ],
    },
  };
};

/**
 * Creates a line chart specification
 */
const createLineChart = (baseSpec, analysis, xField, yField) => {
  return {
    ...baseSpec,
    mark: {
      type: "line",
      point: true,
      strokeWidth: 3,
    },
    encoding: {
      x: {
        field: xField,
        type: analysis.fieldTypes[xField] || "temporal",
        title: formatFieldName(xField),
      },
      y: {
        field: yField,
        type: analysis.fieldTypes[yField] || "quantitative",
        title: formatFieldName(yField),
      },
      color: {
        value: "#3b82f6",
      },
      tooltip: [
        {
          field: xField,
          type: analysis.fieldTypes[xField],
          title: formatFieldName(xField),
        },
        {
          field: yField,
          type: analysis.fieldTypes[yField],
          title: formatFieldName(yField),
        },
      ],
    },
  };
};

/**
 * Creates a scatter plot specification
 */
const createScatterChart = (baseSpec, analysis, xField, yField) => {
  const colorField =
    analysis.analysis.nominalFields[0] || analysis.analysis.ordinalFields[0];

  return {
    ...baseSpec,
    mark: {
      type: "circle",
      size: 100,
      opacity: 0.7,
    },
    encoding: {
      x: {
        field: xField,
        type: analysis.fieldTypes[xField] || "quantitative",
        title: formatFieldName(xField),
      },
      y: {
        field: yField,
        type: analysis.fieldTypes[yField] || "quantitative",
        title: formatFieldName(yField),
      },
      color: colorField
        ? {
            field: colorField,
            type: analysis.fieldTypes[colorField] || "nominal",
            scale: { scheme: "category10" },
          }
        : { value: "#3b82f6" },
      tooltip: [
        {
          field: xField,
          type: analysis.fieldTypes[xField],
          title: formatFieldName(xField),
        },
        {
          field: yField,
          type: analysis.fieldTypes[yField],
          title: formatFieldName(yField),
        },
        ...(colorField
          ? [
              {
                field: colorField,
                type: analysis.fieldTypes[colorField],
                title: formatFieldName(colorField),
              },
            ]
          : []),
      ],
    },
  };
};

/**
 * Creates a pie chart specification
 */
const createPieChart = (baseSpec, analysis, field) => {
  return {
    ...baseSpec,
    mark: {
      type: "arc",
      innerRadius: 0,
      outerRadius: 120,
    },
    encoding: {
      theta: {
        aggregate: "count",
        type: "quantitative",
      },
      color: {
        field: field,
        type: analysis.fieldTypes[field] || "nominal",
        scale: { scheme: "category10" },
      },
      tooltip: [
        {
          field: field,
          type: analysis.fieldTypes[field],
          title: formatFieldName(field),
        },
        { aggregate: "count", type: "quantitative", title: "Count" },
      ],
    },
  };
};

/**
 * Creates an empty chart for when no data is available
 */
const createEmptyChart = () => {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: "No Data Available",
    width: 600,
    height: 400,
    mark: {
      type: "text",
      text: "No data to display",
      fontSize: 18,
      color: "#64748b",
    },
  };
};

/**
 * Generates a meaningful chart title
 */
const generateChartTitle = (
  userQuestion,
  sqlQuery,
  xField,
  yField,
  chartType
) => {
  if (userQuestion && userQuestion.length > 0) {
    return `${userQuestion} (${chartType} chart)`;
  }

  if (sqlQuery && sqlQuery.length > 0) {
    return `${sqlQuery.substring(0, 50)}... (${chartType} chart)`;
  }

  return `${formatFieldName(yField)} by ${formatFieldName(xField)}`;
};

/**
 * Formats field names for display
 */
const formatFieldName = (fieldName) => {
  if (!fieldName) return "Field";

  return fieldName
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Creates multiple chart suggestions based on the data
 * @param {Array} data - The data to visualize
 * @param {string} sqlQuery - The SQL query
 * @param {string} userQuestion - The user question
 * @returns {Array} - Array of chart specifications
 */
export const generateMultipleChartSuggestions = (
  data,
  sqlQuery = "",
  userQuestion = ""
) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [createEmptyChart()];
  }

  const analysis = analyzeDataStructure(data);
  const suggestions = [];

  // Generate different chart types based on available fields
  if (
    analysis.analysis.temporalFields.length > 0 &&
    analysis.analysis.quantitativeFields.length > 0
  ) {
    suggestions.push(generateDynamicChart(data, sqlQuery, userQuestion));
  }

  if (
    analysis.analysis.nominalFields.length > 0 &&
    analysis.analysis.quantitativeFields.length > 0
  ) {
    const barSpec = generateDynamicChart(data, sqlQuery, userQuestion);
    suggestions.push(barSpec);
  }

  if (analysis.analysis.quantitativeFields.length >= 2) {
    const scatterSpec = generateDynamicChart(data, sqlQuery, userQuestion);
    suggestions.push(scatterSpec);
  }

  return suggestions.length > 0
    ? suggestions
    : [generateDynamicChart(data, sqlQuery, userQuestion)];
};
