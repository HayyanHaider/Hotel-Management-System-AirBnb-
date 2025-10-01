// Simple notification stubs for email/SMS/push
// Replace implementations with real providers later

const sendEmail = async (to, subject, body) => {
  console.log(`[Email] to=${to} subject=${subject} body=${body}`);
};

const sendSMS = async (to, body) => {
  console.log(`[SMS] to=${to} body=${body}`);
};

const sendPush = async (to, title, body) => {
  console.log(`[Push] to=${to} title=${title} body=${body}`);
};

module.exports = { sendEmail, sendSMS, sendPush };


