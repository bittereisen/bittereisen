const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors'); // Import cors module

// Initialize Firebase Admin SDK
admin.initializeApp();

// CORS handler to allow all origins
const corsHandler = cors({origin: true});

/**
 * Function to submit email to Firestore.
 * @param {Object} req The request object
 * @param {Object} res The response object
 */

exports.submitEmail = functions.https.onRequest((req, res) => {
  console.log('Function is being deployed!');

  // Handle preflight request (OPTIONS)
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(204).send(''); // Respond to preflight with a 204
    }

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const email = req.body.email;
    if (!email || !validateEmail(email)) {
      return res.status(400).send('Invalid email');
    }

    try {
      // Save email to Firestore
      await admin.firestore().collection('emails').add({
        email: email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(200).send('Email submitted successfully');
    } catch (error) {
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

