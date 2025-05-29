// CommonJS 스타일 (권장)
const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fetchAndStoreStreamPromotion() {
  const API_URL = "https://stream-promotion.com/api/v2";
  const API_KEY = "eafb9085d5c4b00a3a6d97e773221d85";

  const res = await axios.post(API_URL, {
    key: API_KEY,
    action: "services"
  });

  const services = res.data;
  const batch = db.batch();

  services.forEach((item) => {
    const uid = `stream_${item.service}`;
    const ref = db.collection("services2").doc(uid);
    batch.set(ref, {
      uid,
      provider: "stream",
      serviceId: item.service,
      displayName: item.name,
      price: item.rate,
      min: item.min,
      max: item.max,
    });
  });

  await batch.commit();
  console.log("✅ Stream-promotion 서비스 불러오기 완료!");
}

fetchAndStoreStreamPromotion();