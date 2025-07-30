import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_ROUTE_URL } from '../../../config/config';

const FileUploader = ({ 
  categoryInfo, 
  onUploadSuccess, 
  onAnalysisSuccess, 
  acceptedFileTypes = '.pdf', 
  fileLabel = 'PDF'
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setSelectedFile(null);
      setUploadStatus({ error: true, message: `Παρακαλώ επιλέξτε ένα αρχείο ${fileLabel}` });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !categoryInfo) return;

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);
    formData.append('categoryId', categoryInfo.categoryid);

    try {
      setUploadStatus({ loading: true, message: 'Ανάλυση αρχείου...' });
      const response = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        onAnalysisSuccess(response.data.data, response.data.rawText);
        setUploadStatus({ success: true, message: 'Το αρχείο αναλύθηκε επιτυχώς. Παρακαλώ ελέγξτε τα δεδομένα.' });
      } else {
        setUploadStatus({ error: true, message: response.data.message });
      }
    } catch (error) {
      setUploadStatus({ error: true, message: 'Σφάλμα κατά την ανάλυση του αρχείου' });
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !categoryInfo) return;

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);
    formData.append('categoryId', categoryInfo.categoryid);

    try {
      setUploadStatus({ loading: true, message: 'Γίνεται μεταφόρτωση...' });
      const uploadResponse = await axios.post(`${BACKEND_ROUTE_URL}/AddFileRouter.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.success) {
        try {
          // Send email notifications
          const emailResponse = await axios.post(
            `${BACKEND_ROUTE_URL}/ListEmail.php`,
            {
              categoryid: categoryInfo.categoryid,
              season: categoryInfo.season,
              year: categoryInfo.year,
              type: categoryInfo.type,
              action: 'new'
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          setUploadStatus({
            success: true,
            message: emailResponse.data.success
              ? 'Το αρχείο μεταφορτώθηκε και οι ειδοποιήσεις στάλθηκαν με επιτυχία'
              : 'Το αρχείο μεταφορτώθηκε αλλά απέτυχε η αποστολή ειδοποιήσεων'
          });

          onUploadSuccess(categoryInfo.categoryid);
        } catch (emailError) {
          console.error('Email error:', emailError);
          setUploadStatus({
            warning: true,
            message: 'Το αρχείο μεταφορτώθηκε αλλά απέτυχε η αποστολή ειδοποιήσεων'
          });
          onUploadSuccess(categoryInfo.categoryid);
        }
      } else {
        setUploadStatus({ error: true, message: uploadResponse.data.message });
      }
    } catch (error) {
      setUploadStatus({ error: true, message: 'Σφάλμα κατά τη μεταφόρτωση: ' + error.message });
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Μεταφόρτωση {fileLabel}</h5>
        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
          />
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={handleFileUpload}
            disabled={!selectedFile || uploadStatus?.loading}
          >
            {uploadStatus?.loading ? 'Ανάλυση...' : `Ανάλυση ${fileLabel}`}
          </Button>
          <Button
            variant="success"
            onClick={handleUploadSubmit}
            disabled={!selectedFile || uploadStatus?.loading}
          >
            {uploadStatus?.loading ? 'Μεταφόρτωση...' : `Μεταφόρτωση ${fileLabel}`}
          </Button>
        </div>
        {uploadStatus && (
          <div className={`alert mt-3 ${
            uploadStatus.error ? 'alert-danger' :
            uploadStatus.success ? 'alert-success' :
            uploadStatus.warning ? 'alert-warning' :
            'alert-info'
          }`}>
            {uploadStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
