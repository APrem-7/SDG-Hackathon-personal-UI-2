import axios from "axios";

const LANGCHAIN_BASE_URL = "https://langchain-backend.loca.lt";
const DEFAULT_TIMEOUT = 60000; // 60 seconds

export const fetchDataFromLangChain = async (
  userQuestion = "Show me all shipment data for analytics"
) => {
  try {
    console.log(`🔍 Querying LangChain backend: ${LANGCHAIN_BASE_URL}/query`);
    console.log(`❓ Question: ${userQuestion}`);

    const response = await axios.post(
      `${LANGCHAIN_BASE_URL}/query`,
      {
        question: userQuestion,
      },
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log(` LangChain AI pipeline response:`, response.data);

    const result = processLangChainResponse(response.data, userQuestion);

    return {
      ...result,
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(" LangChain backend query failed:", error);
    console.log(" Error details:", error.response?.data || error.message);

    return {
      data: [],
      sqlQuery: "",
      userQuestion,
      success: false,
      error: {
        message: error.message,
        details: error.response?.data,
        status: error.response?.status,
      },
    };
  }
};

/**
 * Processes LangChain response and extracts data and SQL query
 * @param {Object} responseData - Raw response from LangChain backend
 * @param {string} userQuestion - Original user question
 * @returns {Object} - { data, sqlQuery, userQuestion }
 */
const processLangChainResponse = (responseData, userQuestion) => {
  let data = [];
  let sqlQuery = "";

  // Handle the new response format: {"sql query": "...", "data": [...]}
  if (responseData && typeof responseData === "object") {
    // Extract SQL query
    if (
      responseData["sql query"] ||
      responseData.sqlQuery ||
      responseData.query
    ) {
      sqlQuery =
        responseData["sql query"] ||
        responseData.sqlQuery ||
        responseData.query;
    }

    // Extract data array
    if (responseData.data && Array.isArray(responseData.data)) {
      data = responseData.data;
    }
    // Fallback: check if the entire response is an array
    else if (Array.isArray(responseData)) {
      data = responseData;
    }
    // Fallback: check for other common data property names
    else if (responseData.results && Array.isArray(responseData.results)) {
      data = responseData.results;
    }
    // Fallback: wrap single object in array
    else if (typeof responseData === "object" && !Array.isArray(responseData)) {
      data = [responseData];
    }
  }

  console.log(`Processed data: ${data.length} records`);
  console.log(`SQL Query: ${sqlQuery}`);

  return {
    data,
    sqlQuery,
    userQuestion,
  };
};

/**
 * Tests connectivity to LangChain backend
 * @returns {Promise<Object>} - { success, data, error }
 */
export const testLangChainConnectivity = async () => {
  try {
    console.log("Testing LangChain backend connectivity...");

    const testResponse = await axios.post(
      `${LANGCHAIN_BASE_URL}/query`,
      {
        question: "Test connection - return a simple response",
      },
      {
        timeout: 10000, // Shorter timeout for connection test
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("LangChain backend is reachable:", testResponse.status);
    console.log("Test response:", testResponse.data);

    return {
      success: true,
      data: testResponse.data,
      error: null,
      status: testResponse.status,
    };
  } catch (error) {
    console.error("LangChain backend connectivity test failed:", error);
    console.log("Error details:", error.response?.data || error.message);

    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        details: error.response?.data,
        status: error.response?.status,
      },
    };
  }
};

/**
 * Generates mock data for testing when API is unavailable
 * @returns {Object} - { data, sqlQuery, userQuestion }
 */
export const generateMockData = () => {
  console.log("🔄 Generating mock data for testing...");

  const mockData = [];
  const bayCodes = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const truckIds = ["T001", "T002", "T003", "T004", "T005"];
  const shipmentTypes = ["Container", "Bulk", "Liquid", "General"];

  for (let i = 0; i < 50; i++) {
    mockData.push({
      shipment_id: `S${1000 + i}`,
      bay_code: bayCodes[Math.floor(Math.random() * bayCodes.length)],
      truck_id: truckIds[Math.floor(Math.random() * truckIds.length)],
      gross_quantity: Math.floor(Math.random() * 100) + 10,
      flow_rate: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      shipment_type:
        shipmentTypes[Math.floor(Math.random() * shipmentTypes.length)],
      exit_time: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      scheduled_date: new Date(
        Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
      load_time_minutes: Math.floor(Math.random() * 60) + 15,
      status: ["Completed", "In Progress", "Scheduled"][
        Math.floor(Math.random() * 3)
      ],
    });
  }

  return {
    data: mockData,
    sqlQuery: "SELECT * FROM shipments ORDER BY exit_time DESC LIMIT 50",
    userQuestion: "Mock data for testing (API unavailable)",
  };
};

/**
 * Formats API errors for user display
 * @param {Object} error - Error object from API call
 * @returns {string} - User-friendly error message
 */
export const formatAPIError = (error) => {
  if (!error) return "Unknown error occurred";

  if (error.status === 404) {
    return "LangChain backend not found. Please check the server URL.";
  }

  if (error.status === 500) {
    return "LangChain backend server error. Please try again later.";
  }

  if (error.status === 408 || error.message.includes("timeout")) {
    return "Request timed out. The AI is taking longer than expected to process your query.";
  }

  if (error.message.includes("Network Error")) {
    return "Network error. Please check your internet connection.";
  }

  return error.message || "Failed to fetch data from LangChain backend";
};
