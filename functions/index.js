// Import Firebase Functions and Firebase Admin SDK
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Function to handle email submission
exports.submitEmail = functions.https.onRequest(async (req, res) => { 
  // Handle POST request
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
    console.error("Error writing document: ", error);
    res.status(500).send('Internal Server Error');
  }
});   

// Helper function to validate email
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}

