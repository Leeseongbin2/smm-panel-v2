// pages/notices.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebaseClient";
import DashboardLayout from "../../components/DashboardLayout";

import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, useMediaQuery
} from '@mui/material';

interface Notice {
  id: string;
  title: string;
  createdAt: any;
  views: number;
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  const db = getFirestore();

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    getDocs(q).then((snapshot) => {
      const data: Notice[] = snapshot.docs.map((doc, idx) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notice[];
      setNotices(data);
    });

    onAuthStateChanged(auth, (user) => {
      if (user?.email === "dltjdqls9565@naver.com") {
        setIsAdmin(true);
      }
      setAuthChecked(true);
    });
  }, []);

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.();
    return date ? date.toLocaleDateString() : "";
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">공지사항</h1>

        {authChecked && isAdmin && (
          <div className="mb-4 text-right">
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/admin/notices")}
            >
              글쓰기
            </Button>
          </div>
        )}

        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: 600, wordBreak: "keep-all" }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">번호</TableCell>
                <TableCell>제목</TableCell>
                <TableCell align="center">날짜</TableCell>
                <TableCell align="center">조회수</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.map((notice, index) => (
                <TableRow
                  key={notice.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => router.push(`/notices/${notice.id}`)}
                >
                  <TableCell align="center">{notices.length - index}</TableCell>
                  <TableCell>{notice.title}</TableCell>
                  <TableCell align="center">{formatDate(notice.createdAt)}</TableCell>
                  <TableCell align="center">{notice.views ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </DashboardLayout>
  );
}
