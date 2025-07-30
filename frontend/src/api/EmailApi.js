import axios from 'axios';
import { BACKEND_ROUTES_API } from '../config/config';

export const sendCustomEmail = async (emailData) => {
  const url = `${BACKEND_ROUTES_API}EmailRouter.php`;

  try {
    const requestData = {
      sendToAll: Boolean(emailData.sendToAll),
      subject: emailData.subject,
      body: emailData.body,
      recipients: emailData.sendToAll ? [] : (emailData.recipients || []).map(email => email.trim())
    };

    // console.log('Αποστολή αιτήματος:', requestData);

    const response = await axios.post(url, requestData, {
      params: { action: 'send' },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 60000 // Αυξημένο χρονικό όριο για μαζική αποστολή
    });

    // Έλεγχος αν υπάρχουν δεδομένα απόκρισης και η ιδιότητα επιτυχίας
    if (!response.data || response.data.success === false) {
      throw new Error(response.data?.error || 'Αποτυχία αποστολής email');
    }

    // Επιστροφή των επιτυχημένων δεδομένων απόκρισης
    return {
      success: true,
      sent: true,
      message: response.data.message || 'Το email στάλθηκε με επιτυχία',
      recipients: response.data.recipients || []
    };

  } catch (error) {
    // console.error('Σφάλμα αποστολής email:', error.response?.data || error);
    throw new Error(
      error.response?.data?.error ||
      error.message ||
      'Σφάλμα κατά την αποστολή του email'
    );
  }
};

export const getAvailableEmails = async () => {
  const url = `${BACKEND_ROUTES_API}EmailRouter.php`;

  try {
    const response = await axios.get(url, {
      params: { action: 'getEmails' },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.data || !response.data.success) {
      // console.error('Απόκριση διακομιστή:', response.data);
      throw new Error(response.data?.error || 'Αποτυχία φόρτωσης email');
    }

    return response.data.emails || [];
  } catch (error) {
    // console.error('Σφάλμα φόρτωσης email:', error);
    throw new Error('Αποτυχία φόρτωσης προτάσεων email');
  }
};
