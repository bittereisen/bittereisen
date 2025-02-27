const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
admin.initializeApp();

exports.submitEmail = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Your code for handling the email submission and saving it to Firebase
    if (req.method === 'POST') {
      const email = req.body.email;

      // Save to Firebase Realtime Database or Firestore
      admin.firestore().collection('emails').add({
        email: email,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        res.status(200).send({message: 'Email submitted successfully.'});
      }).catch((error) => {
        res.status(500).send({message: 'Error saving email.'});
      });
    } else {
      res.status(405).send({message: 'Method not allowed'});
    }
  });
});

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

