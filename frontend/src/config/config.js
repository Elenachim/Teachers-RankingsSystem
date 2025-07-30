export const API_BASE_URL = 'http://localhost/webengineering_cei326_team3';
export const BACKEND_API_URL = `${API_BASE_URL}/backend/src/controllers`;
export const BACKEND_IMAGES_URL = `${API_BASE_URL}/backend`;
export const BACKEND_ROUTE_URL = 'http://localhost/webengineering_cei326_team3/backend/src/routes/';
export const BACKEND_ROUTES_API = 'http://localhost/webengineering_cei326_team3/backend/src/routes/';
export const FIELDS_FILE_PATH = `${BACKEND_ROUTE_URL}/FieldsRouter.php`;


// API endpoints for Gabriel Simon - DO NOT CHANGE

// API for the base URL
export const BASE_ROOT_URL = 'http://localhost/webengineering_cei326_team3';

// API for the routes
export const ROUTES_API = `${BASE_ROOT_URL}/backend/src/routes`;

// API for tracking
export const TRACK_MYSELF = `${ROUTES_API}/StartTracking.php`;

// API for getting the current ranking
export const GET_MY_CURRENT_RANKING = `${ROUTES_API}/GetTrackedEntries.php`;

// API to clear tracking
export const CLEAR_MY_TRACKING = `${ROUTES_API}/ClearMyTracking.php`;

// API to get the ranking history
export const GET_MY_RANKING_HISTORY = `${ROUTES_API}/GetMyRankingHistory.php`;

// Search API endpoint
export const SEARCH_API = `${BACKEND_ROUTES_API}Search.php`;
