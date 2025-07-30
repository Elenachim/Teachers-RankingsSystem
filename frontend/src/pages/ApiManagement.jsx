import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { BACKEND_ROUTE_URL } from "../config/config";
import AdminSidebar from "../components/AdminSideBar";
import Paper from "@mui/material/Paper";
import { Search } from "../pages/UsersDashboard/Search";
// array of objects
const roleOptions = [
  { value: 0, label: "GET" }, // Object 1
  { value: 1, label: "GET, POST" },
  { value: 2, label: "GET, POST, PUT, PATCH" },
  { value: 3, label: "GET, POST, PUT, PATCH, DELETE" },
];

const ApiManagement = () => {
  const [rows, setRows] = useState([]); // Array state
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // String state
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_ROUTE_URL}FetchApiManagement.php?page=${page}&limit=${pageSize}&search=${searchQuery}&role=${selectedRole}`,
          {
            method: "GET", // Specifies this is a read operation
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch API data");

        const data = await response.json();
        // Check if response data is an array
        if (Array.isArray(data.data)) {
          // update state with the data
          setRows(data.data);// set rows with the data
          setTotalUsers(data.total); //  set total row count
        } else {
          setRows([]); // fallback if something is wrong
          setTotalUsers(0);
        }
      } catch (error) {
        console.error("Error fetching API data:", error);
      } finally {
        setLoading(false);
      }
    };
// Fetch data when component mounts or when page, pageSize, searchQuery, or selectedRole changes
    fetchData();
  }, [page, pageSize, searchQuery, selectedRole]); // triggers when these change

  const handleRoleChange = async (id, newRole) => {
    try {
      setLoading(true);
      const response = await fetch(
        BACKEND_ROUTE_URL + "ChangeApiAccessRole.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: id,
            accessrole: newRole,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Αποτυχία ενημέρωσης ρόλου");
      }

      const data = await response.json();
      console.log("Δεδομένα:", data);

      if (data) {
        setRows(data); // Refresh with updated API key data
        setSuccessMessage("Eνημερώθηκε με επιτυχία");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000); // Clear message after 3 seconds
      } else {
        setErrorMessage("Αποτυχία ενημέρωσης ");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000); // Clear message after 3 seconds
      }
    } catch (error) {
      console.error("Αποτυχία ενημέρωσης ρόλου:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setLoading(true); // Add loading state
      const response = await fetch(`${BACKEND_ROUTE_URL}UpdateApiStatus.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: id,
          isactive: newStatus,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Αποτυχία ενημέρωσης κατάστασης");
      }

      // Update local state only after successful API call
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === id ? { ...row, isactive: newStatus } : row
        )
      );
      if (data) {
        // Show success message
        setSuccessMessage("Η κατάσταση ενημερώθηκε με επιτυχία");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Αποτυχία ενημέρωσης κατάστασης");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "id", headerName: "Κωδικός API", width: 90 },
    { field: "userid", headerName: "Κωδικός Χρήστη", width: 150 },
    { field: "username", headerName: "Όνομα Χρήστη", width: 150 },

    {
      field: "created",
      headerName: "Ημερομηνία Δημιουργίας",
      width: 200,
      renderCell: (params) => {
        const date = new Date(params.row.created * 1000); // if timestamp is in seconds
        const formatted = date.toLocaleDateString("en-GB"); // e.g. "21/04/2025"
        return formatted;
      },
    },
    {
      field: "accessrole",
      headerName: "Επίπεδο Πρόσβασης",
      width: 250,
      renderCell: (params) => (
        <select
          className="form-select"
          value={params.value}
          onChange={(e) =>
            handleRoleChange(params.row.id, parseInt(e.target.value))
          }
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      field: "statusToggle",
      headerName: "Κατάσταση",
      width: 150,
      renderCell: (params) => (
        <button
          className={`btn btn-sm ${
            params.row.isactive === 1 ? "btn-danger" : "btn-success"
          }`}
          onClick={() => toggleStatus(params.row.id, params.row.isactive)}
        >
          {params.row.isactive === 1 ? "Απενεργοποίηση" : "Ενεργοποίηση"}
        </button>
      ),
    },
  ];

  return (
    <div className="container-fluid">
      <div className="row">
        <AdminSidebar />
        <main className="ms-sm-auto col-xl-10 px-md-4">
          <div className="container-fluid mt-4">
            <div className="mb-4">
              <h2 className="mb-3 mb-md-0">Διαχείριση API</h2>
              <div className="row mt-3 g-2">
                <div className="col-md-6">
                  <Search onSearch={(query) => setSearchQuery(query)} />
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setPage(1); // Reset to first page on filter change
                    }}
                  >
                    <option value="">Όλοι οι χρήστες με δικαιώματα </option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {successMessage && (
                <div className="alert alert-success mt-2" role="alert">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="alert alert-danger mt-2" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>
            <div className="card shadow-sm">
              <div className="card-body">
                <div style={{ height: "calc(100vh - 250px)", width: "100%" }}>
                  <Paper
                    sx={{
                      height: `calc(100vh - ${250}px)`,
                      width: "100%",
                      minHeight: "200px !important",
                    }}
                  >
                    <DataGrid
                      rows={rows}
                      columns={columns.map((col) => ({
                        ...col,
                        sortable: false, // Disables sorting on each column
                        filterable: false, // Disables filtering on each column
                      }))}
                      loading={loading}
                      paginationMode="server"
                      rowCount={totalUsers}
                      paginationModel={{
                        page: page - 1,
                        pageSize: pageSize,
                      }}
                      onPaginationModelChange={({ page, pageSize }) => {
                        handlePageSizeChange(pageSize);
                        handlePageChange(page + 1);
                      }}
                      disableColumnMenu // Removes the column menu (filter & sort actions)
                      rowsPerPageOptions={[25, 50, 100]}
                      getRowId={(row) => row.id || `temp-${Math.random()}`}
                      getRowClassName={(params) =>
                        params.row.isactive === 0 ? "Mui-disabled-user" : ""
                      }
                      disableRowSelectionOnClick
                      localeText={{
                        MuiTablePagination: {
                          labelRowsPerPage: "Γραμμές ανά σελίδα",
                          labelDisplayedRows: ({ from, to, count }) =>
                            `${from} - ${to} από ${count}`,
                        },
                        noRowsLabel: "Δεν βρέθηκαν δεδομένα",
                        errorOverlayDefaultLabel:
                          "Σφάλμα κατά την ανάκτηση δεδομένων",
                      }}
                      sx={{
                        border: 0,
                        height: "100%",
                        ".MuiDataGrid-main": {
                          maxHeight: "none !important",
                        },
                        ".Mui-disabled-user": {
                          backgroundColor: "#f5f5f5",
                          color: "#9e9e9e",
                        },
                      }}
                      pagination
                    />
                  </Paper>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApiManagement;
