import { useEffect } from "react";
import { db } from "@/lib/firebaseClient";
import { doc, setDoc } from "firebase/firestore";

export default function InsertService3() {
  useEffect(() => {
    const insertData = async () => {
      const services = [
        {
          id: "manual_9901",
          data: {
            serviceId: 9901,
            displayName: "블로그 리뷰",
            description: "리뷰할 링크와 요청사항을 남겨주세요. 담당자가 수동으로 진행합니다.",
            min: 1,
            max: 1,
            price: 0,
            category: "자체제공",
            provider: "manual",
            order: 1000,
          },
        },
        {
          id: "manual_9902",
          data: {
            serviceId: 9902,
            displayName: "프리미엄 영수증 리뷰",
            description: "영수증 사진과 매장 정보를 입력해주세요. 수동 검토 후 진행됩니다.",
            min: 1,
            max: 1,
            price: 0,
            category: "자체제공",
            provider: "manual",
            order: 1001,
          },
        },
      ];

      for (const svc of services) {
        await setDoc(doc(db, "service3", svc.id), svc.data);
        console.log(`✅ ${svc.id} 등록 완료`);
      }

      alert("📦 service3 등록 완료!");
    };

    insertData();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>service3 초기 데이터 입력 중...</h2>
      <p>콘솔을 확인하거나 Firestore에서 직접 확인해보세요.</p>
    </div>
  );
}