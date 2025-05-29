import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  Paper,
  Chip,
  useMediaQuery,
} from "@mui/material";
import DashboardLayout from "../../components/DashboardLayout";
import dayjs from "dayjs";
import { db } from "../../lib/firebaseClient";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useUserContext } from "../../context/UserContext";

// 타입 정의
type AdType = "place" | "tmap";
type PlaceTask = "traffic" | "save" | "share";
type TmapTask = "rank";
type TaskType = PlaceTask | TmapTask;
type SeasonValue = "good" | "normal" | "bad";

type PricingData = {
  place: {
    season: SeasonValue;
    prices: Record<PlaceTask, number>;
  };
  tmap: {
    season: SeasonValue;
    prices: Record<TmapTask, number>;
  };
};

export default function TrafficOrderPage() {
  const { user, userEmail, userPoints, setUserPoints } = useUserContext();
  const isAdmin = userEmail === "dltjdqls9565@naver.com";
  const isMobile = useMediaQuery("(max-width:600px)");
  const [adType, setAdType] = useState<AdType>("place");
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [keywords, setKeywords] = useState("");
  const [trackingKeyword, setTrackingKeyword] = useState("");
  const [link, setLink] = useState("");
  const [dailyTraffic, setDailyTraffic] = useState(100);
  const [startDate, setStartDate] = useState(dayjs().add(1, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().add(3, "day").format("YYYY-MM-DD"));
  const [pricing, setPricing] = useState<PricingData | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      const ref = doc(db, "settings", "trafficPricing");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPricing(snap.data() as PricingData);
      }
    };
    fetchPricing();
  }, []);

  const handlePricingUpdate = async () => {
    if (!pricing) return;
    try {
      await updateDoc(doc(db, "settings", "trafficPricing"), pricing);
      alert("가격 및 권장 시기가 업데이트되었습니다.");
    } catch (err) {
      console.error(err);
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const seasonLabel: Record<SeasonValue, { text: string; color: "success" | "warning" | "error" }> = {
    good: { text: "권장 시기", color: "success" },
    normal: { text: "애매한 시기", color: "warning" },
    bad: { text: "비권장 시기", color: "error" },
  };

  const totalDays = dayjs(endDate).diff(dayjs(startDate), "day") + 1;

  let unitPrice = 0;
  if (pricing && adType && taskType) {
    if (adType === "place" && ["traffic", "save", "share"].includes(taskType)) {
      unitPrice = pricing.place.prices[taskType as PlaceTask];
    } else if (adType === "tmap" && taskType === "rank") {
      unitPrice = pricing.tmap.prices["rank"];
    }
  }

  const totalPrice = dailyTraffic * totalDays * unitPrice;

  const handleSubmit = async () => {
    if (!userEmail) return alert("로그인이 필요합니다.");
    if (!user || userPoints === null) return alert("유저 정보를 불러오는 중입니다.");

    if (userPoints < totalPrice) {
      alert("❌ 보유 포인트가 부족합니다. 충전 후 다시 시도해주세요.");
      return;
    }

    try {
      // 1. 주문 저장
      await addDoc(collection(db, "traffic_orders"), {
        userEmail,
        adType,
        taskType,
        keywords,
        trackingKeyword,
        link,
        dailyTraffic,
        startDate,
        endDate,
        totalDays,
        unitPrice,
        totalPrice,
        status: "대기",
        createdAt: serverTimestamp(),
      });

      // 2. 포인트 차감
      const userRef = doc(db, "users", user.uid);
      const newPoints = Math.max(userPoints - totalPrice, 0);
      await updateDoc(userRef, { points: newPoints });

      // 3. UI 업데이트
      setUserPoints(newPoints);

      alert("✅ 신청이 접수되었습니다.");
    } catch (error) {
      console.error("신청 중 오류:", error);
      alert("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* 공지 영역 */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f5f5f5" }}>
          <Typography variant="h6" gutterBottom>📢 필독 공지</Typography>
          <Typography variant="body2" gutterBottom>⚠️ 트래픽을 포함한 리워드 작업 가격은 항시 변동될 수 있으니 현재 가격표를 확인해주세요.</Typography>
          <Typography variant="body2" gutterBottom>🔎 '키워드'란 검색어를 의미합니다. 해당 플레이스가 5위 이내 나오는 키워드 최소 3개~최대 6개까지 입력가능합니다.</Typography>
          <Typography variant="body2" gutterBottom>📆 리워드 작업은 네이버 로직 특성상 권장시기가 있고 비권장 시기가 있습니다. 꼭 시기를 확인 후 참고하여 주문 바랍니다.</Typography>
          <Typography variant="body2" gutterBottom>🚫 본 작업은 '순위보장형'이 아닙니다. 다만 순위가 오르지 않을 시기에는 미리 해당 페이지에서 알려드리도록 하겠습니다.</Typography>
          <Typography variant="body2">💬 궁금한 사항은 우측 하단 카카오톡 문의 버튼을 클릭하시어 문의주세요. 하나부터 열까지 친절하고 정확하게 알려드리겠습니다.</Typography>
        </Paper>

        {/* 시기 및 가격 영역 */}
       {pricing && (
          <Paper sx={{ p: 2, mb: 4, backgroundColor: "#e3f2fd" }}>
            <Typography variant="subtitle1" gutterBottom>📊 시기 / 가격 안내</Typography>
            <Grid container spacing={2}>
              {(["place", "tmap"] as AdType[]).map((type) => (
                <Grid item xs={12} md={6} key={type}>
                  <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: 2, backgroundColor: "#fff" }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography fontWeight="bold">{type === "place" ? "플레이스" : "티맵"}</Typography>
                      <Chip
                        label={seasonLabel[pricing[type].season].text}
                        color={seasonLabel[pricing[type].season].color}
                        size="small"
                      />
                    </Box>

                    {isAdmin ? (
                      <>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>권장 시기</InputLabel>
                          <Select
                            value={pricing[type].season}
                            label="권장 시기"
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                [type]: {
                                  ...pricing[type],
                                  season: e.target.value as SeasonValue,
                                },
                              })
                            }
                          >
                            <MenuItem value="good">권장 시기</MenuItem>
                            <MenuItem value="normal">애매한 시기</MenuItem>
                            <MenuItem value="bad">비권장 시기</MenuItem>
                          </Select>
                        </FormControl>

                        {Object.keys(pricing[type].prices).map((taskKey) => (
                          <TextField
                            key={taskKey}
                            fullWidth
                            label={`${taskKey} 가격`}
                            type="number"
                            value={pricing[type].prices[taskKey as keyof typeof pricing[AdType]["prices"]]}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                [type]: {
                                  ...pricing[type],
                                  prices: {
                                    ...pricing[type].prices,
                                    [taskKey]: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </>
                    ) : (
                      <Box display="flex" gap={2} flexWrap="wrap">
                        {Object.entries(pricing[type].prices).map(([k, v]) => (
                          <Typography variant="body2" key={k}>
                            {k}: {v}원
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>

            {isAdmin && (
              <Box mt={2}>
                <Button variant="contained" color="secondary" onClick={handlePricingUpdate} fullWidth={isMobile}>
                  가격 및 시기 저장
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {/* 신청 폼 */}
        <Typography variant="h5" gutterBottom>트래픽 광고 신청</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Select value={adType} onChange={(e) => setAdType(e.target.value as AdType)}>
                <MenuItem value="place">플레이스</MenuItem>
                <MenuItem value="tmap">티맵</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>세부작업</InputLabel>
              <Select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
                {(adType === "place" ? ["traffic", "save", "share"] : ["rank"]).map((task) => (
                  <MenuItem key={task} value={task}>{task}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="키워드" value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="순위추적 키워드" value={trackingKeyword} onChange={(e) => setTrackingKeyword(e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="링크" value={link} onChange={(e) => setLink(e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="1일 유입량" type="number" value={dailyTraffic} onChange={(e) => setDailyTraffic(Number(e.target.value))} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="시작일" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={2} flexWrap="wrap" justifyContent={isMobile ? "center" : "flex-end"}>
              {[3, 7, 10].map((d) => (
                <Button key={d} variant="outlined" onClick={() => setEndDate(dayjs(startDate).add(d - 1, "day").format("YYYY-MM-DD"))}>
                  {d}일
                </Button>
              ))}
            </Box>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="마감일" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="총 작업일 수" value={totalDays} disabled /></Grid>
          <Grid item xs={12}>
            <Typography variant="h6">총 금액: {totalPrice.toLocaleString()}원</Typography>
          </Grid>
          <Grid item xs={12}>
            <Button fullWidth variant="contained" color="primary" onClick={handleSubmit}>
              플레이스 광고 등록 완료
            </Button>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
}