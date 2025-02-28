const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true}); // Enable CORS for all origins
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Function to submit email to Firestore.
 * @param {Object} req The request object
 * @param {Object} res The response object
 */
exports.submitEmail = functions.https.onRequest(async (req, res) => {
  // Use CORS middleware to handle the CORS headers
  cors(req, res, async () => {
    console.log('Function is being deployed!');

    // Allow only POST requests (no CORS handling here)
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const email = req.body.email;
    if (!email || !validateEmail(email)) {
      return res.status(400).send('Invalid email');
    }

    // Use try-catch around the Firestore write operation
    try {
      await admin.firestore().collection('emails').add({
        email: email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(200).send('Email submitted successfully');
    } catch (error) {
      // Log the error and return 500 Internal Server Error
      console.error('Error writing document: ', error);
      res.status(500).send('Internal Server Error');
    }
  });
});

/**
 * Function to validate email format.
 * @param {string} email The email address to validate.
 * @return {boolean} Whether the email is valid.
 */
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}

/**
 * Function to export emails to a CSV file.
 * This will export all emails stored in Firestore to a CSV file.
 */
exports.exportEmailsToCSV = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const emailsRef = db.collection('emails');
  // Get all email documents
  const snapshot = await emailsRef.get();

  // If no documents, return early
  if (snapshot.empty) {
    return res.status(404).send('No emails found.');
  }

  // Prepare the data for CSV
  const emails = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    emails.push({
      email: data.email,
      timestamp: data.timestamp.toDate().toISOString(), // Convert timestamp to ISO string
    });
  });

  // CSV Writer setup
  const csvWriter = createCsvWriter({
    path: 'emails.csv', // Save to the current directory on the server
    header: [
      {id: 'email', title: 'Email'},
      {id: 'timestamp', title: 'Timestamp'},
    ],
  });

  // Write the data to a CSV file
  try {
    await csvWriter.writeRecords(emails);
    console.log('Exported emails to emails.csv');
    res.status(200).send('Emails exported successfully.');
  } catch (error) {
    console.error('Error exporting emails:', error);
    res.status(500).send('Error exporting emails.');
  }
});

