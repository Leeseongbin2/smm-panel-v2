import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import DashboardLayout from "../../components/DashboardLayout";
import { Divider } from '@mui/material';

import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Stack,
  useMediaQuery,
} from "@mui/material";

export default function NoticeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email === "dltjdqls9565@naver.com") {
        setIsAdmin(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchNotice = async () => {
      const docRef = doc(db, "notices", id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setNotice(docSnap.data());

        await updateDoc(docRef, {
          views: increment(1),
        });
      }

      setLoading(false);
    };

    fetchNotice();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm("정말로 이 공지를 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "notices", id as string));
      alert("삭제되었습니다.");
      router.push("/notices");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.();
    return date ? date.toLocaleDateString() : "";
  };

  if (loading) return <p>불러오는 중...</p>;
  if (!notice) return <p>존재하지 않는 공지입니다.</p>;

  return (
    <DashboardLayout>
      <Container maxWidth="md">
        <Box
          sx={{
            backgroundColor: "#0d1117",
            borderRadius: 5,
            py: 5,
            px: 3,
            mb: 5,
            textAlign: "center",
            backgroundImage:
              "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom color="white">
            공지사항
          </Typography>
          <Typography variant="body1" color="gray">
            각종 업데이트 정보와 마케팅 방법에 대해 공지드립니다.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 3,
            minHeight: "600px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          elevation={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {notice.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              작성일: {formatDate(notice.createdAt)} / 조회수: {notice.views + 1}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box
              sx={{ mt: 3 }}
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />
          </Box>

          <Box sx={{ mt: 4 }}>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={2}
              sx={{ width: "100%" }}
            >
              <Button
                fullWidth={isMobile}
                variant="outlined"
                onClick={() => router.back()}
              >
                ← 목록으로 돌아가기
              </Button>

              {isAdmin && (
                <>
                  <Button
                    fullWidth={isMobile}
                    variant="contained"
                    color="warning"
                    onClick={() => router.push(`/admin/notices?id=${id}`)}
                  >
                    ✏️ 수정
                  </Button>
                  <Button
                    fullWidth={isMobile}
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                  >
                    🗑 삭제
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Paper>
      </Container>
    </DashboardLayout>
  );
}
