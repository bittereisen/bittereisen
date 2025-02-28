const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true}); // No spaces between curly braces
const DOMPurify = require('dompurify'); // No spaces between curly braces

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

    let email = req.body.email;

    // Sanitize the email input to remove any malicious content
    email = DOMPurify.sanitize(email);

    // Validate the email format
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

