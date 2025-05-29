const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json"); // 🔐 위치 확인 필요

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const updateCollectionWithDescription = async (collectionName) => {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();

  snapshot.docs.forEach((docRef) => {
    const data = docRef.data();
    if (!data.description) {
      batch.update(docRef.ref, {
        description: "설명이 등록되지 않은 서비스입니다.",
      });
    }
  });

  await batch.commit();
  console.log(`✅ '${collectionName}' 컬렉션에 description 필드 추가 완료`);
};

const main = async () => {
  try {
    await updateCollectionWithDescription("order_services");
    console.log("🎉 모든 작업 완료");
    process.exit(0);
  } catch (err) {
    console.error("❌ 오류 발생:", err);
    process.exit(1);
  }
};

main();