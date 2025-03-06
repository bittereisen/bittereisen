const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const {JSDOM} = require('jsdom');
const DOMPurify = require('dompurify')(new JSDOM().window);
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Retrieve Brevo API Key securely from Firebase Config
const BREVO_API_KEY = functions.config().brevo.api_key;

const REDDIT_PIXEL_ID = 'a2_gkmnghdkaj6';
const REDDIT_CAPI_URL = 'https://events.reddit.com/v3';

/**
 * Sends event data to Reddit Conversion API.
 * @param {string} email - The email of the user.
 * @param {string} userAgent - The user's browser agent.
 * @param {string} ip - The user's IP address.
 * @return {Promise<void>}
 */
async function sendToRedditCAPI(email, userAgent, ip) {
  try {
    const response = await axios.post(REDDIT_CAPI_URL, {
      event: 'SubmitEmail',
      pixel_id: REDDIT_PIXEL_ID,
      action_source: 'website',
      timestamp: Math.floor(Date.now() / 1000),
      user_data: {
        email,
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
 * Sends a confirmation email via Brevo.
 * @param {string} email - The email of the user.
 * @return {Promise<void>}
 */
async function sendConfirmationEmail(email) {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'BitteReisen', email: 'your-email@domain.com' },
        to: [{ email }],
        subject: 'Welcome to BitteReisen Sweepstakes!',
	htmlContent: `<p>Hi there,</p>
              <p>Thanks for signing up! You've successfully entered the BitteReisen sweepstakes.</p>
              <p>Good luck!</p>
              <p>Best,<br>BitteReisen Team</p>`,

      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Brevo Email Sent:', response.data);
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error.response ? error.response.data : error.message);
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

    let {email} = req.body;
    email = DOMPurify.sanitize(email);

    if (!email || !validateEmail(email)) {
      return res.status(400).send('Invalid email');
    }

    try {
      // Store email in Firestore
      await admin.firestore().collection('emails').add({
        email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send data to Reddit CAPI
      await sendToRedditCAPI(
 // Send confirmation email via Brevo
      await sendConfirmationEmail(email);
      res.status(200).send('Email submitted successfully');
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});

/**
 * Validate email format.
 * @param {string} email - The email address to validate.
 * @return {boolean} True if email is valid, false otherwise.
 */
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
}
