const crypto = require('crypto');

function signUpload({ timestamp, folder = '' }) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  // Build the signature string. We’ll allow folder, timestamp only.
  const toSign = `${folder ? `folder=${folder}&` : ''}timestamp=${timestamp}${apiSecret ? '' : ''}`;
  const signature = crypto.createHash('sha1')
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');
  return signature;
}

module.exports = { signUpload };
