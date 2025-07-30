import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_ROUTE_URL, FIELDS_FILE_PATH } from '../../config/config';
import AdminSidebar from '../../components/AdminSideBar';
import { Container, Row } from 'react-bootstrap';

const AddNewCategory = () => {
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

    useEffect(() => {
        const fetchFields = async () => {
            try {
                const response = await axios.get(FIELDS_FILE_PATH);
                if (response.data.success) {
                    const fields = response.data.data.split('\n')
                        .map(field => field.trim())
                        .filter(field => field.length > 0);
                    setFieldOptions(fields);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (error) {
                console.error('Error loading fields:', error);
                setMessage({ text: 'Σφάλμα φόρτωσης πεδίων: ' + error.message, isError: true });
            }
        };
        fetchFields();
    }, []);

    useEffect(() => {
        if (message.text && !message.isError) {
            const timer = setTimeout(() => {
                setMessage({ text: '', isError: false });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const filteredFields = fieldOptions.filter(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 suggestions for better performance

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCategory(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFieldSelect = async (field, isNew = false) => {
        if (isNew) {
            try {
                // Add to Fields.txt
                await axios.post(FIELDS_FILE_PATH, { field });
                // Update local options
                setFieldOptions(prev => [...prev, field]);
            } catch (error) {
                console.error('Error adding new field:', error);
                setMessage({ text: 'Σφάλμα προσθήκης νέου πεδίου: ' + error.message, isError: true });
            }
        }
        setCategory(prev => ({ ...prev, fields: field }));
        setSearchTerm(field);
        setShowSuggestions(false);
    };

    const handleFieldInputChange = (e) => {
        const value = e.target.value;
        setCategory(prev => ({ ...prev, fields: value }));
        setSearchTerm(value);
        setShowSuggestions(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${BACKEND_ROUTE_URL}/CategoryRouter.php`, category, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
       
            if (response.data.success) {
                setMessage({ text: 'Η λίστα προστέθηκε με επιτυχία!', isError: false });
                setCategory(prev => ({
                    ...prev,
                    fields: '' // Only reset the fields value
                }));
                setSearchTerm(''); // Clear search term
            } else {
                setMessage({ text: 'Σφάλμα: ' + response.data.message, isError: true });
            }
        } catch (error) {
            setMessage({ text: 'Error: ' + (error.response?.data?.message || error.message), isError: true });
        }
    };

    const renderSuggestions = () => (
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
                     style={{padding: '8px 12px', cursor: 'pointer', color: '#0d6efd'}}
                     onMouseDown={(e) => {
                         e.preventDefault();
                         handleFieldSelect(searchTerm.trim(), true);
                     }}>
                    Add new field: "{searchTerm.trim()}"
                </div>
            )}
        </div>
    );

    return (
        <Container fluid>
            <Row>
                <AdminSidebar />
                <div className="col md-9 ms-sm-auto col-lg-10 px-md-4">
                    <div className="container mt-4">
                        <h2>Προσθήκη Νέας Λίστας</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="year" className="form-label">Έτος:</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="year"
                                    name="year"
                                    value={category.year}
                                    onChange={handleChange}
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
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Επιλέξτε μήνα</option>
                                    <option value="February">Φεβρουάριος</option>
                                    <option value="June">Ιούνιος</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="type" className="form-label">Τύπος:</label>
                                <select
                                    className="form-control"
                                    id="type"
                                    name="type"
                                    value={category.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Επιλέξτε Τύπο</option>
                                    <option value="Primary">Δημοτική</option>
                                    <option value="SpecialEducation">Ειδική Εκπαίδευση</option>
                                    <option value="SpecialLists">Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες</option>
                                    <option value="SecondaryGeneral">Μέση Γενική</option>
                                    <option value="SecondaryTechnical">Μέση Τεχνική</option>
                                    <option value="Pre-primary">Προδημοτική Εκπαίδευση</option>
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
                                    onChange={handleFieldInputChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    autoComplete="off"
                                    required
                                />
                                {showSuggestions && searchTerm && renderSuggestions()}
                            </div>
                            <button type="submit" className="btn btn-primary">Προσθήκη Λίστας</button>
                        </form>
                        {message.text && (
                            <div className={`alert ${message.isError ? 'alert-danger' : 'alert-success'} mt-3`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>
            </Row>
        </Container>
    );
};

export default AddNewCategory;
