import React, { useState, useEffect } from 'react';
import { Container, Row, Button, Modal, Form, Nav } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSideBar';
import FileUploader from './components/FileUploader';
import XlsxUploader from './components/XlsxUploader';
import axios from 'axios';
import { BACKEND_ROUTE_URL, API_BASE_URL } from '../../config/config';
import { DataGrid } from '@mui/x-data-grid';
import { Paper } from '@mui/material';

const DeleteModal = ({ show, selectedCount, onCancel, onConfirm }) => {
    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>Επιβεβαίωση Διαγραφής</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Είστε σίγουροι ότι θέλετε να διαγράψετε {selectedCount} {selectedCount === 1 ? 'εγγραφή' : 'εγγραφές'};
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Ακύρωση
                </Button>
                <Button variant="danger" onClick={onConfirm}>
                    Διαγραφή
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const AddRecordModal = ({ show, onHide, onSubmit }) => {
    const [formData, setFormData] = useState({
        fullname: '',
        appnum: '',
        points: '',
        titledate: '',
        titlegrade: '',
        extraqualifications: '',
        experience: '',
        army: '0',
        registrationdate: '',
        birthdaydate: '',
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Προσθήκη Νέας Εγγραφής</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Ονοματεπώνυμο</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Κωδικός Αίτησης</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="appnum"
                                    value={formData.appnum}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Μόρια</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="points"
                                    value={formData.points}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Βαθμός Τίτλου</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="titlegrade"
                                    value={formData.titlegrade}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Ημερομηνία Τίτλου</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="titledate"
                                    value={formData.titledate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Ημ. Αίτησης</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="registrationdate"
                                    value={formData.registrationdate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Ημ. Γέννησης</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="birthdaydate"
                                    value={formData.birthdaydate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Πρόσθετα Προσόντα</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="extraqualifications"
                                    value={formData.extraqualifications}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Εκπαιδευτική Υπηρεσία</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Στρατός</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="army"
                                    value={formData.army}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 mb-3">
                            <Form.Group>
                                <Form.Label>Σημειώσεις</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Ακύρωση
                    </Button>
                    <Button variant="primary" type="submit">
                        Προσθήκη
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

const EditRecordModal = ({ show, onHide, onSubmit, recordData }) => {
    const [formData, setFormData] = useState(recordData || {});

    useEffect(() => {
        if (recordData) {
            setFormData(recordData);
        }
    }, [recordData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Επεξεργασία Εγγραφής</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Ονοματεπώνυμο</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Κωδικός Αίτησης</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="appnum"
                                    value={formData.appnum}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Μόρια</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="points"
                                    value={formData.points}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6 mb-3">
                            <Form.Group>
                                <Form.Label>Βαθμός Τίτλου</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="titlegrade"
                                    value={formData.titlegrade}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Ημερομηνία Τίτλου</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="titledate"
                                    value={formData.titledate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Ημ. Αίτησης</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="registrationdate"
                                    value={formData.registrationdate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Ημ. Γέννησης</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="birthdaydate"
                                    value={formData.birthdaydate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Πρόσθετα Προσόντα</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="extraqualifications"
                                    value={formData.extraqualifications}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Εκπαιδευτική Υπηρεσία</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4 mb-3">
                            <Form.Group>
                                <Form.Label>Στρατός</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="army"
                                    value={formData.army}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 mb-3">
                            <Form.Group>
                                <Form.Label>Σημειώσεις</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Ακύρωση
                    </Button>
                    <Button variant="primary" type="submit">
                        Αποθήκευση
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

const AddFile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [rawText, setRawText] = useState({ formatted: '', original: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddRecordModal, setShowAddRecordModal] = useState(false);
    const [showEditRecordModal, setShowEditRecordModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('pdf'); // Add this state for tab control
    const [isSaving, setIsSaving] = useState(false);  // Add this state

    // Define table columns
    const columns = [
        { field: 'ranking', headerName: 'Α/Α', width: 10 },
        { field: 'fullname', headerName: 'Ονοματεπώνυμο', width: 180 },
        { field: 'appnum', headerName: 'Κωδ.Αίτησης', width: 10 },
        { field: 'points', headerName: 'Μόρια', width: 10 },
        { field: 'titledate', headerName: 'Ημ.Τίτλου', width: 100 },
        { field: 'titlegrade', headerName: 'Βαθμός Τίτλου', width: 10 },
        { field: 'extraqualifications', headerName: 'Πρόσθετα Προσόντα', width: 10 },
        { field: 'experience', headerName: 'Εκπαιδευτική Υπηρεσία', width: 10 },
        { field: 'army', headerName: 'Στρατός', width: 10 },
        { field: 'registrationdate', headerName: 'Ημ. Αίτησης', width: 100 },
        { field: 'birthdaydate', headerName: 'Ημ. Γέννησης', width: 100 },
        { field: 'notes', headerName: 'Σημειώσεις', width: 10 }
    ];

    useEffect(() => {
        if (location.state && location.state.categoryData) {
            const categoryData = location.state.categoryData;
            setCategoryInfo(categoryData);

            // Fetch ranking list data based on category ID
            fetchRankingListData(categoryData.categoryid);
        } else {
            setError("Δεν βρέθηκαν πληροφορίες κατηγορίας");
            setLoading(false);
        }
    }, [location]);

    const fetchRankingListData = async (categoryId) => {
        try {
            setLoading(true);
            const response = await axios.get(`${BACKEND_ROUTE_URL}/AddFileRouter.php?categoryid=${categoryId}`);

            if (response.data.success) {
                setRankingData(response.data.data);
            } else {
                setError(response.data.message || "Σφάλμα κατά τη λήψη των δεδομένων");
            }
        } catch (err) {
            setError("Σφάλμα σύνδεσης με τον διακομιστή");
            console.error("Error fetching ranking list:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate('/employees/categories', {
            state: { 
                preservedFilters: location.state?.filters 
            }
        });
    };

    const handleAnalysisSuccess = (data, textData) => {
        setPreviewData(data);
        setRawText(textData);
        setShowPreview(true);
    };

    const handleUploadPdf = async () => {
        if (!previewData || previewData.length === 0 || !categoryInfo) {
            setUploadStatus({ error: true, message: 'Δεν υπάρχουν δεδομένα για αποθήκευση' });
            return;
        }

        try {
            setIsSaving(true);  // Set saving state to true when starting
            setUploadStatus({ loading: true, message: 'Αποθήκευση δεδομένων...' });

            const response = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, {
                action: 'saveRecords',
                categoryId: categoryInfo.categoryid,
                records: previewData
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                try {
                    // Send email notifications
                    const emailResponse = await axios.post(
                        `${BACKEND_ROUTE_URL}/ListEmail.php`,
                        {
                            categoryid: categoryInfo.categoryid,
                            season: categoryInfo.season,
                            year: categoryInfo.year,
                            type: categoryInfo.type,
                            action: 'new',
                            url: `${API_BASE_URL}/rankinglist/${categoryInfo.categoryid}`
                        }
                    );

                    console.log('Email response:', emailResponse.data);
                    setUploadStatus({
                        success: true,
                        message: emailResponse.data.success
                            ? 'Τα δεδομένα αποθηκεύτηκαν και οι ειδοποιήσεις στάλθηκαν με επιτυχία'
                            : 'Τα δεδομένα αποθηκεύτηκαν αλλά απέτυχε η αποστολή ειδοποιήσεων'
                    });
                } catch (emailError) {
                    console.error('Email error:', emailError);
                    setUploadStatus({
                        warning: true,
                        message: 'Τα δεδομένα αποθηκεύτηκαν αλλά απέτυχε η αποστολή ειδοποιήσεων'
                    });
                }

                // Reset preview state and fetch updated data
                setShowPreview(false);
                setPreviewData(null);
                fetchRankingListData(categoryInfo.categoryid);
            } else {
                setUploadStatus({ error: true, message: response.data.message || 'Σφάλμα κατά την αποθήκευση' });
            }
        } catch (error) {
            setUploadStatus({ error: true, message: 'Σφάλμα κατά την αποθήκευση: ' + error.message });
        } finally {
            setIsSaving(false);  // Reset saving state when done
        }
    };

    const handleReprocessText = async () => {
        try {
            setUploadStatus({ loading: true, message: 'Επανεπεξεργασία κειμένου...' });

            const response = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, {
                rawText: editedText,
                categoryId: categoryInfo.categoryid
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                setPreviewData(response.data.data);
                setRawText({
                    formatted: response.data.rawText.formatted,
                    original: response.data.rawText.original
                });
                setShowPreview(true);
                setIsEditing(false);
                setUploadStatus({ success: true, message: 'Το κείμενο επεξεργάστηκε επιτυχώς.' });
            } else {
                setUploadStatus({ error: true, message: response.data.message });
            }
        } catch (error) {
            setUploadStatus({ error: true, message: 'Σφάλμα κατά την επεξεργασία του κειμένου' });
        }
    };

    const handleReprocessTextXl = async () => {
        try {
            setUploadStatus({ loading: true, message: 'Επανεπεξεργασία κειμένου...' });

            const response = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouterXl.php`, {
                rawText: editedText,
                categoryId: categoryInfo.categoryid
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                setPreviewData(response.data.data);
                setRawText({
                    formatted: response.data.rawText.formatted,
                    original: response.data.rawText.original
                });
                setShowPreview(true);
                setIsEditing(false);
                setUploadStatus({ success: true, message: 'Το κείμενο επεξεργάστηκε επιτυχώς.' });
            } else {
                setUploadStatus({ error: true, message: response.data.message });
            }
        } catch (error) {
            setUploadStatus({ error: true, message: 'Σφάλμα κατά την επεξεργασία του κειμένου' });
        }
    };

    const handleDeleteRows = () => {
        if (selectedRows.length > 0) {
            setShowDeleteModal(true);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await axios.delete(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, {
                data: {
                    categoryId: categoryInfo.categoryid,
                    rowIds: selectedRows
                }
            });

            if (response.data.success) {
                fetchRankingListData(categoryInfo.categoryid);
                setSelectedRows([]);
            } else {
                setError(response.data.message || "Σφάλμα κατά τη διαγραφή");
            }
        } catch (error) {
            setError("Σφάλμα κατά τη διαγραφή των εγγραφών");
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleAddRecord = async (formData) => {
        try {
            const response = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, {
                action: 'addRecord',
                categoryId: categoryInfo.categoryid,
                record: formData
            });

            if (response.data.success) {
                fetchRankingListData(categoryInfo.categoryid);
                setShowAddRecordModal(false);
            } else {
                setError(response.data.message || "Σφάλμα κατά την προσθήκη εγγραφής");
            }
        } catch (error) {
            setError("Σφάλμα κατά την προσθήκη της εγγραφής");
        }
    };

    const handleEdit = () => {
        if (selectedRows.length === 1) {
            const recordToEdit = rankingData.find(record => record.id === selectedRows[0]);
            if (recordToEdit) {
                setEditingRecord(recordToEdit);
                setShowEditRecordModal(true);
            }
        }
    };

    const handleEditSubmit = async (formData) => {
        try {
            const response = await axios.put(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, {
                action: 'updateRecord',
                categoryId: categoryInfo.categoryid,
                recordId: formData.id,
                record: formData
            });

            if (response.data.success) {
                fetchRankingListData(categoryInfo.categoryid);
                setShowEditRecordModal(false);
                setEditingRecord(null);
                setSelectedRows([]);
            } else {
                setError(response.data.message || "Σφάλμα κατά την ενημέρωση εγγραφής");
            }
        } catch (error) {
            setError("Σφάλμα κατά την ενημέρωση της εγγραφής");
        }
    };

    return (

        <div className="container-fluid" style={{ height: "100vh", overflow: "hidden" }}>
            <div className="row h-100">
                <AdminSidebar />
                <div className="col-xl-10 p-4" style={{ height: "100%", overflowY: "auto" }}>
                    <div className="container mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>Πίνακας Κατατάξεων</h2>
                            <Button variant="secondary" onClick={handleGoBack}>
                                <i className="bi bi-arrow-left"></i> Επιστροφή
                            </Button>
                        </div>

                        {categoryInfo && (
                            <div className="mb-4 p-3 bg-light border rounded">
                                <h4>Πληροφορίες Λίστας</h4>
                                <p><strong>Έτος:</strong> {categoryInfo.year}</p>
                                <p><strong>Μήνας:</strong> {categoryInfo.season}</p>
                                <p><strong>Τύπος:</strong> {categoryInfo.type}</p>
                                <p><strong>Πεδία:</strong> {categoryInfo.fields}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            {categoryInfo && (
                                <div className="card">
                                    <div className="card-header">
                                        <Nav variant="tabs" defaultActiveKey="pdf" onSelect={(k) => setActiveTab(k)}>
                                            <Nav.Item>
                                                <Nav.Link eventKey="pdf">Μεταφόρτωση PDF</Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="excel">Μεταφόρτωση Excel</Nav.Link>
                                            </Nav.Item>
                                        </Nav>
                                    </div>
                                    <div className="card-body">
                                        {activeTab === 'pdf' ? (
                                            <FileUploader 
                                                categoryInfo={categoryInfo}
                                                onUploadSuccess={fetchRankingListData}
                                                onAnalysisSuccess={handleAnalysisSuccess}
                                            />
                                        ) : (
                                            <XlsxUploader 
                                                categoryInfo={categoryInfo}
                                                onUploadSuccess={fetchRankingListData}
                                                onAnalysisSuccess={handleAnalysisSuccess}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {showPreview && rawText && (
                            <div className="mb-4">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">
                                            Ακατέργαστο Κείμενο PDF
                                            <Button
                                                variant="link"
                                                className="ms-2"
                                                onClick={() => {
                                                    setIsEditing(!isEditing);
                                                    setEditedText(rawText.original || '');
                                                }}
                                            >
                                                <i className={`bi bi-${isEditing ? 'x' : 'pencil'}`}></i>
                                            </Button>
                                        </h5>
                                        {isEditing ? (
                                            <>
                                                <textarea
                                                    className="form-control mb-2"
                                                    style={{
                                                        height: '300px',
                                                        fontFamily: 'monospace'
                                                    }}
                                                    value={editedText}
                                                    onChange={(e) => setEditedText(e.target.value)}
                                                />
                                                <Button
                                                    variant="primary"
                                                    onClick={activeTab === 'pdf' ? handleReprocessText : handleReprocessTextXl}
                                                    className="me-2"
                                                >
                                                    Επανεπεξεργασία
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setIsEditing(false)}
                                                >
                                                    Ακύρωση
                                                </Button>
                                            </>
                                        ) : (
                                            <div
                                                className="bg-light p-3 border rounded"
                                                style={{
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    fontFamily: 'monospace',
                                                    whiteSpace: 'pre-wrap'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: rawText.formatted }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPreview && previewData && (
                            <div className="mb-4">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Προεπισκόπηση Δεδομένων</h5>
                                        <Paper sx={{ height: 400, width: '100%' }}>
                                            <DataGrid
                                                rows={previewData}
                                                columns={columns}
                                                initialState={{
                                                    pagination: {
                                                        paginationModel: { page: 0, pageSize: 100 },
                                                    },
                                                }}
                                                pageSizeOptions={[10, 25, 50, 100]}
                                                density="compact"
                                                sx={{ border: 0 }}
                                                localeText={{
                                                    MuiTablePagination: {
                                                        labelRowsPerPage: 'Γραμμές ανά σελίδα',
                                                        labelDisplayedRows: ({ from, to, count }) =>
                                                            `${from}-${to} από ${count}`
                                                    }
                                                }}
                                            />
                                        </Paper>
                                        <div className="mt-3">
                                            <Button
                                                variant="success"
                                                onClick={handleUploadPdf}
                                                className="me-2"
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Αποθήκευση...
                                                    </>
                                                ) : (
                                                    'Επιβεβαίωση και Αποθήκευση'
                                                )}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setShowPreview(false);
                                                    setPreviewData(null);
                                                }}
                                            >
                                                Ακύρωση
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Φόρτωση...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger">{error}</div>
                        ) : (
                            <div>
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <div className="d-flex gap-2 mb-3">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => setShowAddRecordModal(true)}
                                            >
                                                <i className="bi bi-plus-circle me-2"></i>
                                                Προσθήκη Εγγραφής
                                            </button>
                                            <button
                                                className={`btn btn-sm ${selectedRows.length !== 1
                                                    ? "btn-secondary opacity-75"
                                                    : "btn-warning"
                                                    }`}
                                                onClick={handleEdit}
                                                disabled={selectedRows.length !== 1}
                                            >
                                                <i className="bi bi-pencil-square me-2"></i>
                                                Επεξεργασία
                                            </button>
                                            <button
                                                className={`btn btn-sm ${selectedRows.length === 0
                                                    ? "btn-secondary opacity-75"
                                                    : "btn-danger"
                                                    }`}
                                                onClick={handleDeleteRows}
                                            >
                                                <i className="bi bi-trash3 me-2"></i>
                                                Διαγραφή {selectedRows.length > 0 && `(${selectedRows.length})`}
                                            </button>
                                        </div>
                                        <Paper sx={{ height: 600, width: '100%' }}>
                                            <DataGrid
                                                rows={rankingData}
                                                columns={columns}
                                                checkboxSelection
                                                onRowSelectionModelChange={(newSelection) => {
                                                    setSelectedRows(newSelection);
                                                }}
                                                initialState={{
                                                    pagination: {
                                                        paginationModel: { page: 0, pageSize: 100 },
                                                    },
                                                }}
                                                pageSizeOptions={[10, 25, 50, 100]}
                                                density="compact"
                                                sx={{ border: 0 }}
                                                localeText={{
                                                    MuiTablePagination: {
                                                        labelRowsPerPage: 'Γραμμές ανά σελίδα',
                                                        labelDisplayedRows: ({ from, to, count }) =>
                                                            `${from}-${to} από ${count}`
                                                    }
                                                }}
                                            />
                                        </Paper>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <DeleteModal
                show={showDeleteModal}
                selectedCount={selectedRows.length}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
            />
            <AddRecordModal
                show={showAddRecordModal}
                onHide={() => setShowAddRecordModal(false)}
                onSubmit={handleAddRecord}
            />
            <EditRecordModal
                show={showEditRecordModal}
                onHide={() => {
                    setShowEditRecordModal(false);
                    setEditingRecord(null);
                }}
                onSubmit={handleEditSubmit}
                recordData={editingRecord}
            />
            {(showDeleteModal || showAddRecordModal || showEditRecordModal) && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default AddFile;
