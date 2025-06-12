import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebaseClient";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  useMediaQuery,
  CircularProgress,
  Paper,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function PlaceRankPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [mid, setMid] = useState("");
  const [name, setName] = useState("");
  const [trackingList, setTrackingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rescanLoadingIds, setRescanLoadingIds] = useState<Set<string>>(new Set());
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const q = collection(db, "users", userId, "place_tracking");
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTrackingList(data);
    });
    return () => unsub();
  }, [userId]);

  const getTodayDateKey = () => {
    const now = new Date();
    now.setHours(now.getHours() + 9);
    return now.toISOString().slice(0, 10);
  };

  const removeRescanId = (id: string) => {
    setRescanLoadingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleRegister = async () => {
    if (!userId || !keyword || !mid || !name) return;
    if (trackingList.length >= 5) {
      alert("최대 5개 업체까지만 등록할 수 있습니다.");
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "users", userId, "place_tracking"), {
        keyword,
        mid,
        name,
        createdAt: serverTimestamp(),
        history: {},
      });

      const res = await fetch("https://api.hnbmarketing.co.kr/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, mid }),
      });

      const data = await res.json();
      const rank = Number(data.rank);
      const today = getTodayDateKey();

      if (!res.ok || !Number.isFinite(rank)) {
        alert("순위를 받아오지 못했습니다. 입력값을 확인해주세요.");
        await deleteDoc(docRef);
        return;
      }

      await updateDoc(docRef, {
        [`history.${today}`]: rank,
      });

      setKeyword("");
      setMid("");
      setName("");
    } catch (error) {
      alert("등록 중 오류가 발생했습니다.");
      console.error(error);
    }

    setLoading(false);
  };

  const handleDelete = async (trackId: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "place_tracking", trackId));
  };

  const handleRescan = async (item: any) => {
    if (!userId) return;
    setRescanLoadingIds((prev) => new Set(prev).add(item.id));

    try {
      const res = await fetch("https://api.hnbmarketing.co.kr/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: item.keyword, mid: item.mid }),
      });

      const data = await res.json();
      const rank = Number(data.rank);
      const today = getTodayDateKey();

      if (!res.ok || !Number.isFinite(rank)) {
        alert("재조회에 실패했습니다.");
        removeRescanId(item.id);
        return;
      }

      const history = item.history || {};
      const updated = { ...history, [today]: rank };
      const sorted = Object.entries(updated).sort(([a], [b]) => a.localeCompare(b));
      const limited = sorted.slice(-60);
      const limitedObj = Object.fromEntries(limited);

      await updateDoc(doc(db, "users", userId, "place_tracking", item.id), {
        history: limitedObj,
      });

      setTrackingList((prev) =>
        prev.map((docItem) =>
          docItem.id === item.id ? { ...docItem, history: limitedObj } : docItem
        )
      );
    } catch (error) {
      console.error("재조회 중 오류 발생:", error);
      alert("재조회 중 오류가 발생했습니다.");
    }

    removeRescanId(item.id);
  };

const transformedData = (() => {
  const dateMap: { [date: string]: any } = {};

  trackingList.forEach(({ mid, history }) => {
    const midKey = String(mid); // 핵심 포인트
    Object.entries(history || {}).forEach(([date, rank]) => {
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][midKey] = rank;
    });
  });

  return Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
})();

  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

  return (
    <DashboardLayout>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          플레이스 순위 추적
        </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>📢 플레이스 순위 조회 안내</strong><br />
            - 순위 데이터는 <strong>최대 60일간 보관</strong>되며 이후 자동 삭제됩니다.<br />
            - 조회 후 결과 반영까지 <strong>30초~60초</strong> 정도가 소요될 수 있습니다.<br />
             →새로고침을 누르거나, 페이지를 나가지 말고 기다려주세요.<br />
             <br />
            🔍 <strong>MID는 무엇인가요?</strong><br />
            - MID는 네이버 플레이스 링크에 포함된 업체 고유 번호입니다.<br />
            - 예: <span style={{ backgroundColor: "#f0f0f0", padding: "2px 4px", borderRadius: "4px" }}>
              https://map.naver.com/p/entry/place/<strong style={{ color: "#1976d2" }}>1686970821</strong>
            </span><br />
            - 이 링크에서 <strong style={{ color: "#1976d2" }}>1686970821</strong> 이 바로 MID입니다. 대표님 업체 플레이스 URL중 해당 숫자만 복사해 입력해 주세요.
          </Alert>
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={2} mb={4}>
          <TextField label="업체명" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="키워드" value={keyword} onChange={(e) => setKeyword(e.target.value)} fullWidth />
          <TextField label="MID" value={mid} onChange={(e) => setMid(e.target.value)} fullWidth />
          <Button variant="contained" onClick={handleRegister} disabled={loading || !keyword || !mid || !name}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "등록"}
          </Button>
        </Box>

        {/* 선형 그래프 시각화 */}
        {trackingList.length > 0 && (
          <Paper sx={{ p: 3, mt: 4, backgroundColor: '#1e293b' }}>
            <Typography variant="h6" sx={{ color: "#edd8b0", mb: 2 }}>
              📈 전체 업체 순위 변화 추이
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transformedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#fff" />
                <YAxis reversed stroke="#fff" />
                <Tooltip />
                <Legend />
                {trackingList.map((item, index) => (
                  <Line
                    key={item.mid}
                    type="monotone"
                    dataKey={item.mid}
                    name={item.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {trackingList.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary">
                    업체명: {item.name || "(미확인)"}
                  </Typography>
                  <Typography variant="h6">
                    {item.keyword} (MID: {item.mid})
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    등록일: {item.createdAt?.toDate?.()?.toLocaleDateString?.() || "-"}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {item.history &&
                      Object.entries(item.history)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, rank]: any) => (
                          <Box
                            key={date}
                            sx={{
                              backgroundColor: "#f5f5f5",
                              padding: "0.75rem",
                              borderRadius: "8px",
                              minWidth: "90px",
                              textAlign: "center",
                              flex: "0 1 auto",
                            }}
                          >
                            <Typography variant="h6" color="primary">
                              {rank}위
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {date}
                            </Typography>
                          </Box>
                        ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => handleRescan(item)} disabled={rescanLoadingIds.has(item.id)}>
                    {rescanLoadingIds.has(item.id) ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </DashboardLayout>
  );
}
