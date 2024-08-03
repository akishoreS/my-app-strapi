'use strict';

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.GCS_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.GCS_BUCKET_NAME,
});

const bucket = admin.storage().bucket();

module.exports = {
  init() {
    return {
      async upload(file) {
        console.log('Uploading file:', file); // Debug log
        const { buffer, mime } = file;
        const fileName = `${file.hash}${file.ext}`;
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
          metadata: {
            contentType: mime,
          },
        });

        return new Promise((resolve, reject) => {
          stream.on('error', (err) => {
            console.error('Upload error:', err); // Debug log
            reject(err);
          });

          stream.on('finish', async () => {
            try {
              await fileUpload.makePublic();
              file.url = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;
              console.log('File uploaded to:', file.url); // Debug log
              resolve();
            } catch (error) {
              console.error('Error making file public:', error); // Debug log
              reject(error);
            }
          });

          stream.end(buffer);
        });
      },
      async delete(file) {
        console.log('Deleting file:', file); // Debug log
        const fileName = `${file.hash}${file.ext}`;
        return bucket.file(fileName).delete();
      },
    };
  },
};
