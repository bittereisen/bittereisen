const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const {JSDOM} = require('jsdom');
const DOMPurify = require('dompurify')(new JSDOM().window);
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();

const REDDIT_PIXEL_ID = 'a2_gkmnghdkaj6'; // ✅ Used properly
const REDDIT_CAPI_URL = 'https://events.reddit.com/v3'; // ✅ Used properly

/**
 * Sends event data to Reddit Conversion API.
 * @param {string} email The email of the user.
 * @param {string} userAgent The user's browser agent.
 * @param {string} ip The user's IP address.
 */
async function sendToRedditCAPI(email, userAgent, ip) {
  try {
    const response = await axios.post(REDDIT_CAPI_URL, {
      event: 'SubmitEmail', // Custom event name
      pixel_id: REDDIT_PIXEL_ID, // ✅ FIXED: Now using the correct variable
      action_source: 'website',
      timestamp: Math.floor(Date.now() / 1000), // UNIX timestamp
      user_data: {
        email: email,
        client_ip_address: ip,
        client_user_agent: userAgent,
      },
    });

    console.log('✅ Reddit CAPI Response:', response.data);
  } catch (error) {
    console.error('❌ Error sending to Reddit CAPI:', error.response ? error.response.data : error.message);
  }
}

/**
 * Cloud function to handle email submission.
 */
exports.submitEmail = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    console.log('📩 Email submission function triggered.');

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    let email = req.body.email;

    // Sanitize the email input
    email = DOMPurify.sanitize(email);

    // Validate the email format
    if (!email || !validateEmail(email)) {
      return res.status(400).send('Invalid email');
    }

    try {
      // Store email in Firestore
      await admin.firestore().collection('emails').add({
        email: email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send data to Reddit CAPI
      await sendToRedditCAPI(email, req.get('User-Agent'), req.ip);

      res.status(200).send('Email submitted successfully');
    } catch (error) {
      console.error('❌ Error writing document:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});

/**
 * Validate email format.
 * @param {string} email The email address to validate.
 * @return {boolean} True if email is valid, false otherwise.
 */
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}
