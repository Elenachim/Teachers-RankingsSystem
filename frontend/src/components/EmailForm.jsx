import React, { useState, useRef, useEffect } from 'react';
import EmailEditor from 'react-email-editor'; // Rich email editor (plugin)
import { sendCustomEmail, getAvailableEmails } from '../api/EmailApi'; // API functions για αποστολή και λήψη email
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap styling

const EmailForm = () => {
    // Καταστάσεις (states)
    const [recipients, setRecipients] = useState(''); // Παραλήπτες (ως string με κόμμα)
    const [emailSubject, setEmailSubject] = useState(''); // Θέμα του email
    const [alert, setAlert] = useState({ show: false, message: '', type: '' }); // Μηνύματα ειδοποίησης
    const [loadingState, setLoadingState] = useState({ isLoading: false, message: '' }); // Κατάσταση φόρτωσης
    const emailEditorRef = useRef(null); // Αναφορά στο email editor component
    const [suggestions, setSuggestions] = useState([]); // Λίστα προτάσεων email
    const [showSuggestions, setShowSuggestions] = useState(false); // Εμφάνιση προτάσεων
    const [availableEmails, setAvailableEmails] = useState([]); // Λίστα διαθέσιμων email για autocomplete
    const [sendToAll, setSendToAll] = useState(false); // Επιλογή για αποστολή σε όλους

    // Λήψη όλων των διαθέσιμων email κατά την εκκίνηση του component
    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const emails = await getAvailableEmails(); // Κλήση API
                setAvailableEmails(emails); // Αποθήκευση
            } catch (error) {
                showAlert('Αποτυχία φόρτωσης διαθέσιμων emails', 'warning'); // Σε περίπτωση σφάλματος
            }
        };
        fetchEmails();
    }, []);

    // Εμφάνιση alert
    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000); // Αυτόματη απόκρυψη μετά από 3 δευτερόλεπτα
    };

    // Καθαρισμός πεδίων της φόρμας
    const clearForm = () => {
        setRecipients('');
        setEmailSubject('');
        emailEditorRef.current.editor.loadDesign({}); // Καθαρισμός περιεχομένου editor
    };

    // Ενημέρωση πεδίου email και εμφάνιση προτάσεων
    const handleEmailInput = (e) => {
        const value = e.target.value;
        setRecipients(value);

        const currentEmail = value.split(',').pop().trim(); // Το τελευταίο email για autocomplete

        if (currentEmail.length > 0) {
            const filteredSuggestions = availableEmails.filter(email =>
                email.toLowerCase().includes(currentEmail.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Όταν επιλέγεται μία πρόταση email
    const handleSelectEmail = (email) => {
        const currentEmails = recipients.split(',').map(e => e.trim());
        currentEmails.pop(); // Αφαίρεση του τελευταίου που ήταν μισό
        const newRecipients = [...currentEmails, email].join(', ');
        setRecipients(newRecipients + (newRecipients ? ', ' : ''));
        setShowSuggestions(false);
    };

    // Επιλογή για αποστολή σε όλους
    const handleSendToAllChange = (e) => {
        setSendToAll(e.target.checked);
        if (e.target.checked && availableEmails.length > 0) {
            setRecipients(availableEmails.join(', ')); // Συμπλήρωση όλων των emails
            setShowSuggestions(false);
        } else {
            setRecipients('');
        }
    };

    // Έλεγχος εγκυρότητας email
    const validateEmail = (email) => {
        email = email.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Υποβολή φόρμας
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loadingState.isLoading) return;

        setLoadingState({ isLoading: true, message: 'Προετοιμασία email...' });
        setAlert({ show: false, message: '', type: '' });

        try {
            if (!emailSubject.trim()) {
                showAlert('Το θέμα είναι υποχρεωτικό', 'danger');
                setLoadingState({ isLoading: false, message: '' });
                return;
            }
            let emailList = [];

            // Αν δεν γίνεται αποστολή σε όλους
            if (!sendToAll) {
                emailList = recipients
                    .split(',')
                    .map(email => email.trim())
                    .filter(email => email.length > 0);

                const invalidEmails = emailList.filter(email => !validateEmail(email));
                if (invalidEmails.length > 0) {
                    showAlert(`Μη έγκυρη μορφή email: ${invalidEmails.join(', ')}`, 'danger');
                    setLoadingState({ isLoading: false, message: '' });
                    return;
                }

                if (emailList.length === 0) {
                    showAlert('Οι παραλήπτες είναι υποχρεωτικοί όταν δεν γίνεται αποστολή σε όλους', 'danger');
                    setLoadingState({ isLoading: false, message: '' });
                    return;
                }
            }

            // Εξαγωγή HTML περιεχομένου από τον email editor
            const emailContent = await new Promise((resolve, reject) => {
                emailEditorRef.current.editor.exportHtml((data) => {
                    if (!data.html) {
                        reject(new Error('Το περιεχόμενο του email είναι υποχρεωτικό'));
                        return;
                    }
                    resolve(data.html);
                });
            });

            setLoadingState({ isLoading: true, message: sendToAll ? 'Αποστολή σε όλους τους χρήστες...' : 'Αποστολή email...' });

            const response = await sendCustomEmail({
                recipients: emailList,
                sendToAll,
                subject: emailSubject,
                body: emailContent
            });

            if (response.success) {
                showAlert(response.message, 'success');
                await new Promise(resolve => setTimeout(resolve, 1000));
                clearForm();
            }

        } catch (error) {
            showAlert(error.message || 'Σφάλμα κατά την αποστολή του email', 'danger');
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };

    // Render φόρμας
    return (
        <div className="container mt-5">
            <h2>Αποστολή Προσαρμοσμένου Email</h2>

            {/* Alert μηνύματα */}
            {alert.show && (
                <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                    {alert.message}
                    <button type="button" className="btn-close" onClick={() => setAlert({ show: false, message: '', type: '' })}></button>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Πεδίο παραληπτών */}
                <div className="form-group mb-3 position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label>Παραλήπτες (χωρισμένοι με κόμμα)</label>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="sendToAll"
                                checked={sendToAll}
                                onChange={handleSendToAllChange}
                            />
                            <label className="form-check-label" htmlFor="sendToAll">
                                Αποστολή σε Όλους τους Χρήστες
                            </label>
                        </div>
                    </div>
                    <input
                        className="form-control"
                        value={recipients}
                        onChange={handleEmailInput}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Απόκρυψη με καθυστέρηση για να προλάβει το click
                        required
                        disabled={sendToAll}
                    />

                    {/* Προτάσεις */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded-bottom shadow-sm"
                            style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            {suggestions.map((email, index) => (
                                <div
                                    key={index}
                                    className="p-2 hover-bg-light cursor-pointer"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSelectEmail(email)}
                                    onMouseDown={(e) => e.preventDefault()} // Για να μην χαθεί το focus
                                >
                                    {email}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Πεδίο θέματος */}
                <div className="form-group mb-3">
                    <label>Θέμα</label>
                    <input
                        className="form-control"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        required
                    />
                </div>

                {/* Editor περιεχομένου */}
                <div style={{ height: '600px', marginBottom: '20px' }}>
                    <EmailEditor
                        ref={emailEditorRef}
                        minHeight="600px"
                        options={{
                            features: {
                                backgroundColor: '#ffffff',
                                padding: '20px'
                            },
                            appearance: {
                                theme: 'light',
                                panels: {
                                    tools: {
                                        dock: 'left'
                                    }
                                }
                            }
                        }}
                    />
                </div>

                {/* Κουμπί υποβολής */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loadingState.isLoading}
                >
                    {loadingState.isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            {loadingState.message || 'Αποστολή...'}
                        </>
                    ) : 'Αποστολή Email'}
                </button>
            </form>
        </div>
    );
};

export default EmailForm;
