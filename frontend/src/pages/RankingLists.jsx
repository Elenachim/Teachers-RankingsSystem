import React, { useState, useEffect } from "react";
import Header from "../components/header";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { BACKEND_ROUTES_API } from "../config/config";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/footer";

function RankingLists() {
  //Transform date to string and cut it at the T(time) to get only the date
  const currentDate = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState({
    year: "all",
    season: "all",
    type: "all",
    field: "all",
    name: location.state?.search || "",
    // Each browser shows default date in different format, so we set it to current date and pass it into backend with the right format
     birthDate: currentDate,
      titleDate: currentDate,
  });
const getSeasonOrder = (season) => {
  const seasonOrder = {
    'Ιούνιος': 1,
    'Φεβρουάριος': 2
  };
  return seasonOrder[season] || 999;
};
// Navigation state effect - handles search params from URL
//User searches from homepage → redirects to ranking list with search term
useEffect(() => {
  // Check if we have search parameters from navigation
  if (location.state && location.state.search && filters.name !== location.state.search) {
    // Update filters with the search term from location state
    const updatedFilters = { ...filters, name: location.state.search };
    setFilters(updatedFilters);
    // Call fetchUsers with updated filters
    fetchUsers(updatedFilters);
    // Clear location.state so that this effect is not triggered again
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);

  const [years, setYears] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [types, setTypes] = useState([]);
  const [fields, setFields] = useState([]);
  // Added isLoading to fix the error referencing setIsLoading
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState([]); //Users Info
  const [pageSize, setPageSize] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState(null);
  const [isFilter, setIsFilter] = useState(false);
  const [callFetchusers, setCallFetchusers] = useState(false);
  const [sortModel, setSortModel] = useState([
  { field: 'year', sort: 'desc' },
  { field: 'season', sort: 'desc' }
]);




  // Updated clear filters to set date fields as "dd/mm/yyyy"
  const handleClearFilters = () => {
    setFilters({
      year: "all",
      season: "all",
      type: "all",
      field: "all",
      name: "",
     birthDate: currentDate,
    titleDate: currentDate, 
    });
    setCallFetchusers(!callFetchusers);
};

  useEffect(() => {
    if (callFetchusers) {
      fetchUsers();
    }
  }, [callFetchusers]);

  // Define columns based on your fields
  const columns = [
    { field: "ranking", headerName: "Κατάταξη", width: 100 },
    { field: "year", headerName: "Έτος", width: 100 },
    { field: "season", headerName: "Περίοδος", width: 120 },
    { field: "listname", headerName: "Λίστα", width: 100 },
    { field: "fullname", headerName: "Ονοματεπώνυμο", width: 100 },
    { field: "appnum", headerName: "Κωδικός Αίτησης", width: 100 },
    { field: "points", headerName: "Σύνολο Μονάδων", width: 100 },
    {
      field: "titledate",
      headerName: "Ημερομηνία Τίτλου",
      width: 130,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    { field: "titlegrade", headerName: "Βαθμός Τίτλου", width: 100 },
    {
      field: "extraqualifications",
      headerName: "Πρόσθετα Προσόντα",
      width: 100,
    },
    { field: "experience", headerName: "Εμπειρία", width: 100 },
    { field: "army", headerName: "Εθνική Φρουρά", width: 100 },
    {
      field: "registrationdate",
      headerName: "Ημερομηνία Αίτησης",
      width: 100,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    {
      field: "birthdaydate",
      headerName: "Ημερομηνία Γέννησης",
      width: 100,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    { field: "notes", headerName: "Σημειώσεις", width: 100 },
  ];



  useEffect(() => {
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
        setYears(result.years || []);
        // Sort seasons by order (most recent first)
        const sortedSeasons = (result.seasons || []).sort((a, b) => {
          return getSeasonOrder(a) - getSeasonOrder(b);
        });
        setSeasons(sortedSeasons);
        setTypes(result.types || []);
        setFields(result.fields || []);
      } else {
        console.error("Failed to load filter options:", result.message);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  fetchFilterOptions();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchUsers();
  };
//customFilters is used to pass filters from the filter form
  const fetchUsers = async (customFilters = null) => {
  try {
    setIsLoading(true);
    const currentFilters = customFilters || filters;
    
    // Clear date fields if they hold the invalid value
    const birthDate = currentFilters.birthDate === currentDate ? "" : currentFilters.birthDate;
    const titleDate = currentFilters.titleDate === currentDate ? "" : currentFilters.titleDate;

    const sortParams = sortModel.map(sort => 
      `sort=${sort.field}&order=${sort.sort}`
    ).join('&');
    
    const response = await fetch(
      `${BACKEND_ROUTES_API}FetchApplicants.php?page=${page}&pageSize=${pageSize}&year=${currentFilters.year}&season=${currentFilters.season}&type=${currentFilters.type}&field=${currentFilters.field}&name=${currentFilters.name}&birthDate=${birthDate}&titleDate=${titleDate}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    
    const data = await response.json();
    console.log("Users response:", data);

      if (data.success) {
         const sortedUsers = data.user.applicants
        .sort((a, b) => {
          // First sort by year descending
          if (b.year !== a.year) {
            return b.year - a.year;
          }
          // Then sort by season order
          return getSeasonOrder(a.season) - getSeasonOrder(b.season);
        });

        setUsers(
           sortedUsers.map((user) => ({
            id: user.id,
            year: user.year,
            season: user.season,
            listname: user.fields,
            ranking: user.ranking,
            fullname: user.fullname,
            appnum: user.appnum,
            points: user.points,
            titledate: user.titledate,
            titlegrade: user.titlegrade,
            extraqualifications: user.extraqualifications,
            experience: user.experience,
            army: user.army,
            registrationdate: user.registrationdate,
            birthdaydate: user.birthdaydate,
            notes: user.notes,
          }))
        );

      setTotalUsers(data.user.total);
      if (isFilter) {
        setPage(1); // Reset page when filtering
      }
//navigate to the same page with updated filters
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <>
      <Header />
      <div className="container py-4">
        <h2 className="mb-4">Λίστα Κατάταξης</h2>

        {/* Filter Form */}

        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">Φίλτρα Δεδομένων</h5>
            <form onSubmit={handleSubmit}>
              {/* Add align-items-end to vertically align the filter elements */}
              <div className="row g-3 align-items-end">
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Έτος </label>
                    <select
                      className="form-select"
                      name="year"
                      value={filters.year}
                      onChange={(e) =>
                        setFilters({ ...filters, year: e.target.value })
                      }
                    >
                      <option value="all">Όλα τα Έτη</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Περίοδος </label>
                    <select
                      className="form-select"
                      name="season"
                      value={filters.season}
                      onChange={(e) =>
                        setFilters({ ...filters, season: e.target.value })
                      }
                    >
                      <option value="all">Όλες οι Περίοδοι</option>
                      {seasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Τύπος </label>
                    <select
                      className="form-select"
                      name="type"
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                    >
                      <option value="all">Όλοι οι Τύποι</option>
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Κλάδος </label>
                    <select
                      className="form-select"
                      name="field"
                      value={filters.field}
                      onChange={(e) =>
                        setFilters({ ...filters, field: e.target.value })
                      }
                    >
                      <option value="all">Όλοι οι Κλάδοι</option>
                      {fields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="row g-3 mt-2 align-items-end">
                <div className="col-12 col-md-4 ">
                  <div className="mb-3">
                    <label className="form-label">Όνομα (Προαιρετικό)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={filters.name}
                      placeholder="Εισάγετε το επώνυμο, όνομα, πατρώνυμο"
                      onChange={(e) =>
                        setFilters({ ...filters, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      Ημερομηνία Γέννησης (Προαιρετικό)
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="birthDate"
                      value={filters.birthDate}
                      onChange={(e) =>
                        setFilters({ ...filters, birthDate: e.target.value })
                      }
                     style={filters.birthDate === currentDate ? { color: "gray" } : {} }

                    />
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      Ημερομηνία Τίτλου (Προαιρετικό)
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="titleDate"
                      value={filters.titleDate}
                      onChange={(e) =>
                        setFilters({ ...filters, titleDate: e.target.value })
                      }
                       style={filters.titleDate === currentDate ? { color: "gray" } : {} }
                    />
                  </div>
                </div>
              </div>
              <div className="text-center my-2">
                <button type="submit" className="btn btn-primary me-2">
                  Εφαρμογή Φίλτρων
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-outline-secondary"
                >
                  Καθαρισμός Φίλτρων
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container">
        <Paper style={{ height: 400, width: "100%", marginBottom: "100px" }}>
       <DataGrid
  rows={users}
  columns={[
    { 
      field: "year", 
      headerName: "Έτος", 
      width: 100,
      sortable: true 
    },
    { 
      field: "season", 
      headerName: "Περίοδος", 
      width: 120,
      sortable: true 
    },
    { field: "ranking", headerName: "Κατάταξη", width: 100, sortable: true },
    { field: "listname", headerName: "Λίστα", width: 100, sortable: true },
    { field: "fullname", headerName: "Ονοματεπώνυμο", width: 200, sortable: true },
    { field: "appnum", headerName: "Κωδικός Αίτησης", width: 150, sortable: true },
    { field: "points", headerName: "Σύνολο Μονάδων", width: 150, sortable: true },
    {
      field: "titledate",
      headerName: "Ημερομηνία Τίτλου",
      width: 150,
      sortable: true,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    { field: "titlegrade", headerName: "Βαθμός Τίτλου", width: 150, sortable: true },
    { field: "extraqualifications", headerName: "Πρόσθετα Προσόντα", width: 150, sortable: true },
    { field: "experience", headerName: "Εμπειρία", width: 120, sortable: true },
    { field: "army", headerName: "Εθνική Φρουρά", width: 150, sortable: true },
    {
      field: "registrationdate",
      headerName: "Ημερομηνία Αίτησης",
      width: 150,
      sortable: true,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    {
      field: "birthdaydate",
      headerName: "Ημερομηνία Γέννησης",
      width: 150,
      sortable: true,
      renderCell: (params) => <span>{formatDate(params.value)}</span>,
    },
    { field: "notes", headerName: "Σημειώσεις", width: 150, sortable: true }
  ]}
  sortModel={sortModel}
  onSortModelChange={(newSortModel) => setSortModel(newSortModel)}
  initialState={{
    sorting: {
      sortModel: [
        { field: 'year', sort: 'desc' },
        { field: 'season', sort: 'desc' },
      ],
    },
  }}
  components={{
    Toolbar: GridToolbar,
  }}
  pageSize={pageSize}
  rowsPerPageOptions={[25, 50, 100]}
  getRowId={(row) => row.id}
  pagination
  paginationMode="server"
  rowCount={totalUsers}
  page={page - 1}
  loading={isLoading}
  paginationModel={{
    page: page - 1,
    pageSize: pageSize,
  }}
  onPaginationModelChange={({ page, pageSize }) => {
    setPageSize(pageSize);
    setPage(page + 1);
  }}
  localeText={{
    MuiTablePagination: {
      labelRowsPerPage: "Γραμμές ανά σελίδα",
      labelDisplayedRows: ({ from, to, count }) =>
        `${from} - ${to} από ${count}`,
    },
    noRowsLabel: "Δεν βρέθηκαν δεδομένα",
    errorOverlayDefaultLabel: "Σφάλμα κατά την ανάκτηση δεδομένων",
  }}
  style={{ height: 400, width: "100%", marginBottom: "100px" }}
/>
        </Paper>

      </div>
              <Footer />
    </>
  );
}

export default RankingLists;
