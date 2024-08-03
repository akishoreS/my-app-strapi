const fs = require('fs');

module.exports = ({ env }) => ({
  upload: {
    provider: 'google-cloud-storage',
    providerOptions: {
      bucketName: env('GCS_BUCKET_NAME'),
      publicFiles: true,
      uniform: false,
      serviceAccount: JSON.parse(fs.readFileSync(env('GCS_SERVICE_ACCOUNT_PATH'), 'utf8')),
    },
  },
});


  