const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

// Inisialisasi Firebase Admin SDK
const serviceAccount = require("./admin/mokoli-561f5-firebase-adminsdk-ttpq4-bd272aa01b.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Fungsi untuk mengambil tanggal dari timestamp (format: DD-MM-YYYY)
function getDateFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Endpoint untuk menerima data dari ESP32
app.post("/data", (req, res) => {
  const data = req.body;
  const timestamp = Date.now(); // Timestamp saat ini (ms)
  const date = getDateFromTimestamp(timestamp);

  const sensorDataRef = admin.firestore().collection("SensorData").doc(date);

  sensorDataRef
    .get()
    .then((doc) => {
      if (!doc.exists) {
        // Jika dokumen tanggal belum ada, buat dokumen baru dengan array kosong
        return sensorDataRef.set({});
      } else {
        // Jika dokumen tanggal sudah ada, dapatkan data yang ada
        return doc.data();
      }
    })
    .then((existingData) => {
      const newData = {
        Energy: data.energy,
        Timestamp: data.timestamp,
      };

      // Tambahkan data baru ke dalam array di dokumen tanggal
      const newDataIndex = Object.keys(existingData).length.toString();
      existingData[newDataIndex] = newData;

      // Update dokumen tanggal dengan data baru
      return sensorDataRef.set(existingData);
    })
    .then(() => {
      console.log("Data saved to Firestore:", data);
      res.status(200).send("Data saved to Firestore");
    })
    .catch((error) => {
      console.error("Error saving data to Firestore:", error);
      res.status(500).send("Error saving data to Firestore");
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
