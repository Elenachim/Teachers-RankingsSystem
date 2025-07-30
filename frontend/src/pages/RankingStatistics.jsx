import React, {useState, useEffect, useRef, useCallback, useMemo,} from "react";
import {Container, Row, Col, Card, Form, Button, Table,} from "react-bootstrap";
import { Bar, Line, Pie } from "react-chartjs-2";
import Header from "../components/header";
import { useNavigate, useLocation } from "react-router-dom";
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend,} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BACKEND_ROUTES_API =
  "http://localhost/webengineering_cei326_team3/backend/src/routes/";

// Field categories definition
const fieldCategories = {
  "Δημοτική Εκπαίδευση": ["Δασκάλων"],
  "Προδημοτική Εκπαίδευση": ["Νηπιαγωγών", "Νηπιαγωγών Α5-Α7"],
  "Ειδική Εκπαίδευση": [
    "Ειδικός Εκπαιδευτικός (Ειδικής Γυμναστικής)",
    "Ειδικός Εκπαιδευτικός (Ειδικών Μαθησιακών, Νοητικών, Λειτουργικών και Προσαρμοστικών Δυσκολιών)",
    "Ειδικός Εκπαιδευτικός (Εκπαιδευτικής Ακουολογίας)",
    "Ειδικός Εκπαιδευτικός (Εργοθεραπείας)",
    "Ειδικός Εκπαιδευτικός (Κωφών)",
    "Ειδικός Εκπαιδευτικός (Λογοθεραπείας)",
    "Ειδικός Εκπαιδευτικός (Μουσικοθεραπείας)",
    "Ειδικός Εκπαιδευτικός (Τυφλών)",
    "Ειδικός Εκπαιδευτικός (Φυσιοθεραπείας)",
  ],
  "Μέση Γενική Εκπαίδευση": [
    "Αγγλικών",
    "Αγωγής Υγείας (Οικιακής Οικονομίας)",
    "Αρμενικής Γλώσσας και Λογοτεχνίας",
    "Βιολογίας",
    "Γαλλικών",
    "Γερμανικών",
    "Γεωγραφίας",
    "Γεωλογίας",
    "Εμπορικών/Οικονομικών",
    "Θεατρολογίας",
    "Θρησκευτικών",
    "Ισπανικών",
    "Ιταλικών",
    "Μαθηματικών",
    "Μουσικής",
    "Πληροφορικής/Επιστήμης Η.Υ.",
    "Ρωσικών",
    "Συμβουλευτικής και Επαγγελματικής Αγωγής",
    "Σχεδιασμού και Τεχνολογίας",
    "Σχεδιασμού και Τεχνολογίας (χωρίς μαθήματα)",
    "Τέχνης",
    "Τουρκικών",
    "Φιλολογικών",
    "Φυσικής",
    "Φυσικής Αγωγής",
    "Φωτογραφικής Τέχνης",
    "Χημείας",
    "Ψυχολογίας",
  ],
  "Μέση Τεχνική Εκπαίδευση": [
    "Αισθητικής",
    "Αργυροχρυσοχοΐας",
    "Γεωπονίας (Γενική)",
    "Γραφικών Τεχνών",
    "Διακοσμητικής",
    "Δομικών (Αρχιτεκτονική)",
    "Δομικών (Πολιτική Μηχανική Κατασκευές)",
    "Ηλεκτρολογίας (Γενική)",
    "Κομμωτικής (Α5-7)",
    "Μηχανικής Αυτοκινήτων",
    "Μηχανικής Ηλεκτρονικών Υπολογιστών",
    "Μηχανολογίας (Γενική)",
    "Ξενοδοχειακών (Μαγειρική)",
    "Ξενοδοχειακών (Τραπεζοκομία) (Α8-10-11)",
    "Ξενοδοχειακών (Τραπεζοκομία) (Α5-7)",
    "Ξυλουργικής-Επιπλοποιίας",
    "Σχεδίασης Επίπλων",
    "Σχεδίασης-Κατασκευής Ενδυμάτων",
  ],
  "Ειδικοί Κατάλογοι για Εκπαιδευτικούς με Αναπηρίες": [
    "Ειδικοί κατάλογοι εκπαιδευτικών με αναπηρίες (όλες οι ειδικότητες)",
  ],
};

const RankingStatistics = () => {
  // Add navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Component-mounted ref to track if component is still mounted
  const isMounted = useRef(true);
  
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: "", // We'll set a real value when years are loaded
    season: "all", 
    type: "all",
    field: "all"
  });
  const [years, setYears] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [types, setTypes] = useState([]);
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [viewByCategory, setViewByCategory] = useState(true);
  const [typeFieldRelationships, setTypeFieldRelationships] = useState({});
  const [initialLoad, setInitialLoad] = useState(true);

  // State for lazy loading tab data
  const [loadedSections, setLoadedSections] = useState({
    overview: false,
    points: false,
    demographics: false,
  });

  // References for caching and request cancellation
  const dataCache = useRef({});
  const abortControllers = useRef({});

  // THIS IS THE KEY CHANGE - Add a cleanup effect that properly aborts ALL requests
  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;
    
    // Return cleanup function
    return () => {
      console.log("Statistics component unmounting - aborting all requests");
      
      // Set isMounted to false to prevent any further state updates
      isMounted.current = false;
      
      // Abort all pending requests stored in abortControllers
      Object.values(abortControllers.current).forEach(controller => {
        if (controller) {
          try {
            controller.abort();
          } catch (err) {
            console.error("Error aborting controller:", err);
          }
        }
      });
      
      // Reset loading state as a safety measure
      setLoading(false);
    };
  }, []);

  // Initial data load - only filter options
  useEffect(() => {
    const loadData = async () => {
      try {
        // Only fetch filter options on initial load, not statistics
        await fetchFilterOptions();
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    loadData();

    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      Object.values(abortControllers.current).forEach((controller) => {
        if (controller) {
          controller.abort();
        }
      });
    };
  }, []);

  // Modify your useEffect that automatically fetches initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch filter options first - make sure this path is correct
        const optionsResponse = await fetch(`${BACKEND_ROUTES_API}getRankingFilters.php`);
        const optionsResult = await optionsResponse.json();
        
        if (optionsResult.success) {
          setYears(optionsResult.years);
          setSeasons(optionsResult.seasons);
          setTypes(optionsResult.types);
          setFields(optionsResult.fields);
          
          // Use "all" as the default filter values
          setFilters({
            year: "all",
            season: "all",
            type: "all",
            field: "all"
          });
          
          // Remove this line to prevent auto-loading of statistics
          // setTimeout(() => fetchStatistics(), 100);
        }
         
        // Add this to set the first year as default if available
        if (optionsResult.years && optionsResult.years.length > 0) {
          setFilters(prev => ({
            ...prev,
            year: optionsResult.years[optionsResult.years.length-1] 
          }));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    
    fetchInitialData();
  }, []);

  // When types or fields are loaded, setup type-field relationships
  useEffect(() => {
    if (types.length > 0 && fields.length > 0) {
      setupTypeFieldRelationships();
    }
  }, [types, fields]);

  // When a type is selected, filter the fields
  useEffect(() => {
    if (filters.type && filters.type !== "all") {
      filterFieldsByType(filters.type);
    } else {
      setFilteredFields(fields);
    }
  }, [filters.type, fields, typeFieldRelationships]);

  const setupTypeFieldRelationships = () => {
    // This is a simplified approach - in a real system you would get this data from the backend
    // For now, we'll hardcode some relationships based on category
    const relationships = {};

    // Mapping types to field categories (in a real app, get this from the backend)
    const typeToCategory = {
      Μόνιμος: [
        "Δημοτική Εκπαίδευση",
        "Προδημοτική Εκπαίδευση",
        "Μέση Γενική Εκπαίδευση",
      ],
      Αντικαταστάτης: [
        "Δημοτική Εκπαίδευση",
        "Προδημοτική Εκπαίδευση",
        "Μέση Γενική Εκπαίδευση",
        "Ειδική Εκπαίδευση",
      ],
      Έκτακτος: ["Μέση Τεχνική Εκπαίδευση", "Μέση Γενική Εκπαίδευση"],
      "Με αναπηρία": ["Ειδικοί Κατάλογοι για Εκπαιδευτικούς με Αναπηρίες"],
    };

    // Build relationships based on the type-category mapping
    types.forEach((type) => {
      const assignedCategories =
        typeToCategory[type] || Object.keys(fieldCategories);
      const fieldsForType = [];

      assignedCategories.forEach((category) => {
        if (fieldCategories[category]) {
          fieldsForType.push(...fieldCategories[category]);
        }
      });

      relationships[type] = fieldsForType;
    });

    console.log("Type-field relationships setup:", relationships);
    setTypeFieldRelationships(relationships);
  };

  const filterFieldsByType = (selectedType) => {
    if (!selectedType || selectedType === "all") {
      setFilteredFields(fields);
      return;
    }
  
    // Get fields applicable to this type
    const applicableFields = typeFieldRelationships[selectedType] || [];
  
    if (applicableFields.length > 0) {
      // Filter to include only fields that are both in our applicableFields list AND in our fields state
      const validFields = fields.filter((field) =>
        applicableFields.includes(field)
      );
      console.log(
        `Filtered ${fields.length} fields to ${validFields.length} for type: ${selectedType}`
      );
      setFilteredFields(validFields);
    } else {
      // If no specific mapping, show all fields
      setFilteredFields(fields);
    }
  };
  

  // Generic fetch function with caching and abort controller
  const fetchData = useCallback(
    async (endpoint, params, section, setter) => {
      // Create cache key from endpoint and params including sampleSize
      const cacheKey = `${endpoint}-${JSON.stringify(params)}`;

      // Check cache first
      if (dataCache.current[cacheKey]) {
        console.log(`Using cached data for ${section}`);
        setter(dataCache.current[cacheKey]);
        return dataCache.current[cacheKey];
      }

      // Cancel previous request for this section if it exists
      if (abortControllers.current[section]) {
        abortControllers.current[section].abort();
      }

      // Create new abort controller
      abortControllers.current[section] = new AbortController();

      try {
        const response = await fetch(`${BACKEND_ROUTES_API}${endpoint}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abortControllers.current[section].signal,
        });

        const result = await response.json();

        // Check if component is still mounted before updating state
        if (isMounted.current) {
          if (result.success) {
            // Cache the result
            dataCache.current[cacheKey] = result.data || result.statistics;
            // Update state
            setter(result.data || result.statistics);
            return result.data || result.statistics;
          } else {
            console.error(`Error in ${section}:`, result.message);
            setError(`Σφάλμα στη φόρτωση ${section}: ${result.message}`);
            return null;
          }
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted.current) {
          console.error(`Error fetching ${section}:`, error);
          setError(`Σφάλμα στη φόρτωση ${section}`);
        }
        return null;
      } 
    },
    []
  ); // Use debounced sample size

  const fetchFilterOptions = async () => {
    try {
      console.log("Fetching filter options...");
      const response = await fetch(
        `${BACKEND_ROUTES_API}getRankingFilters.php`,
        {
          credentials: "include",
        }
      );

      const result = await response.json();
      console.log("Filter options response:", result);

      if (result.success) {
        const yearsData = result.years || [];
        const seasonsData = result.seasons || [];
        const typesData = result.types || [];
        const fieldsData = result.fields || [];

        setYears(yearsData);
        setSeasons(seasonsData);
        setTypes(typesData);
        setFields(fieldsData);
        setFilteredFields(fieldsData);

        // If there's type-field relationship data, store it
        if (result.typeFieldRelationships) {
          console.log(
            "Type-field relationships received:",
            result.typeFieldRelationships
          );
          setTypeFieldRelationships(result.typeFieldRelationships);
        }
      } else {
        console.error("Failed to load filter options:", result.message);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Function to extract filter options from statistics data
  const extractFiltersFromData = () => {
    if (!statistics?.detailedData?.length) return;

    try {
      // Extract unique values
      const uniqueYears = [
        ...new Set(statistics.detailedData.map((item) => item.year)),
      ];
      const uniqueSeasons = [
        ...new Set(statistics.detailedData.map((item) => item.season)),
      ];
      const uniqueTypes = [
        ...new Set(statistics.detailedData.map((item) => item.type)),
      ];
      const uniqueFields = [
        ...new Set(statistics.detailedData.map((item) => item.fields)),
      ];

      console.log("Extracted filters from data:", {
        years: uniqueYears,
        seasons: uniqueSeasons,
        types: uniqueTypes,
        fields: uniqueFields,
      });

      // Use the extracted values
      if (uniqueYears.length) setYears(uniqueYears);
      if (uniqueSeasons.length) setSeasons(uniqueSeasons);
      if (uniqueTypes.length) setTypes(uniqueTypes);
      if (uniqueFields.length) {
        setFields(uniqueFields);
        setFilteredFields(uniqueFields);
      }

      // Also extract type-field relationships
      const typeFieldRelations = {};
      statistics.detailedData.forEach((item) => {
        if (item.type && item.fields) {
          if (!typeFieldRelations[item.type]) {
            typeFieldRelations[item.type] = [];
          }
          if (!typeFieldRelations[item.type].includes(item.fields)) {
            typeFieldRelations[item.type].push(item.fields);
          }
        }
      });

      if (Object.keys(typeFieldRelations).length > 0) {
        setTypeFieldRelationships(typeFieldRelations);
      }
    } catch (err) {
      console.error("Error extracting filters from data:", err);
    }
  };

  // Fetch statistics with basic data and lazy load other data based on tabs
  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    console.log("Fetching statistics with filters:", filters);

    // Reset loaded sections tracking
    setLoadedSections({
      overview: false,
      points: false,
      demographics: false,
    });

    // Add sample size to the API request
    const apiFilters = {
      ...filters,
      dataType: "basic", // Only request basic data initially
    };

    try {
      // Create a specific controller for this request
      const controller = new AbortController();
      abortControllers.current.mainFetch = controller;

      const response = await fetch(
        `${BACKEND_ROUTES_API}getRankingStatistics.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiFilters),
          signal: controller.signal
        }
      );

      const result = await response.json();

      // Check if component is still mounted before updating state
      if (isMounted.current) {
        if (result.success) {
          console.log("Basic statistics received:", result.statistics);
          setStatistics(result.statistics);

          // Mark the overview section as loaded
          setLoadedSections((prev) => ({ ...prev, overview: true }));

          // Load additional data for the current tab
          if (selectedTab !== "overview" && isMounted.current) {
            loadTabData(selectedTab);
          }
        } else {
          setError(result.message || "Αποτυχία φόρτωσης στατιστικών");
        }
      }
    } catch (error) {
      // Only update state if the error is not due to aborted request and component is mounted
      if (error.name !== 'AbortError' && isMounted.current) {
        console.error("Error fetching statistics:", error);
        setError("Παρουσιάστηκε πρόβλημα κατά τη φόρτωση των στατιστικών");
      }
    } finally {
      // Only update loading state if component is mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Function to load tab-specific data on demand
  const loadTabData = async (tab) => {
    // Skip if already loaded
    if (loadedSections[tab]) return;

    try {
      const apiFilters = {
        ...filters,
        dataType: tab,
        fullData: true
      };

      // Create a specific controller for this tab load
      const controller = new AbortController();
      abortControllers.current[`tab_${tab}`] = controller;

      const response = await fetch(
        `${BACKEND_ROUTES_API}getRankingStatistics.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiFilters),
          signal: controller.signal
        }
      );

      const result = await response.json();

      // Check if component is still mounted before updating state
      if (isMounted.current) {
        if (result.success) {
          // Update statistics state by merging new data
          setStatistics((prev) => ({
            ...prev,
            ...(result.statistics || {}),
          }));

          // Mark this section as loaded
          setLoadedSections((prev) => ({ ...prev, [tab]: true }));
        } else {
          console.error(`Error loading ${tab} data:`, result.message);
        }
      }
    } catch (error) {
      // Only update state if the error is not due to aborted request and component is mounted
      if (error.name !== 'AbortError' && isMounted.current) {
        console.error(`Error loading ${tab} data:`, error);
      }
    } 
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);

    // Load data for this tab if not already loaded and if we have statistics
    if (!loadedSections[tab] && statistics) {
      loadTabData(tab);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "type") {
      // When type changes, update filters
      const newFilters = {
        ...filters,
        [name]: value,
      };
  
      // If type changes to "all", don't reset field
      // If type changes to specific value, check if field needs to be reset
      if (value !== "all") {
        const applicableFields = typeFieldRelationships[value] || [];
        if (
          filters.field !== "all" &&
          !applicableFields.includes(filters.field)
        ) {
          newFilters.field = "all"; // Reset to "all" if current field is not compatible
        }
      }
  
      setFilters(newFilters);
    } else {
      setFilters({
        ...filters,
        [name]: value,
      });
    }
  };
  

  const applyFilters = (e) => {
    e.preventDefault();
  
    // Set initialLoad to false when filters are applied
    setInitialLoad(false);
  
    // Show loading indicator
    setLoading(true);
    setError(null);
  
    // Debug log to see what filters are being applied
    console.log("Applying filters:", filters);
  
    // If all filters are set to 'all', force a reload of all sections
    if (filters.year === 'all' && filters.season === 'all' && 
        filters.type === 'all' && filters.field === 'all') {
      console.log("All filters set to 'all', forcing reload of all sections");
      
      // Force reload of all sections
      setLoadedSections({
        overview: false,
        points: false,
        demographics: false
      });
    }
  
    // Invalidate cache when filters change
    dataCache.current = {};
  
    // Fetch statistics based on filters
    fetchStatistics();
  };
  

  // Helper function to find category for a field
  const getCategoryForField = (field) => {
    for (const [category, fields] of Object.entries(fieldCategories)) {
      if (fields.includes(field)) {
        return category;
      }
    }
    return "Άλλοι Κλάδοι";
  };

  // Memoize chart data to prevent recalculations
  const pointsDistributionData = useMemo(() => {
    if (!statistics?.pointsDistribution) return null;

    return {
      labels: statistics.pointsDistribution.labels,
      datasets: [
        {
          label: "Αριθμός Αιτητών",
          data: statistics.pointsDistribution.data,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [statistics?.pointsDistribution]);

  const experienceDistributionData = useMemo(() => {
    if (!statistics?.experienceDistribution) return null;

    return {
      labels: statistics.experienceDistribution.labels,
      datasets: [
        {
          label: "Μέσος Όρος Μονάδων",
          data: statistics.experienceDistribution.data,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [statistics?.experienceDistribution]);

  // Generate field distribution data potentially grouping by category
  const fieldDistributionData = useMemo(() => {
    if (!statistics?.fieldDistribution) return null;

    if (viewByCategory && statistics.fieldDistribution.labels.length > 0) {
      const categoryCounts = {};

      // Sum up counts by category
      statistics.fieldDistribution.labels.forEach((field, index) => {
        const category = getCategoryForField(field);
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
        }
        categoryCounts[category] += statistics.fieldDistribution.data[index];
      });

      return {
        labels: Object.keys(categoryCounts),
        datasets: [
          {
            label: "Αριθμός Αιτητών ανά Κατηγορία",
            data: Object.values(categoryCounts),
            backgroundColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 0,
          },
        ],
      };
    } else {
      return {
        labels: statistics.fieldDistribution.labels,
        datasets: [
          {
            label: "Αριθμός Αιτητών",
            data: statistics.fieldDistribution.data,
            backgroundColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
            ],
            borderWidth: 0,
          },
        ],
      };
    }
  }, [statistics?.fieldDistribution, viewByCategory]);

  // Options for charts
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Κατανομή Μονάδων",
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Εμπειρία και Μονάδες",
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,  // Set to false to hide the legend
      },
      title: {
        display: true,
        text: viewByCategory ? "Κατανομή ανά Κατηγορία" : "Κατανομή ανά Κλάδο",
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      // Add tooltips to show labels since legend is hidden
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart._metasets[context.datasetIndex].total;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Group fields by category for the select dropdown
  const categorizedFields = useMemo(() => {
    return filteredFields.reduce((acc, field) => {
      let found = false;
      for (const [category, categoryFields] of Object.entries(
        fieldCategories
      )) {
        if (categoryFields.includes(field)) {
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(field);
          found = true;
          break;
        }
      }
      if (!found) {
        if (!acc["Άλλοι Κλάδοι"]) {
          acc["Άλλοι Κλάδοι"] = [];
        }
        acc["Άλλοι Κλάδοι"].push(field);
      }
      return acc;
    }, {});
  }, [filteredFields]);

  useEffect(() => {
    if (statistics) {
      console.log("Received statistics data:", statistics);
      
      // Add this to check the field distribution data specifically
      if (statistics.fieldDistribution) {
        console.log("Field distribution data:", statistics.fieldDistribution);
      }
    }
  }, [statistics]);

  // Add this near your other useEffect hooks
  useEffect(() => {
    if (statistics?.ageDistribution || statistics?.registrationTimeline) {
      // Log total counts for debugging
      let totalAgeCount = 0;
      let totalRegistrationCount = 0;
      
      if (statistics.ageDistribution?.data) {
        totalAgeCount = statistics.ageDistribution.data.reduce((sum, count) => sum + count, 0);
        console.log("Total count in age distribution:", totalAgeCount);
      }
      
      if (statistics.registrationTimeline?.data) {
        totalRegistrationCount = statistics.registrationTimeline.data.reduce((sum, count) => sum + count, 0);
        console.log("Total count in registration timeline:", totalRegistrationCount);
      }
      
      // If we have too few people, log a warning
      if ((totalAgeCount > 0 && totalAgeCount < 1000) || (totalRegistrationCount > 0 && totalRegistrationCount < 1000)) {
        console.warn("Demographic data appears to be showing too few people compared to expected count");
      }
    }
  }, [statistics?.ageDistribution, statistics?.registrationTimeline]);

  // In RankingStatistics.jsx
const uniqueTopApplicants = useMemo(() => {
  if (!statistics?.topApplicants || statistics.topApplicants.length === 0) {
    console.log("No top applicants data found");
    return [];
  }
  
  console.log("Top applicants data:", statistics.topApplicants);
  
  // Return the top applicants directly - the backend now ensures they're unique
  return statistics.topApplicants;
}, [statistics?.topApplicants]);

  return (
    <>
      <Header />
      <Container className="py-4">
        <h2 className="mb-4">Στατιστικά Κατάταξης</h2>

        {/* Filter Form */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h5 className="mb-3">Φίλτρα Δεδομένων</h5>
            <Form onSubmit={applyFilters}>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Έτος</Form.Label>
                    <Form.Select
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                      required
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Περίοδος</Form.Label>
                    <Form.Select
                      name="season"
                      value={filters.season}
                      onChange={handleFilterChange}
                    >
                      <option value="all">Όλες οι Περίοδοι</option>
                      {seasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Τύπος</Form.Label>
                    <Form.Select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                    >
                      <option value="all">Όλοι οι Τύποι</option>
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Κλάδος</Form.Label>
                    <Form.Select
                      name="field"
                      value={filters.field}
                      onChange={handleFilterChange}
                    >
                      <option value="all">Όλοι οι Κλάδοι</option>
                      {filters.type !== "all"
                        ? // Show categorized fields filtered by type
                          Object.entries(categorizedFields).map(
                            ([category, fields]) =>
                              fields.length > 0 ? (
                                <optgroup key={category} label={category}>
                                  {fields.map((field) => (
                                    <option key={field} value={field}>
                                      {field}
                                    </option>
                                  ))}
                                </optgroup>
                              ) : null
                          )
                        : // Show all fields categorized when no type is selected
                          Object.entries(fieldCategories).map(
                            ([category, categoryFields]) => (
                              <optgroup key={category} label={category}>
                                {categoryFields
                                  .filter((field) => fields.includes(field))
                                  .map((field) => (
                                    <option key={field} value={field}>
                                      {field}
                                    </option>
                                  ))}
                              </optgroup>
                            )
                          )}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12} className="text-end">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Φόρτωση...
                      </>
                    ) : (
                      "Εφαρμογή Φίλτρων"
                    )}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Tab Navigation */}
        <div className="mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  selectedTab === "overview" ? "active" : ""
                }`}
                onClick={() => handleTabSelect("overview")}
              >
                Επισκόπηση
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  selectedTab === "points" ? "active" : ""
                }`}
                onClick={() => handleTabSelect("points")}
              >
                Ανάλυση Μονάδων
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  selectedTab === "demographics" ? "active" : ""
                }`}
                onClick={() => handleTabSelect("demographics")}
              >
                Δημογραφικά
              </button>
            </li>
          </ul>
        </div>

        {/* Content based on selected tab */}
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Φόρτωση...</span>
            </div>
            <p className="mt-3">Φόρτωση δεδομένων...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : statistics ? (
          <>
            {/* Overview Tab */}
            {selectedTab === "overview" && (
              <Row className="g-4">
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <h5 className="mb-3">Βασικά Στατιστικά</h5>
                      <Table striped bordered hover>
                        <tbody>
                          <tr>
                            <th>Σύνολο Αιτητών</th>
                            <td>{statistics.totalApplicants || 0}</td>
                          </tr>
                          <tr>
                            <th>Μέσος Όρος Μονάδων</th>
                            <td>
                              {statistics.averagePoints?.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                          <tr>
                            <th>Μέγιστες Μονάδες</th>
                            <td>
                              {statistics.maxPoints?.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                          <tr>
                            <th>Μέση Εμπειρία</th>
                            <td>
                              {statistics.averageExperience?.toFixed(2) ||
                                "0.00"}{" "}
                              χρόνια
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                          {viewByCategory
                            ? "Κατανομή ανά Κατηγορία"
                            : "Κατανομή ανά Κλάδο"}
                        </h5>
                        <Form.Check
                          type="switch"
                          id="category-switch"
                          label="Προβολή ανά Κατηγορία"
                          checked={viewByCategory}
                          onChange={(e) => setViewByCategory(e.target.checked)}
                        />
                      </div>
                      {fieldDistributionData ? (
                        <Pie
                          data={fieldDistributionData}
                          options={pieOptions}
                        />
                      ) : (
                        <div className="text-center py-5">
                          <div
                            className="spinner-border text-secondary"
                            role="status"
                          >
                            <span className="visually-hidden">Φόρτωση...</span>
                          </div>
                          <p className="mt-2">Φόρτωση γραφήματος...</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <h5 className="mb-3">Κατανομή Μονάδων</h5>
                      {pointsDistributionData ? (
                        <Bar
                          data={pointsDistributionData}
                          options={barOptions}
                        />
                      ) : (
                        <div className="text-center py-5">
                          <div
                            className="spinner-border text-secondary"
                            role="status"
                          >
                            <span className="visually-hidden">Φόρτωση...</span>
                          </div>
                          <p className="mt-2">Φόρτωση γραφήματος...</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Points Analysis Tab */}
            {selectedTab === "points" && !loadedSections.points ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">
                    Φόρτωση δεδομένων ανάλυσης...
                  </span>
                </div>
                <p className="mt-2">Φόρτωση δεδομένων ανάλυσης...</p>
              </div>
            ) : (
              selectedTab === "points" && (
                <Row className="g-4">
                  <Col md={12}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Εμπειρία και Μονάδες</h5>
                        {experienceDistributionData ? (
                          <Line
                            data={experienceDistributionData}
                            options={lineOptions}
                          />
                        ) : (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-secondary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Φόρτωση...
                              </span>
                            </div>
                            <p className="mt-2">Φόρτωση γραφήματος...</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Κορυφαίοι 5 Αιτητές</h5>
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Κατάταξη</th>
                              <th>Όνομα</th>
                              <th>Μονάδες</th>
                              <th>Εμπειρία</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueTopApplicants.map((person, index) => (
                              <tr key={index}>
                                <td>{person.ranking}</td>
                                <td>{person.fullname}</td>
                                <td>{person.points?.toFixed(2) || "0.00"}</td>
                                <td>{person.experience || "0"} χρόνια</td>
                              </tr>
                            ))}
                            {uniqueTopApplicants.length === 0 && (
                              <tr>
                                <td colSpan="4" className="text-center">
                                  Δεν βρέθηκαν αιτητές
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Ανάλυση Μονάδων</h5>
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Συστατικό</th>
                              <th>Μέσος Όρος</th>
                              <th>Μέγιστο</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Βαθμός Τίτλου</td>
                              <td>
                                {statistics.averageTitleGrade?.toFixed(2) ||
                                  "0.00"}
                              </td>
                              <td>{statistics.maxTitleGrade || "0"}</td>
                            </tr>
                            <tr>
                              <td>Εμπειρία</td>
                              <td>
                                {statistics.averageExperience?.toFixed(2) ||
                                  "0.00"}
                              </td>
                              <td>{statistics.maxExperience || "0"}</td>
                            </tr>
                            <tr>
                              <td>Επιπλέον Προσόντα</td>
                              <td>
                                {statistics.averageExtraQuals?.toFixed(2) ||
                                  "0.00"}
                              </td>
                              <td>{statistics.maxExtraQuals || "0"}</td>
                            </tr>
                            <tr>
                              <td>Στρατιωτική Θητεία</td>
                              <td>
                                {statistics.averageArmy?.toFixed(2) || "0.00"}
                              </td>
                              <td>{statistics.maxArmy || "0"}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )
            )}

            {/* Demographics Tab */}
            {selectedTab === "demographics" && !loadedSections.demographics ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">
                    Φόρτωση δημογραφικών δεδομένων...
                  </span>
                </div>
                <p className="mt-2">Φόρτωση δημογραφικών δεδομένων...</p>
              </div>
            ) : (
              selectedTab === "demographics" && (
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Κατανομή Ηλικιών</h5>
                        {statistics.ageDistribution ? (
                          <div style={{ height: "350px" }}>
                            <Bar
                              data={{
                                labels: statistics.ageDistribution.labels,
                                datasets: [
                                  {
                                    label: "Αριθμός Αιτητών",
                                    data: statistics.ageDistribution.data,
                                    backgroundColor: "rgba(75, 192, 192, 0.5)",
                                    borderColor: "rgba(75, 192, 192, 1)",
                                    borderWidth: 1,
                                  }
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  title: {
                                    display: true,
                                    text: 'Κατανομή Ηλικιών',
                                    font: {
                                      size: 16,
                                      weight: 'bold'
                                    }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      title: function(tooltipItems) {
                                        return `Ηλικία: ${tooltipItems[0].label}`;
                                      },
                                      label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                          label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                          label += context.parsed.y.toLocaleString('el-GR');
                                        }
                                        return label;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function(value) {
                                        return value.toLocaleString('el-GR');
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-secondary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Φόρτωση...
                              </span>
                            </div>
                            <p className="mt-2">Φόρτωση γραφήματος...</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Χρονολόγιο Εγγραφών</h5>
                        {statistics.registrationTimeline ? (
                          <div style={{ height: "350px" }}>
                            <Line
                              data={{
                                labels: statistics.registrationTimeline.labels,
                                datasets: [
                                  {
                                    label: "Νέες Εγγραφές",
                                    data: statistics.registrationTimeline.data,
                                    borderColor: "rgba(153, 102, 255, 1)",
                                    backgroundColor: "rgba(153, 102, 255, 0.2)",
                                    borderWidth: 2,
                                    fill: true,
                                    tension: 0.1
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  title: {
                                    display: true,
                                    text: 'Χρονολόγιο Εγγραφών',
                                    font: {
                                      size: 16,
                                      weight: 'bold'
                                    }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                          label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                          label += context.parsed.y.toLocaleString('el-GR');
                                        }
                                        return label;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function(value) {
                                        return value.toLocaleString('el-GR');
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-secondary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Φόρτωση...
                              </span>
                            </div>
                            <p className="mt-2">Φόρτωση γραφήματος...</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={12}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5 className="mb-3">Κατανομή ανά Τύπο & Κλάδο</h5>
                        {statistics.typeFieldMatrix ? (
                          <Table striped bordered hover responsive>
                            <thead>
                              <tr>
                                <th>Κλάδος</th>
                                {statistics.typeFieldMatrix?.types?.map(
                                  (type) => (
                                    <th key={type}>{type}</th>
                                  )
                                )}
                                <th>Σύνολο</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statistics.typeFieldMatrix?.data?.map(
                                (row, index) => {
                                  // Convert fields object to array if necessary
                                  let fieldsArray = [];
                                  if (
                                    typeof statistics.typeFieldMatrix.fields ===
                                      "object" &&
                                    !Array.isArray(
                                      statistics.typeFieldMatrix.fields
                                    )
                                  ) {
                                    // Handle the case where fields is an object with numeric keys like {"0": "Field1", "12": "Field2"}
                                    const keys = Object.keys(
                                      statistics.typeFieldMatrix.fields
                                    );
                                    // Try to find the key that corresponds to this index
                                    // First exact match, then try numeric equivalence
                                    const exactKey = keys.find(
                                      (key) => parseInt(key) === index
                                    );
                                    const keyForIndex =
                                      exactKey !== undefined
                                        ? exactKey
                                        : keys.length > index
                                        ? keys[index]
                                        : null;

                                    if (keyForIndex) {
                                      fieldsArray[index] =
                                        statistics.typeFieldMatrix.fields[
                                          keyForIndex
                                        ];
                                    }
                                  } else if (
                                    Array.isArray(
                                      statistics.typeFieldMatrix.fields
                                    )
                                  ) {
                                    // If fields is already an array, use it directly
                                    fieldsArray =
                                      statistics.typeFieldMatrix.fields;
                                  }

                                  // Get field name for this row
                                  const fieldName =
                                    fieldsArray[index] ||
                                    (typeof statistics.typeFieldMatrix
                                      .fields === "object"
                                      ? statistics.typeFieldMatrix.fields[index]
                                      : null);

                                  return (
                                    <tr key={index}>
                                      <td>
                                        {(() => {
                                          // Debug what's being shown
                                          console.log(`Field lookup for row ${index}:`, {
                                            fieldName,
                                            fieldsArray,
                                            fieldsFromObject: statistics.typeFieldMatrix.fields[index],
                                            fieldsIndex: fields[index]
                                          });
                                          
                                          // If we're filtering by a specific field, use that field name
                                          if (filters.field !== 'all') {
                                            return filters.field;
                                          }
                                          
                                          // Otherwise, try to get the field name from the data
                                          return fieldName || 
                                                 (typeof statistics.typeFieldMatrix.fields === "object" ? statistics.typeFieldMatrix.fields[index] : null) || 
                                                 fields[index] || 
                                                 `Κλάδος ${index + 1}`;
                                        })()}
                                      </td>
                                      {row.map((count, i) => (
                                        <td key={i}>
                                          {count !== null && count !== undefined
                                            ? count
                                            : 0}
                                        </td>
                                      ))}
                                      <td>
                                        <strong>
                                          {row.reduce(
                                            (a, b) => a + (b || 0),
                                            0
                                          )}
                                        </strong>
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                              {/* Add totals row */}
                              {statistics.typeFieldMatrix?.data?.length > 0 && (
                                <tr className="table-secondary">
                                  <td>
                                    <strong>Σύνολο</strong>
                                  </td>
                                  {statistics.typeFieldMatrix?.types?.map(
                                    (_, colIndex) => (
                                      <td key={colIndex}>
                                        <strong>
                                          {statistics.typeFieldMatrix.data.reduce(
                                            (sum, row) =>
                                              sum + (row[colIndex] || 0),
                                            0
                                          )}
                                        </strong>
                                      </td>
                                    )
                                  )}
                                  <td>
                                    <strong>
                                      {statistics.typeFieldMatrix.data.reduce(
                                        (total, row) =>
                                          total +
                                          row.reduce((a, b) => a + (b || 0), 0),
                                        0
                                      )}
                                    </strong>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        ) : (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-secondary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Φόρτωση...
                              </span>
                            </div>
                            <p className="mt-2">Φόρτωση δεδομένων πίνακα...</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )
            )}
          </>
        ) : initialLoad ? (
          <div className="alert alert-info text-center p-4">
            <i
              className="bi bi-info-circle-fill me-2"
              style={{ fontSize: "1.5rem" }}
            ></i>
            <div className="mt-2">
              <h5>Καλωσήρθατε στα Στατιστικά Κατάταξης</h5>
              <p>
                Επιλέξτε φίλτρα και πατήστε "Εφαρμογή Φίλτρων" για να δείτε τα
                στατιστικά. Δεν θα φορτωθούν δεδομένα μέχρι να πατήσετε το κουμπί.
              </p>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Δεν βρέθηκαν αποτελέσματα. Παρακαλώ δοκιμάστε διαφορετικά κριτήρια
            αναζήτησης.
          </div>
        )}
      </Container>
    </>
  );
};

export default RankingStatistics;
