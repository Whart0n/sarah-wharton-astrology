// using Twilio SendGrid's v3 Node.js Library
require('dotenv').config({ path: '.env.local' });
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY);
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
  to: 'mpwharton@gmail.com', // Change to your recipient
  from: 'sarah@sarahwharton.com', // Change to your verified sender
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })
