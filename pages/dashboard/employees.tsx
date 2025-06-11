// 최종 개선된 코드: 날짜 필터 + 근무/지급 구분 탭 추가
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AddIcon from '@mui/icons-material/Add';
import {
  Box, Button, Container, TextField, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab
} from "@mui/material";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  query,
  orderBy,
  startAfter,
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { useUserContext } from "@/context/UserContext";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

interface Employee {
  id?: string;
  name: string;
  phone: string;
  currentWage: number;
  memo: string;
  currentStatus: "퇴근" | "근무중";
  currentStartTime: null | any;
}

export default function EmployeesPage() {
  const { user } = useUserContext();
  const uid = user?.uid;
  const [form, setForm] = useState({ name: "", phone: "", currentWage: "", memo: "" });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "work" | "pay">("all");
  const [startDate, setStartDate] = useState<string>(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manualLogDialogOpen, setManualLogDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [manualLogData, setManualLogData] = useState({
  date: dayjs().format("YYYY-MM-DD"),
  hours: "",
  wage: "",
  });
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const refreshEmployees = async () => {
    if (!uid) return;
    const snapshot = await getDocs(collection(db, "stores", uid, "employees"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
    setEmployees(list);
  };

    const handleToggleLogs = (employeeId: string) => {
  if (selectedEmployeeId === employeeId) {
    // 이미 열려있는 상태면 닫기
    setSelectedEmployeeId(null);
    setWorkLogs([]);
  } else {
    // 새로 열기
    handleLoadLogs(employeeId);
  }
};
    const handleLoadLogs = async (employeeId: string) => {
    if (!uid) return;
    setSelectedEmployeeId(employeeId);

    
    const q = query(
        collection(db, "stores", uid, "employees", employeeId, "workLogs"),
        orderBy("createdAt", "desc"),
        limit(15)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), ref: doc.ref }));

    setWorkLogs(logs);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === 15);
    };
  const handleAddManualLog = async () => {
    if (!uid || !selectedEmployeeId) return;
    const { date, hours, wage } = manualLogData;
    const durationMinutes = parseInt(hours) * 60;
    const wageAtThatTime = parseInt(wage);
    const wageCalculated = durationMinutes * (wageAtThatTime / 60);

    await addDoc(collection(db, "stores", uid, "employees", selectedEmployeeId, "workLogs"), {
    startTime: Timestamp.fromDate(new Date(`${date}T09:00:00`)),
    endTime: Timestamp.fromDate(new Date(`${date}T09:00:00`)),
    durationMinutes,
    wageAtThatTime,
    wageCalculated,
    isPaid: false,
    createdAt: Timestamp.now(),
    // ⛳ 아래 필드가 꼭 필요합니다
    paidAmount: 0, // <- 이걸 추가해야 partial 지급 시 계산이 맞아집니다.
    });

    setManualLogDialogOpen(false);
    setManualLogData({ date: dayjs().format("YYYY-MM-DD"), hours: "", wage: "" });
    handleLoadLogs(selectedEmployeeId);
  };
  const handleLoadMoreLogs = async () => {
  if (!uid || !selectedEmployeeId || !lastDoc) return;
  setLoadingMore(true);

  const q = query(
    collection(db, "stores", uid, "employees", selectedEmployeeId, "workLogs"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(15)
  );
  const snapshot = await getDocs(q);
  const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), ref: doc.ref }));

  setWorkLogs(prev => [...prev, ...newLogs]);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  setHasMore(snapshot.docs.length === 15);
  setLoadingMore(false);
};

  useEffect(() => {
    if (!uid) return;
    const fetchEmployees = async () => {
      setLoading(true);
      await refreshEmployees();
      setLoading(false);
    };
    fetchEmployees();
  }, [uid]);

    const handleAddEmployee = async () => {
    if (!uid || !form.name || !form.phone || !form.currentWage) return;

    const newEmployee: Employee = {
        name: form.name,
        phone: form.phone,
        currentWage: Number(form.currentWage),
        memo: form.memo,
        currentStatus: "퇴근",
        currentStartTime: null
    };

    await addDoc(collection(db, "stores", uid, "employees"), {
        ...newEmployee,
        createdAt: serverTimestamp()
    });

    setForm({ name: "", phone: "", currentWage: "", memo: "" });
    setAddDialogOpen(false);       // 등록 다이얼로그 닫기
    setSuccessDialogOpen(true);    // ✅ 성공 팝업 열기
    refreshEmployees();
    };

  const handleClockIn = async (employeeId: string) => {
    if (!uid) return;
    const empRef = doc(db, "stores", uid, "employees", employeeId);
    await updateDoc(empRef, {
      currentStartTime: Timestamp.now(),
      currentStatus: "근무중",
    });
    refreshEmployees();
  };

  const handleClockOut = async (employee: Employee) => {
    if (!uid || !employee.currentStartTime || !employee.id) return;
    const end = Timestamp.now();
    const start = employee.currentStartTime as Timestamp;
    const durationMinutes = Math.round((end.toMillis() - start.toMillis()) / 1000 / 60);
    const durationHours = Math.floor(durationMinutes / 60);
    const wageCalculated = durationHours * employee.currentWage;

    await addDoc(collection(db, "stores", uid, "employees", employee.id, "workLogs"), {
      startTime: start,
      endTime: end,
      durationMinutes,
      wageAtThatTime: employee.currentWage,
      wageCalculated,
      isPaid: false,
      createdAt: Timestamp.now()
    });

    const empRef = doc(db, "stores", uid, "employees", employee.id);
    await updateDoc(empRef, {
      currentStartTime: null,
      currentStatus: "퇴근",
    });

    refreshEmployees();
  };

  const handlePay = async () => {
    if (!uid || !selectedEmployeeId || !payAmount) return;
    const amount = Number(payAmount);
    const unpaidLogs = workLogs.filter(
  (log) => !log.isPaid && !log.isPayLog && log.wageCalculated
)   

const totalUnpaid = unpaidLogs.reduce((sum, log) => sum + log.wageCalculated, 0);

    let remaining = amount;
    const batch = writeBatch(db);
    for (const log of unpaidLogs) {
    if (remaining <= 0) break;

    const unpaid = log.wageCalculated - (log.paidAmount || 0);
    const payThis = Math.min(unpaid, remaining);

    batch.update(log.ref, {
        paidAmount: (log.paidAmount || 0) + payThis,
        isPaid: (log.paidAmount || 0) + payThis >= log.wageCalculated,
        paidAt: Timestamp.now(),
    });

    remaining -= payThis;
    }

    await batch.commit();

    await addDoc(collection(db, "stores", uid, "employees", selectedEmployeeId, "workLogs"), {
      paidAt: Timestamp.now(),
      paidAmount: amount,
      isPayLog: true,
      createdAt: Timestamp.now()
    });

    setPayDialogOpen(false);
    setPayAmount("");
    handleLoadLogs(selectedEmployeeId);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!uid) return;
    const confirmDelete = window.confirm("정말로 해당 직원을 삭제하시겠습니까? 모든 이력이 함께 삭제됩니다.");
    if (!confirmDelete) return;
    await deleteDoc(doc(db, "stores", uid, "employees", employeeId));
    refreshEmployees();
  };

const getUnpaidTotal = () => {
  return workLogs
    .filter(log => !log.isPayLog && log.wageCalculated)
    .reduce((sum, log) => {
      const paid = log.paidAmount || 0;
      return sum + (log.wageCalculated - paid);
    }, 0);
};

    const filteredLogs = workLogs.filter(log => {
    const created = log.createdAt?.toDate?.();
    const inRange = created && dayjs(created).isBetween(startDate, endDate, 'day', '[]');
    const matchType =
        filterType === "all" ? true :
        filterType === "work" ? !log.isPayLog :
        log.isPayLog;
    return inRange && matchType;
    });

  if (loading) return <Typography>직원 정보를 불러오는 중입니다...</Typography>;
  return (
    <DashboardLayout>
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">직원 목록</Typography>
        <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            >
            직원 등록
            </Button>
      </Box>
    <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>시급</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>메모</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id}>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.phone}</TableCell>
                <TableCell>{emp.currentWage.toLocaleString()}원</TableCell>
                <TableCell>{emp.currentStatus}</TableCell>
                <TableCell>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={emp.memo || ""}
                    onChange={(e) => {
                      const newMemo = e.target.value;
                      setEmployees(prev =>
                        prev.map(p => p.id === emp.id ? { ...p, memo: newMemo } : p)
                      );
                    }}
                    onBlur={async () => {
                      if (!uid || !emp.id) return;
                      const empRef = doc(db, "stores", uid, "employees", emp.id);
                      await updateDoc(empRef, { memo: emp.memo });
                    }}
                  />
                </TableCell>
                <TableCell>
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {emp.currentStatus === "퇴근" ? (
                    <Button variant="contained" onClick={() => handleClockIn(emp.id!)}>
                        출근
                    </Button>
                    ) : (
                    <Button variant="outlined" color="secondary" onClick={() => handleClockOut(emp)}>
                        퇴근
                    </Button>
                    )}
                    <Button
                        variant="outlined" size="small" color="primary"
                        onClick={() => handleToggleLogs(emp.id!)}
                    >
                        {selectedEmployeeId === emp.id ? "이력닫기" : "이력보기"}
                    </Button>

                    <Button variant="outlined" size="small" color="primary" onClick={() => {
                    setSelectedEmployeeId(emp.id!);
                    setPayDialogOpen(true);
                    }}>
                    지급하기
                    </Button>

                    <Button variant="outlined" size="small" color="error" onClick={() => handleDeleteEmployee(emp.id!)}>
                    삭제
                    </Button>
                </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

  {selectedEmployeeId && (
    <Paper
  elevation={3}
  sx={{
    p: 3,
    bgcolor: "#f4f6fa",        // 은은한 회색-블루톤 배경
    borderRadius: 2,           // 둥근 모서리
    boxShadow: 3,              // 그림자 강조
    mt: 3,                     // 위 여백
  }}
>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
  {selectedEmployee ? `${selectedEmployee.name} 근무이력` : "근무 이력"}
</Typography>
      

      {/* 필터 UI */}
<Box
  mt={2}
  display="flex"
  alignItems="center"
  justifyContent="space-between"
  flexWrap="wrap"
  gap={2}
>
  {/* 왼쪽 필터 영역 */}
    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <TextField
        label="시작일"
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        />
        <TextField
        label="종료일"
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        />
        <TextField
        select
        label="내역 유형"
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as "all" | "work" | "pay")}
        SelectProps={{ native: true }}
        >
        <option value="all">전체보기</option>
        <option value="work">급여내역</option>
        <option value="pay">지급내역</option>
        </TextField>
        <Button
        variant="outlined"
        size="small"
        sx={{ height: "56px" }}
        onClick={() => setManualLogDialogOpen(true)}
        >
        근무이력 직접등록
        </Button>
    </Box>

    {/* 오른쪽 총 미지급 급여 */}
    <Typography sx={{ minWidth: 150, textAlign: "right", fontWeight: "bold" }}>
        총 미지급 급여: {getUnpaidTotal().toLocaleString()}원
    </Typography>
    </Box>

      {/* 근무/지급 이력 테이블 */}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>근무/지급 일자</TableCell>
              <TableCell>출근시간</TableCell>
              <TableCell>퇴근시간</TableCell>
              <TableCell>근무시간</TableCell>
              <TableCell>시급</TableCell>
              <TableCell>급여</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{log.createdAt ? dayjs(log.createdAt.toDate()).format("YYYY-MM-DD") : "-"}</TableCell>
                <TableCell>{log.startTime ? dayjs(log.startTime.toDate()).format("HH:mm") : "-"}</TableCell>
                <TableCell>{log.endTime ? dayjs(log.endTime.toDate()).format("HH:mm") : "-"}</TableCell>
                <TableCell>{log.durationMinutes ? Math.floor(log.durationMinutes / 60) + "시간" : "-"}</TableCell>
                <TableCell>{log.wageAtThatTime ? log.wageAtThatTime.toLocaleString() + "원" : "-"}</TableCell>
                <TableCell>
                {log.isPayLog
                    ? `-${log.paidAmount.toLocaleString()}원`
                    : (log.wageCalculated ? `${log.wageCalculated.toLocaleString()}원` : "-")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 더보기 버튼 */}
      {hasMore && (
        <Box textAlign="center" mt={2}>
          <Button variant="outlined" onClick={handleLoadMoreLogs} disabled={loadingMore}>
            {loadingMore ? "불러오는 중..." : "더보기"}
          </Button>
        </Box>
      )}
    </Paper>
  )}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>직원 등록</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth margin="dense" label="전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField fullWidth margin="dense" label="시급" type="number" value={form.currentWage} onChange={(e) => setForm({ ...form, currentWage: e.target.value })} />
          <TextField fullWidth margin="dense" label="메모" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>취소</Button>
          <Button onClick={handleAddEmployee} variant="contained">등록</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={manualLogDialogOpen} onClose={() => setManualLogDialogOpen(false)}>
        <DialogTitle>근무이력 직접 등록</DialogTitle>
        <DialogContent>
            <TextField
            label="근무일"
            type="date"
            fullWidth
            value={manualLogData.date}
            onChange={e => setManualLogData({ ...manualLogData, date: e.target.value })}
            margin="dense"
            InputLabelProps={{ shrink: true }}
            />
            <TextField
            label="근무 시간 (시간 단위)"
            type="number"
            fullWidth
            value={manualLogData.hours}
            onChange={e => setManualLogData({ ...manualLogData, hours: e.target.value })}
            margin="dense"
            />
            <TextField
            label="시급"
            type="number"
            fullWidth
            value={manualLogData.wage}
            onChange={e => setManualLogData({ ...manualLogData, wage: e.target.value })}
            margin="dense"
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setManualLogDialogOpen(false)}>취소</Button>
            <Button onClick={handleAddManualLog} variant="contained">등록</Button>
        </DialogActions>
        </Dialog>
              <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
        <DialogTitle>급여 지급</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="지급할 금액"
            type="number"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handlePay}>지급</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)}>
  <DialogTitle>등록 완료</DialogTitle>
  <DialogContent>
    <Typography>직원 등록이 완료되었습니다.</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setSuccessDialogOpen(false)} autoFocus>
      확인
    </Button>
  </DialogActions>
</Dialog>
</Container>
</DashboardLayout>
  )}