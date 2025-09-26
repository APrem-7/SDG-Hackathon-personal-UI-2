/**
 * Field Mapping Utilities
 * Dynamic field detection and mapping for GraphicWalker
 */

import { analyzeDataStructure } from "./dataAnalysis.js";

/**
 * Dynamically generates GraphicWalker field configuration from data
 * @param {Array} data - The data array
 * @returns {Object} - { dataSource, fields }
 */
export const generateGraphicWalkerFields = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { dataSource: [], fields: [] };
  }

  const analysis = analyzeDataStructure(data);
  const fields = analysis.fields.map((fieldName) => {
    const fieldType = analysis.fieldTypes[fieldName];
    const stats = analysis.fieldStats[fieldName];

    return {
      fid: fieldName,
      name: formatFieldName(fieldName),
      semanticType: mapToSemanticType(fieldType),
      analyticType: mapToAnalyticType(fieldType, stats),
      description: generateFieldDescription(fieldName, fieldType, stats),
    };
  });

  return {
    dataSource: data,
    fields: fields,
  };
};

/**
 * Maps internal field types to GraphicWalker semantic types
 * @param {string} fieldType - Internal field type (quantitative, nominal, temporal, ordinal)
 * @returns {string} - GraphicWalker semantic type
 */
const mapToSemanticType = (fieldType) => {
  switch (fieldType) {
    case "quantitative":
      return "quantitative";
    case "temporal":
      return "temporal";
    case "ordinal":
      return "ordinal";
    case "nominal":
    default:
      return "nominal";
  }
};

/**
 * Maps field types to GraphicWalker analytic types
 * @param {string} fieldType - Internal field type
 * @param {Object} stats - Field statistics
 * @returns {string} - GraphicWalker analytic type (dimension or measure)
 */
const mapToAnalyticType = (fieldType, stats) => {
  // Quantitative fields are typically measures
  if (fieldType === "quantitative") {
    return "measure";
  }

  // All other field types are dimensions
  return "dimension";
};

/**
 * Generates a description for the field
 * @param {string} fieldName - The field name
 * @param {string} fieldType - The field type
 * @param {Object} stats - Field statistics
 * @returns {string} - Field description
 */
const generateFieldDescription = (fieldName, fieldType, stats) => {
  const formattedName = formatFieldName(fieldName);

  switch (fieldType) {
    case "quantitative":
      if (stats.min !== undefined && stats.max !== undefined) {
        return `${formattedName} (Range: ${stats.min.toFixed(
          2
        )} - ${stats.max.toFixed(2)})`;
      }
      return `${formattedName} (Numeric)`;

    case "temporal":
      return `${formattedName} (Date/Time)`;

    case "ordinal":
      if (stats.categories && stats.categories.length > 0) {
        return `${formattedName} (Categories: ${stats.categories
          .slice(0, 3)
          .join(", ")}${stats.categories.length > 3 ? "..." : ""})`;
      }
      return `${formattedName} (Ordered Categories)`;

    case "nominal":
    default:
      if (stats.categories && stats.categories.length > 0) {
        return `${formattedName} (Values: ${stats.categories
          .slice(0, 3)
          .join(", ")}${stats.categories.length > 3 ? "..." : ""})`;
      }
      return `${formattedName} (Text)`;
  }
};

/**
 * Formats field names for display
 * @param {string} fieldName - The raw field name
 * @returns {string} - Formatted field name
 */
const formatFieldName = (fieldName) => {
  if (!fieldName) return "Field";

  return fieldName
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Creates a default GraphicWalker specification based on data analysis
 * @param {Array} data - The data array
 * @returns {Array} - GraphicWalker spec array
 */
export const generateDefaultGraphicWalkerSpec = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const analysis = analyzeDataStructure(data);
  const { quantitativeFields, nominalFields, temporalFields } =
    analysis.analysis;

  // Create a simple default visualization
  if (
    quantitativeFields.length > 0 &&
    (nominalFields.length > 0 || temporalFields.length > 0)
  ) {
    const xField = temporalFields[0] || nominalFields[0];
    const yField = quantitativeFields[0];

    return [
      {
        name: "Auto-generated Chart",
        encodings: {
          x: [xField],
          y: [yField],
          color: nominalFields.length > 1 ? [nominalFields[1]] : [],
        },
        geom: temporalFields.length > 0 ? "line" : "bar",
      },
    ];
  }

  return [];
};

/**
 * Validates if data is suitable for GraphicWalker
 * @param {Array} data - The data array
 * @returns {Object} - { isValid, reason, suggestions }
 */
export const validateDataForGraphicWalker = (data) => {
  if (!data || !Array.isArray(data)) {
    return {
      isValid: false,
      reason: "Data must be an array",
      suggestions: ["Ensure data is properly formatted as an array of objects"],
    };
  }

  if (data.length === 0) {
    return {
      isValid: false,
      reason: "No data available",
      suggestions: ["Fetch data from the API first"],
    };
  }

  if (data.length > 10000) {
    return {
      isValid: true,
      reason: "Large dataset detected",
      suggestions: [
        "Consider filtering data for better performance",
        "GraphicWalker may be slow with large datasets",
      ],
    };
  }

  const analysis = analyzeDataStructure(data);

  if (analysis.fields.length === 0) {
    return {
      isValid: false,
      reason: "No fields detected in data",
      suggestions: ["Ensure data objects have properties"],
    };
  }

  if (analysis.fields.length === 1) {
    return {
      isValid: true,
      reason: "Limited analysis possible with single field",
      suggestions: ["More fields would enable richer visualizations"],
    };
  }

  return {
    isValid: true,
    reason: "Data is suitable for GraphicWalker",
    suggestions: [],
  };
};
