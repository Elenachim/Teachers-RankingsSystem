import React, { useState, useEffect } from 'react';
import { Container, Row, Modal, Button } from 'react-bootstrap';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Paper } from '@mui/material';
import axios from 'axios';
import { BACKEND_ROUTE_URL, FIELDS_FILE_PATH } from '../../config/config';
import AdminSidebar from '../../components/AdminSideBar';
import { useNavigate, useLocation } from 'react-router-dom';

const Categories = () => {
    const navigate = useNavigate();
    const location = useLocation();  // Add this line
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        year: location.state?.preservedFilters?.year || new Date().getFullYear(),
        season: location.state?.preservedFilters?.season || '',
        type: location.state?.preservedFilters?.type || ''
    });
    const [showModal, setShowModal] = useState(false);
    const [category, setCategory] = useState({
        year: new Date().getFullYear(),
        season: '',
        type: '',
        fields: ''
    });
    const [message, setMessage] = useState({ text: '', isError: false });
    const [fieldOptions, setFieldOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // Add new state variables for year modal
    const [showYearModal, setShowYearModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 1);
    const [yearExists, setYearExists] = useState(false);

    const columns = [
        { field: 'year', headerName: 'Έτος', flex: 0.5, minWidth: 100 },
        { field: 'season', headerName: 'Μήνας', flex: 0.7, minWidth: 120 },
        { field: 'type', headerName: 'Τύπος', flex: 1, minWidth: 200 },
        { field: 'fields', headerName: 'Πεδία', flex: 1.5, minWidth: 250 },
        {
            field: 'actions',
            headerName: 'Ενέργειες',
            flex: 0.5,
            minWidth: 100,
            sortable: false,
            renderCell: (params) => (
                <Button variant="" size="sm" onClick={() => handleActionClick(params.row)}>
                    <i className="bi bi-file-earmark-pdf"></i>
                </Button>
            ),
        }
    ];

    const handleActionClick = (row) => {
        navigate('/employees/addfile', { 
            state: { 
                categoryData: row,
                filters: filters // Pass current filters to AddFile
            } 
        });
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${BACKEND_ROUTE_URL}/FetchCategoryRouter.php`);
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredCategories = categories.map(category => ({
        ...category,
        id: category.categoryid // Changed from categoryId to categoryid
    })).filter(category => {
        return (
            (!filters.year || parseInt(category.year) === parseInt(filters.year)) &&
            (!filters.season || category.season === filters.season) &&
            (!filters.type || category.type === filters.type)
        );
    });

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const response = await axios.get(FIELDS_FILE_PATH);
                if (response.data.success) {
                    const fields = response.data.data.split('\n')
                        .map(field => field.trim())
                        .filter(field => field.length > 0);
                    setFieldOptions(fields);
                }
            } catch (error) {
                console.error('Error loading fields:', error);
            }
        };
        fetchFields();
    }, []);

    const handleModalClose = () => {
        setShowModal(false);
        setMessage({ text: '', isError: false });
        setCategory({
            year: new Date().getFullYear(),
            season: '',
            type: '',
            fields: ''
        });
    };

    const handleCategoryChange = (e) => {
        const { name, value } = e.target;
        setCategory(prev => ({
            ...prev,
            [name]: value
        }));
        if (name === 'fields') {
            setSearchTerm(value);
            setShowSuggestions(true);
        }
    };

    const handleFieldSelect = async (field, isNew = false) => {
        if (isNew) {
            try {
                await axios.post(FIELDS_FILE_PATH, { field });
                setFieldOptions(prev => [...prev, field]);
            } catch (error) {
                console.error('Error adding new field:', error);
            }
        }
        setCategory(prev => ({ ...prev, fields: field }));
        setSearchTerm(field);
        setShowSuggestions(false);
    };

    useEffect(() => {
        if (message.text && !message.isError) {
            const timer = setTimeout(() => {
                setMessage({ text: '', isError: false });
                resetForm();
            }, 2000); // Message will disappear after 2 seconds
            return () => clearTimeout(timer);
        }
    }, [message]);

    const resetForm = () => {
        setCategory(prev => ({
            ...prev,
            fields: '' // Only reset the fields value, keep other values
        }));
        setSearchTerm('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send the category data directly since we're already using Greek values in the form
            const response = await axios.post(`${BACKEND_ROUTE_URL}/CategoryRouter.php`, category);
            if (response.data.success) {
                setMessage({ text: 'Η λίστα προστέθηκε με επιτυχία!', isError: false });
                fetchCategories(); // Refresh the list
                resetForm(); // Only reset the fields
            }
        } catch (error) {
            setMessage({ text: 'Σφάλμα: ' + (error.response?.data?.message || error.message), isError: true });
        }
    };

    const handleSelectionChange = (newSelection) => {
        setSelectedRows(newSelection);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            setMessage({ text: 'Παρακαλώ επιλέξτε λίστες για διαγραφή', isError: true });
            return;
        }
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`${BACKEND_ROUTE_URL}/FetchCategoryRouter.php`, {
                data: selectedRows
            });

            if (response.data.success) {
                setMessage({ text: 'Οι λίστες διαγράφηκαν με επιτυχία', isError: false });
                fetchCategories();
                setSelectedRows([]);
            } else {
                setMessage({ text: 'Σφάλμα: ' + response.data.message, isError: true });
            }
        } catch (error) {
            setMessage({ text: 'Σφάλμα: ' + error.message, isError: true });
        } finally {
            setShowDeleteModal(false);
        }
    };

    // Add function to check if year exists
    const checkYearExists = async (year) => {
        try {
            const response = await axios.get(`${BACKEND_ROUTE_URL}/FetchCategoryRouter.php?checkYear=${year}`);
            return response.data.exists;
        } catch (error) {
            console.error('Error checking year:', error);
            setMessage({ text: 'Error checking year: ' + error.message, isError: true });
            return false;
        }
    };

    // Add function to handle year submission
    const handleYearSubmit = async () => {
        // Check if year exists
        const exists = await checkYearExists(selectedYear);
        if (exists) {
            setYearExists(true);
            return;
        }
        
        // Year doesn't exist, proceed with creation
        try {
            const response = await axios.post(
                `${BACKEND_ROUTE_URL}/FetchCategoryRouter.php`,
                { action: 'createNextYear', year: selectedYear }
            );
            if (response.data.success) {
                // Close the modal first
                setShowYearModal(false);
                setYearExists(false);
                
                // Then set success message to be displayed in the global alert
                setMessage({ 
                    text: `Οι λίστες για το έτος ${selectedYear} δημιουργήθηκαν επιτυχώς`, 
                    isError: false 
                });
                
                // Show the success message in a more visible way
                const alertElement = document.createElement('div');
                alertElement.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                alertElement.style.zIndex = '1050';
                alertElement.innerHTML = `
                    <strong>Επιτυχία!</strong> Οι λίστες για το έτος ${selectedYear} δημιουργήθηκαν επιτυχώς
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                document.body.appendChild(alertElement);
                
                // Remove the alert after 3 seconds
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 3000);
                
                fetchCategories(); // Refresh the list
            }
        } catch (error) {
            setMessage({ 
                text: 'Σφάλμα: ' + (error.response?.data?.message || error.message), 
                isError: true 
            });
            setShowYearModal(false);
            setYearExists(false);
        }
    };

    const renderSuggestions = () => {
        const filteredFields = fieldOptions.filter(field =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);

        return (
            <div className="suggestion-dropdown" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '0 0 4px 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxHeight: '200px',
                overflowY: 'auto'
            }}>
                {filteredFields.length > 0 ? (
                    filteredFields.map((field, index) => (
                        <div key={index} className="suggestion-item"
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleFieldSelect(field);
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                            {field}
                        </div>
                    ))
                ) : searchTerm.trim() !== '' && (
                    <div className="suggestion-item"
                        style={{ padding: '8px 12px', cursor: 'pointer', color: '#0d6efd' }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleFieldSelect(searchTerm.trim(), true);
                        }}>
                        Προσθήκη νέου πεδίου στο txt: "{searchTerm.trim()}"
                    </div>
                )}
            </div>
        );
    };

    return (
        <Container fluid>
            <Row>
                <AdminSidebar />
                <div className="col md-9 ms-sm-auto col-xl-10 px-md-4">
                    <div className="container-fluid mt-4">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                            <h2 className="mb-3 mb-md-0">Λίστες</h2>
                        </div>

                        

                        {/* Updated filters section */}
                        <div className="card mb-4">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label htmlFor="year" className="form-label">Έτος:</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="year"
                                            name="year"
                                            value={filters.year}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label htmlFor="season" className="form-label">Μήνας:</label>
                                        <select
                                            className="form-control"
                                            id="season"
                                            name="season"
                                            value={filters.season}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">Όλοι οι μήνες</option>
                                            <option value="Φεβρουάριος">Φεβρουάριος</option>
                                            <option value="Ιούνιος">Ιούνιος</option>
                                        </select>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label htmlFor="type" className="form-label">Τύπος:</label>
                                        <select
                                            className="form-control"
                                            id="type"
                                            name="type"
                                            value={filters.type}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">Όλοι οι τύποι</option>
                                            <option value="Δημοτική Εκπαίδευση">Δημοτική Εκπαίδευση</option>
                                            <option value="Ειδική Εκπαίδευση">Ειδική Εκπαίδευση</option>
                                            <option value="Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες">Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες</option>
                                            <option value="Μέση Γενική">Μέση Γενική</option>
                                            <option value="Μέση Τεχνική">Μέση Τεχνική</option>
                                            <option value="Προδημοτική Εκπαίδευση">Προδημοτική Εκπαίδευση</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                                <div className="card mb-4">
                                    <div className="card-body">
                                        {/* Centered buttons container */}
                        <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-2 mb-4">
                            <Button 
                                variant="success" 
                                onClick={() => setShowYearModal(true)} // Modified to show the year modal
                                className="w-100 w-sm-auto"
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                <span className="d-none d-sm-inline">Προσθήκη Επόμενου Έτους</span>
                                <span className="d-inline d-sm-none">Νέο Έτος</span>
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={handleDelete}
                                disabled={selectedRows.length === 0}
                                className="w-100 w-sm-auto"
                            >
                                <i className="bi bi-trash me-2"></i>
                                <span className="d-none d-sm-inline">Διαγραφή Επιλεγμένων</span>
                                <span className="d-inline d-sm-none">Διαγραφή</span>
                            </Button>
                            <Button 
                                variant="success" 
                                onClick={() => setShowModal(true)}
                                className="w-100 w-sm-auto"
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                <span className="d-none d-sm-inline">Προσθήκη Νέας Λίστας</span>
                                <span className="d-inline d-sm-none">Νέα Λίστα</span>
                            </Button>
                        </div>
                        {/* Updated Paper and DataGrid */}
                        <Paper 
                            sx={{ 
                                height: { 
                                    xs: `calc(100vh - 400px)`,
                                    sm: `calc(100vh - 350px)`,
                                    md: `calc(100vh - 300px)`
                                },
                                width: '100%',
                                minHeight: '400px !important',
                            }}
                        >
                            <DataGrid
                                rows={filteredCategories}
                                columns={columns}
                                checkboxSelection
                                onRowSelectionModelChange={handleSelectionChange}
                                rowSelectionModel={selectedRows}
                                disableRowSelectionOnClick
                                slots={{ toolbar: GridToolbar }}
                                localeText={{
                                    footerRowsPerPage: 'Γραμμές ανά σελίδα',
                                    MuiTablePagination: {
                                        labelRowsPerPage: 'Γραμμές ανά σελίδα',
                                        labelDisplayedRows: ({ from, to, count }) =>
                                            `${from}-${to} από ${count}`,
                                    }
                                }}
                                slotProps={{
                                    toolbar: {
                                        quickFilterProps: { debounceMs: 500 },
                                        printOptions: { disableToolbarButton: true },
                                        csvOptions: {
                                            fileName: 'Categories_List',
                                            utf8WithBom: true,
                                            fields: ['year', 'season', 'type', 'fields'],
                                        },
                                    },
                                }}
                                sx={{
                                    border: 0,
                                    height: '100%',
                                    '& .MuiDataGrid-main': { maxHeight: 'none !important' },
                                    '& .MuiDataGrid-cell': { wordBreak: 'break-word' },
                                    '& .MuiDataGrid-toolbarContainer': {
                                        flexDirection: {
                                            xs: 'column',
                                            sm: 'row'
                                        },
                                        gap: 1,
                                        p: 1
                                    },
                                    '& .MuiButton-root': {
                                        width: {
                                            xs: '100%',
                                            sm: 'auto'
                                        }
                                    }
                                }}
                                initialState={{
                                    pagination: {
                                        paginationModel: { pageSize: 10 },
                                    },
                                }}
                                pageSizeOptions={[5, 10, 25, 50]}
                            />
                        </Paper>
                                    </div>
                                </div>
                            </div>
                        <Modal show={showModal} onHide={handleModalClose} size="lg">
                            <Modal.Header closeButton>
                                <Modal.Title>Προσθήκη Νέας Λίστας</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="year" className="form-label">Έτος:</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="year"
                                            name="year"
                                            value={category.year}
                                            onChange={handleCategoryChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="season" className="form-label">Μήνας:</label>
                                        <select
                                            className="form-control"
                                            id="season"
                                            name="season"
                                            value={category.season}
                                            onChange={handleCategoryChange}
                                            required
                                        >
                                            <option value="">Επιλέξτε μήνα</option>
                                            <option value="Φεβρουάριος">Φεβρουάριος</option>
                                            <option value="Ιούνιος">Ιούνιος</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="type" className="form-label">Τύπος:</label>
                                        <select
                                            className="form-control"
                                            id="type"
                                            name="type"
                                            value={category.type}
                                            onChange={handleCategoryChange}
                                            required
                                        >
                                            <option value="">Επιλέξτε Τύπο</option>
                                            <option value="Δημοτική">Δημοτική</option>
                                            <option value="Ειδική Εκπαίδευση">Ειδική Εκπαίδευση</option>
                                            <option value="Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες">Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες</option>
                                            <option value="Μέση Γενική">Μέση Γενική</option>
                                            <option value="Μέση Τεχνική">Μέση Τεχνική</option>
                                            <option value="Προδημοτική Εκπαίδευση">Προδημοτική Εκπαίδευση</option>
                                        </select>
                                    </div>
                                    <div className="mb-3 position-relative">
                                        <label htmlFor="fields" className="form-label">Πεδία:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="fields"
                                            name="fields"
                                            value={category.fields}
                                            onChange={handleCategoryChange}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            autoComplete="off"
                                            required
                                        />
                                        {showSuggestions && category.fields && renderSuggestions()}
                                    </div>
                                    <div className="d-flex justify-content-end">
                                        <Button variant="secondary" className="me-2" onClick={handleModalClose}>
                                            Ακύρωση
                                        </Button>
                                        <Button variant="primary" type="submit">
                                            Προσθήκη Λίστας
                                        </Button>
                                    </div>
                                </form>
                                {message.text && (
                                    <div className={`alert ${message.isError ? 'alert-danger' : 'alert-success'} mt-3`}>
                                        {message.text}
                                    </div>
                                )}
                            </Modal.Body>
                        </Modal>

                        {/* Add the Year Selection Modal */}
                        <Modal show={showYearModal} onHide={() => {
                            setShowYearModal(false);
                            setYearExists(false);
                        }}>
                            <Modal.Header closeButton>
                                <Modal.Title>Προσθήκη Λιστών για Νέο Έτος</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="form-group">
                                    <label htmlFor="yearInput" className="form-label">Εισάγετε Έτος:</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="yearInput"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear() + 1)}
                                    />
                                </div>
                                {yearExists && (
                                    <div className="alert alert-danger mt-3">
                                        Οι λίστες για αυτό το έτος υπάρχουν ήδη!
                                    </div>
                                )}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => {
                                    setShowYearModal(false);
                                    setYearExists(false);
                                }}>
                                    Ακύρωση
                                </Button>
                                <Button variant="success" onClick={handleYearSubmit}>
                                    Δημιουργία Λιστών
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {/* Add global alert for success message outside modals */}
                        {message.text && !message.isError && (
                            <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                                <strong>Επιτυχία!</strong> {message.text}
                                <button type="button" className="btn-close" onClick={() => setMessage({ text: '', isError: false })} aria-label="Close"></button>
                            </div>
                        )}

                        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Επιβεβαίωση Διαγραφής</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                Είστε σίγουροι ότι θέλετε να διαγράψετε {selectedRows.length} επιλεγμένες {selectedRows.length === 1 ? 'λίστα' : 'λίστες'};
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                    Ακύρωση
                                </Button>
                                <Button variant="danger" onClick={confirmDelete}>
                                    Διαγραφή
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                </div>
            </Row>
        </Container>
    );
};

export default Categories;
