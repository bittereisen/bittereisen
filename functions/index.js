const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const {JSDOM} = require('jsdom');
const DOMPurify = require('dompurify')(new JSDOM().window); // Pass the jsdom window to DOMPurify

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud function to handle email submission.
 * @param {Object} req The request object
 * @param {Object} res The response object
 */
exports.submitEmail = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    console.log('Function is being deployed!');

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

    try {
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

