import { useEffect, useState } from "react";
import {
  Container, Typography, Table, TableBody, TableCell, TableHead,
  TableRow, Checkbox, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,Box
} from "@mui/material";
import { db } from "@/lib/firebaseClient";
import {
  collection, getDocs, updateDoc, deleteDoc, doc, addDoc
} from "firebase/firestore";
import { useUserContext } from "@/context/UserContext";
import DashboardLayout from "@/components/DashboardLayout";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

export default function LoyaltyCouponsPage() {
  const { user } = useUserContext();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"use" | "delete" | null>(null);
  const [targetCouponId, setTargetCouponId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [couponName, setCouponName] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(7, "day"));
  const [message, setMessage] = useState("");
  const [sortType, setSortType] = useState("birth");
  const [referrerCounts, setReferrerCounts] = useState<{ [key: string]: number }>({});

    type CustomerType = {
    id: string;
    name?: string;
    phone?: string;
    birthDate?: string;
    lastVisit?: string;
    referrerPhone?: string;
    points?: number; // ✅ 잔여 포인트 필드 추가
    totalPayment?: number;
    };

    const calculateBirthdayDday = (birthDate: string) => {
    if (!birthDate || birthDate.length !== 8) return null; // 변경됨
    const today = dayjs();
    const month = birthDate.slice(4, 6);
    const day = birthDate.slice(6, 8);
    let birthday = dayjs(`${today.year()}-${month}-${day}`);
    if (birthday.isBefore(today, "day")) {
        birthday = birthday.add(1, "year");
    }
    return birthday.diff(today, "day");
    };

  const calculateDday = (dateStr: string) => {
    if (!dateStr) return "-";
    const today = dayjs();
    const expire = dayjs(dateStr);
    const diff = expire.diff(today, "day");
    return diff >= 0 ? `D-${diff}` : "만료됨";
  };

  const fetchCoupons = async () => {
    if (!user?.uid) return;
    const snapshot = await getDocs(collection(db, `users/${user.uid}/loyal_coupons`));
    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expireDday: calculateDday(data.expireDate)
      };
    });
    setCoupons(list);
  };

  useEffect(() => {
    if (!user?.uid) return;
    const fetchCustomers = async () => {
    const snapshot = await getDocs(collection(db, `users/${user.uid}/loyal_customers`));

    // 1. 원본 리스트 불러오기 (타입: CustomerType)
    const rawList: CustomerType[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        points: (doc.data().points ?? 0), // ✅ 잔여포인트 기본값 0
    })) as CustomerType[];

    // 2. 추천인 이름 매핑 (전화번호 → 이름)
    const phoneNameMap = rawList.reduce((acc, cur) => {
        if (cur.phone) acc[cur.phone] = cur.name || "";
        return acc;
    }, {} as { [key: string]: string });

    // 3. 가공 리스트 생성
    const list = rawList.map((c) => ({
        ...c,
        referrerName: phoneNameMap[c.referrerPhone || ""] || "-",
        birthdayGap: calculateBirthdayDday(c.birthDate || ""),
        lastVisitDate:
        c.lastVisit && (c.lastVisit as any).toDate instanceof Function
            ? dayjs((c.lastVisit as unknown as Timestamp).toDate())
            : typeof c.lastVisit === "string"
            ? dayjs(c.lastVisit)
            : null,
        points: c.points ?? 0, // ✅ 잔여 포인트 필드 확실히 포함
        totalPayment: c.totalPayment ?? 0,
    }));

      setCustomers(list);

      const count: { [key: string]: number } = {};
      list.forEach(c => {
        if (c.referrerPhone) {
          count[c.referrerPhone] = (count[c.referrerPhone] || 0) + 1;
        }
      });
      setReferrerCounts(count);
    };
    fetchCustomers();
    fetchCoupons();
  }, [user]);

  useEffect(() => {
    let sorted = [...customers];
if (sortType === "birth") {
  sorted.sort((a, b) => {
    if (a.birthdayGap === null && b.birthdayGap === null) return 0;
    if (a.birthdayGap === null) return 1;  // a가 생일 없음 → 뒤로
    if (b.birthdayGap === null) return -1; // b가 생일 없음 → 뒤로
    return a.birthdayGap - b.birthdayGap;  // 둘 다 값 있음 → D-day 기준 정렬
  });
    } else if (sortType === "visit") {
      sorted.sort((a, b) => (b.visitCount ?? 0) - (a.visitCount ?? 0));
    } else if (sortType === "recommend") {
      sorted.sort((a, b) => (referrerCounts[b.phone] ?? 0) - (referrerCounts[a.phone] ?? 0));
    } else if (sortType === "last") {
    sorted.sort((a, b) => {
        if (!a.lastVisitDate && !b.lastVisitDate) return 0;
        if (!a.lastVisitDate) return -1;
        if (!b.lastVisitDate) return 1;
        return a.lastVisitDate.unix() - b.lastVisitDate.unix();
    });
    }
    else if (sortType === "payment") {
    sorted.sort((a, b) => (b.totalPayment ?? 0) - (a.totalPayment ?? 0)); // ✅ 추가
    }
    setFilteredCustomers(sorted);
  }, [customers, sortType, referrerCounts]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setSelectedCustomerIds(checked ? filteredCustomers.map(c => c.id) : []);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openConfirmDialog = (type: "use" | "delete", couponId: string) => {
    setConfirmType(type);
    setTargetCouponId(couponId);
    setConfirmOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmOpen(false);
    setConfirmType(null);
    setTargetCouponId(null);
  };

  const handleConfirm = async () => {
    if (!user || !targetCouponId || !confirmType) return;
    const ref = doc(db, `users/${user.uid}/loyal_coupons/${targetCouponId}`);
    if (confirmType === "use") {
      await updateDoc(ref, { status: "used" });
      await fetchCoupons();
    }
    if (confirmType === "delete") {
      await deleteDoc(ref);
      await fetchCoupons();
    }
    closeConfirmDialog();
  };

  const handleSendCoupons = async () => {
    if (!user) return;
    const selectedCustomers = customers.filter(c => selectedCustomerIds.includes(c.id));
    const batch = selectedCustomers.map(c =>
      addDoc(collection(db, `users/${user.uid}/loyal_coupons`), {
        customerId: c.id,
        customerName: c.name,
        couponName,
        startDate: startDate.format("YYYY-MM-DD"),
        expireDate: endDate.format("YYYY-MM-DD"),
        message,
        status: "unused",
        createdAt: new Date(),
      })
    );
    await Promise.all(batch);
    await fetchCoupons();
    alert("쿠폰이 발송되었습니다.");
    setSendDialogOpen(false);
    setCouponName("");
    setMessage("");
  };

    const handleDeleteSelectedCustomers = async () => {
    if (!user?.uid) return;
    const confirm = window.confirm("정말로 선택한 단골을 삭제하시겠습니까?");
    if (!confirm) return;

    const deletePromises = selectedCustomerIds.map(id =>
        deleteDoc(doc(db, `users/${user.uid}/loyal_customers`, id))
    );

    await Promise.all(deletePromises);
    alert("선택한 단골이 삭제되었습니다.");
    setSelectedCustomerIds([]);
    setSelectAll(false);

    const snapshot = await getDocs(collection(db, `users/${user.uid}/loyal_customers`));
    const rawList: CustomerType[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        points: (doc.data().points ?? 0),
    })) as CustomerType[];

    const phoneNameMap = rawList.reduce((acc, cur) => {
        if (cur.phone) acc[cur.phone] = cur.name || "";
        return acc;
    }, {} as { [key: string]: string });

    const list = rawList.map((c) => ({
        ...c,
        referrerName: phoneNameMap[c.referrerPhone || ""] || "-",
        birthdayGap: calculateBirthdayDday(c.birthDate || ""),
        lastVisitDate: c.lastVisit ? dayjs(c.lastVisit) : null,
        points: c.points ?? 0,
        totalPayment: c.totalPayment ?? 0,
    }));

    setCustomers(list); // ✅ JSX return이 아니라 이 코드로 끝냄
    };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

     <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
        <FormControl>
        <InputLabel>정렬 기준</InputLabel>
          <Select value={sortType} onChange={(e) => setSortType(e.target.value)} label="정렬 기준">
            <MenuItem value="birth">생일이 가까운 순</MenuItem>
            <MenuItem value="payment">결제금액 많은 순</MenuItem>
            <MenuItem value="recommend">추천 많이 한 순</MenuItem>
            <MenuItem value="visit">방문횟수 많은 순</MenuItem>
            <MenuItem value="last">방문한지 오래된 순</MenuItem>
          </Select>
        </FormControl>
         <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                variant="contained"
                disabled={selectedCustomerIds.length === 0}
                onClick={() => setSendDialogOpen(true)}
                >
                선택 고객에게 쿠폰 발송
                </Button>

                <Button
                variant="outlined"
                color="error"
                disabled={selectedCustomerIds.length === 0}
                onClick={handleDeleteSelectedCustomers}
                >
                선택 고객 삭제
                </Button>
        </Box>
     </Box>

        <Paper sx={{ mt: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ p: 2 }}>단골 목록</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectAll}
                    onChange={handleSelectAll}
                    indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < filteredCustomers.length}
                  />
                </TableCell>
                <TableCell>이름</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>추천인</TableCell>
                <TableCell>생일</TableCell>
                <TableCell>D-day</TableCell>
                <TableCell>방문횟수</TableCell>
                <TableCell>마지막 방문일</TableCell>
                <TableCell>잔여 포인트</TableCell>
                <TableCell>총 결제금액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map(c => (
                <TableRow key={c.id}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedCustomerIds.includes(c.id)} onChange={() => handleCheckboxChange(c.id)} />
                  </TableCell>
                  <TableCell>{c.name || "-"}</TableCell>
                  <TableCell>{c.phone || "-"}</TableCell>
                  <TableCell>{c.referrerName || "-"}</TableCell>
                  <TableCell>{c.birthDate || "-"}</TableCell>
                  <TableCell>
                    {c.birthdayGap === null
                        ? "-"
                        : c.birthdayGap === 0
                        ? "🎂 오늘!"
                        : `D-${c.birthdayGap}`}
                    </TableCell>
                  <TableCell>{c.visitCount ?? 0}</TableCell>
                  <TableCell>
                    {c.lastVisitDate
                        ? c.lastVisitDate.format("YYYY-MM-DD")
                        : "-"}
                  </TableCell>
                  <TableCell>{c.points || 0}P</TableCell>
                  <TableCell>{c.totalPayment?.toLocaleString() || "0"}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ p: 2 }}>🎟️ 발송된 쿠폰 목록</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>고객명</TableCell>
                <TableCell>쿠폰명</TableCell>
                <TableCell>사용기한</TableCell>
                <TableCell>남은 사용일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>삭제</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>{coupon.customerName || "-"}</TableCell>
                  <TableCell>{coupon.couponName || "-"}</TableCell>
                  <TableCell>{coupon.expireDate || "-"}</TableCell>
                  <TableCell>{coupon.expireDday}</TableCell>
                  <TableCell>
                    {coupon.status === "used" ? (
                      "사용됨"
                    ) : (
                      <Button size="small" onClick={() => openConfirmDialog("use", coupon.id)}>
                        사용처리
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="small" color="error" onClick={() => openConfirmDialog("delete", coupon.id)}>
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Dialog open={confirmOpen} onClose={closeConfirmDialog}>
          <DialogTitle>{confirmType === "use" ? "쿠폰 사용 처리" : "쿠폰 삭제"}</DialogTitle>
          <DialogContent>
            {confirmType === "use"
              ? "정말로 이 쿠폰을 사용 처리하시겠습니까?"
              : "정말로 이 쿠폰을 삭제하시겠습니까? 복구할 수 없습니다."}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfirmDialog}>취소</Button>
            <Button onClick={handleConfirm} color="error">
              확인
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} fullWidth>
          <DialogTitle>쿠폰 발송</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="쿠폰명" value={couponName} onChange={(e) => setCouponName(e.target.value)} />
            <TextField
              label="발송 멘트"
              value={message}
              onChange={(e) => {
                const input = e.target.value;
                const byteLength = new TextEncoder().encode(input).length;
                if (byteLength <= 2000) setMessage(input);
              }}
              helperText={`현재 ${new TextEncoder().encode(message).length} / 2,000 bytes`}
              multiline
            />
            <TextField
              label="시작일"
              value={startDate.format("YYYY-MM-DD")}
              onChange={(e) => setStartDate(dayjs(e.target.value))}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="종료일"
              value={endDate.format("YYYY-MM-DD")}
              onChange={(e) => setEndDate(dayjs(e.target.value))}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSendDialogOpen(false)}>취소</Button>
            <Button variant="contained" onClick={handleSendCoupons}>발송</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
