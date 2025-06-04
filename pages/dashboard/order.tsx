import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useUserContext } from "../../context/UserContext";
import {
  Grid, Paper, Typography, Select, MenuItem, TextField,
  FormControl, InputLabel, Button, Stack
} from "@mui/material";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  addDoc,
  getDoc,         // ✅ 추가
  increment        // ✅ 추가

} from "firebase/firestore";

export default function OrderPage() {
  const [services, setServices] = useState<any[]>([]);
  const [category, setCategory] = useState("전체");
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [customComments, setCustomComments] = useState("");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [guideText, setGuideText] = useState("")
  const { user, userPoints, setUserPoints } = useUserContext();
  const customCommentIds = ["5796", "5797", "5798", "4822"];

  useEffect(() => {
    const fetchServices = async () => {
      const q = query(collection(db, "order_services"), orderBy("order"));
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          serviceId: data.serviceId || data.id,
          category: data.category || "",
          description: data.description || "설명이 등록되지 않은 서비스입니다.",
        };
      });
      setServices(result);

      const defaultSvc = result.find((s: any) => s.serviceId?.toString() === "5300");
      if (defaultSvc) {
        setSelectedService(defaultSvc);
        setCategory(defaultSvc.category);
      }
    };

    fetchServices();
  }, []);

  const actualQuantity =
    selectedService?.type === "Custom Comments"
      ? customComments.split("\n").filter((line) => line.trim() !== "").length
      : quantity;

  useEffect(() => {
    if (selectedService) {
      const rate = selectedService.price || 0;
      const total = rate * actualQuantity;
      setTotalPrice(total);
    }
  }, [selectedService, quantity, customComments]);

    const handleOrder = async () => {
      if (!selectedService) {
        alert("서비스를 선택해주세요.");
        return;
      }

      if (
        typeof selectedService.min === "number" &&
        typeof selectedService.max === "number" &&
        (actualQuantity < selectedService.min || actualQuantity > selectedService.max)
      ) {
        alert(`수량은 ${selectedService.min} ~ ${selectedService.max} 사이여야 합니다.`);
        return;
      }

      if ((userPoints || 0) < totalPrice) {
        alert("❌ 보유 포인트가 부족합니다.");
        return;
      }

      try {
              if (selectedService.provider === "manual") {
        const orderDoc = {
          serviceId: selectedService.serviceId,
          provider: "manual",
          link,
          quantity: actualQuantity,
          userId: user?.uid,
          serviceName: selectedService.displayName,
          status: "접수됨",
          createdAt: new Date(),

          ...(selectedService?.type === "Custom Comments" && {
            customData: customComments,
          }),

          ...(guideText && { guideText }), // ✅ guideText가 있을 경우에만 포함
        };

          const docRef = await addDoc(collection(db, "orders"), orderDoc);

          alert(`✅ 주문 성공! 주문 ID: ${docRef.id}`);

        if (user && user.uid) {
          const userRef = doc(db, "users", user.uid);
          const newPoint = Math.max((userPoints || 0) - totalPrice, 0);
          await updateDoc(userRef, { points: newPoint });
          if (setUserPoints) setUserPoints(newPoint);

          // ✅ 하위 회원 총 결제 금액 누적
          await updateDoc(userRef, {
            totalSpent: increment(totalPrice),
          });

          // ✅ 총판 수익 누적 (있는 경우에만)
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          if (userData?.referrerUid) {
            const referrerRef = doc(db, "users", userData.referrerUid);
            await updateDoc(referrerRef, {
              earnings: increment(Math.floor(totalPrice * 0.1)),
            });
          }
        }
        } else {
          // ✅ 외부 API 서비스는 기존 방식 유지
          const apiEndpoint =
            selectedService.provider === "stream" ? "/api/order-stream" : "/api/order";

          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service: selectedService.serviceId,
              link,
              quantity: actualQuantity,
              userId: user?.uid,

              ...(selectedService?.type === "Custom Comments" && {
                comments: customComments,
              }),
            }),
          });

          const result = await response.json();

          if (result.order) {
            // ✅ Firestore에 저장
          const externalOrderDoc = {
            serviceId: selectedService.serviceId,
            provider: selectedService.provider,
            externalOrderId: result.order,
            link,
            quantity: actualQuantity,
            userId: user?.uid,
            serviceName: selectedService.displayName,
            status: "접수됨",
            createdAt: new Date(),

            ...(selectedService?.type === "Custom Comments" && {
              customData: customComments,
            }),
          };
            await addDoc(collection(db, "orders_external"), externalOrderDoc);

            alert(`✅ 주문 성공! 주문 ID: ${result.order}`);

            if (user && user.uid) {
              const newPoint = Math.max((userPoints || 0) - totalPrice, 0);
              await updateDoc(doc(db, "users", user.uid), {
                points: newPoint,
              });
              if (setUserPoints) setUserPoints(newPoint);
            }
          } else {
            alert(`❌ 주문 실패: ${JSON.stringify(result.error)}`);
          }
        }
      } catch (error: any) {
        alert("❌ 네트워크 오류 또는 서버 에러 발생");
        console.error(error);
      }
};
  const categoryOrder = Array.from(new Set(services.map((svc) => svc.category)));
  const uniqueCategories = ["전체", ...categoryOrder];
  const filteredServices = services.filter((s: any) => category === "전체" || s.category === category);
  const formattedPrice = (v: number) => (v < 1 ? v.toFixed(1) : Math.round(v).toString());
  const requiredAmount = totalPrice - (userPoints || 0) > 0 ? (totalPrice - (userPoints || 0)) : 0;

  return (
    <DashboardLayout>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={category}
                label="카테고리"
                onChange={(e) => setCategory(e.target.value)}
              >
                {uniqueCategories.map((cat, i) => (
                  <MenuItem key={i} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>서비스 선택</InputLabel>
              <Select
                value={selectedService?.serviceId || ""}
                label="서비스 선택"
                onChange={(e) => {
                  const svc = services.find(
                    (s: any) => s.serviceId?.toString() === e.target.value
                  );
                  setSelectedService(svc || null);
                }}
              >
                {filteredServices.map((s: any) => (
                  <MenuItem key={s.serviceId} value={s.serviceId.toString()}>
                    {s.displayName} (단가: {formattedPrice(s.price)}원)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedService && (
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2">📄 서비스 설명</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line", mt: 1 }}>
                  {selectedService.description}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  수량 범위: {selectedService.min} ~ {selectedService.max}
                </Typography>
              </Paper>
            )}

<TextField
  fullWidth
  label="주문할 링크"
  value={link}
  onChange={(e) => setLink(e.target.value)}
/>

{(() => {
  const sid = selectedService?.serviceId?.toString();

  if (selectedService?.type === "Custom Comments") {
    return (
      <TextField
        fullWidth
        label="댓글 작성 (한 줄당 1개)"
        multiline
        rows={4}
        value={customComments}
        onChange={(e) => setCustomComments(e.target.value)}
      />
    );
  } else if (sid === "9901" || sid === "9902") {
    return (
      <>
        <TextField
          fullWidth
          label="수량"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <TextField
          fullWidth
          label="가이드라인 작성"
          multiline
          rows={8}
          value={guideText} // ✅ 올바른 상태 연결
          onChange={(e) => setGuideText(e.target.value)} // ✅ guideText에 저장
          placeholder={`예시)
- 검색 키워드: 강남고기맛집, 강남돼지고기맛집
- 업체 전화번호 : 02-***-****
- 플레이스 URL : https://m.place.naver.com/restaurant/16869*****
- 업체 특징 및 홍보 포인트:
  1. 돼지고기를 직접 구워주는 식당
  2. 국내산 돼지고기만을 사용하여 부드러운 식감과 풍부한 육즙
  3. 회식하기 좋은 큰 룸형식의 홀이 구비되어 있음
  ...
`}
          sx={{ mt: 2 }}
        />
      </>
    );
  } else {
    return (
      <TextField
        fullWidth
        label="수량"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
    );
  }
})()}

            {selectedService && (
              <Typography fontWeight="bold">
                💰 총 예상 금액: {Number(totalPrice).toLocaleString()}원
              </Typography>
            )}

            <Button variant="contained" fullWidth onClick={handleOrder}>주문하기</Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">💰 보유잔액</Typography>
              <Typography variant="h6">
                {userPoints !== null ? `${userPoints.toLocaleString()}원` : "로딩 중..."}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">💵 예상금액</Typography>
              <Typography variant="h6">{Number(totalPrice).toLocaleString()}원</Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">💸 필요금액 </Typography>
              <Typography variant="h6">
                {requiredAmount.toLocaleString()}원
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => window.location.href = "/dashboard/charge"}
            >
              충전하러 가기
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
