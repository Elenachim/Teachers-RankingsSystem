import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_ROUTE_URL } from '../../../config/config';

const XlsxUploader = ({ categoryInfo, onUploadSuccess, onAnalysisSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            setSelectedFile(file);
            setUploadStatus(null);
        } else {
            setSelectedFile(null);
            setUploadStatus({ error: true, message: 'Παρακαλώ επιλέξτε ένα αρχείο XLSX' });
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !categoryInfo) return;

        const formData = new FormData();
        formData.append('xlsxFile', selectedFile);
        formData.append('categoryId', categoryInfo.categoryid);

        try {
            setUploadStatus({ loading: true, message: 'Ανάλυση αρχείου...' });
            const response = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouterXl.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                console.log("Raw text data:", response.data.rawText); // Debug log
                onAnalysisSuccess(
                    response.data.data,
                    {
                        formatted: response.data.rawText.formatted,
                        original: response.data.rawText.original || response.data.rawText // Fallback
                    }
                );
                setUploadStatus({ success: true, message: 'Το αρχείο αναλύθηκε επιτυχώς.' });
            } else {
                setUploadStatus({ error: true, message: response.data.message });
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus({ error: true, message: 'Σφάλμα κατά την ανάλυση του αρχείου' });
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Μεταφόρτωση XLSX</h5>
                <div className="mb-3">
                    <input
                        type="file"
                        className="form-control"
                        accept=".xlsx"
                        onChange={handleFileSelect}
                    />
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="primary"
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploadStatus?.loading}
                    >
                        {uploadStatus?.loading ? 'Ανάλυση...' : 'Ανάλυση XLSX'}
                    </Button>
                </div>
                {uploadStatus && (
                    <div className={`alert mt-3 ${
                        uploadStatus.error ? 'alert-danger' :
                        uploadStatus.success ? 'alert-success' :
                        'alert-info'
                    }`}>
                        {uploadStatus.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default XlsxUploader;
