import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AdminLayout from "@/components/AdminLayout";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

interface ServiceInfo {
  uid: string;
  serviceId: number;
  displayName: string;
  price: number;
  min: number;
  max: number;
  provider: string;
  category: string;
  order: number;
  description?: string;
}

export default function AdminServicesPage() {
  const [provider, setProvider] = useState("smmkings");
  const [serviceId, setServiceId] = useState("");
  const [categorySelector, setCategorySelector] = useState("");
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [editedDescription, setEditedDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  const editBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editBoxRef.current && !editBoxRef.current.contains(e.target as Node)) {
        setEditingService(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchServices = async () => {
    const q = query(collection(db, "order_services"), orderBy("order"));
    const snapshot = await getDocs(q);
    const result: ServiceInfo[] = snapshot.docs.map((doc) => doc.data() as ServiceInfo);
    setServices(result);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleFetchService = async () => {
    if (!categorySelector || !serviceId) {
      alert("카테고리와 상품 ID를 입력해주세요.");
      return;
    }

    const targetCollection =
                  provider === "stream" ? "services2" :
                  provider === "manual" ? "service3" :
                  "services";
    
      const uid = `${provider}_${Number(serviceId)}`;
      const ref = doc(db, targetCollection, uid);
      const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      alert("❌ 해당 서비스를 찾을 수 없습니다.");
      return;
    }

    const data = snapshot.data();

    const newDoc: ServiceInfo = {
      uid,
      serviceId: data.serviceId ?? 0,
      displayName: data.displayName ?? "",
      price: data.price ?? 0,
      min: data.min ?? 0,
      max: data.max ?? 0,
      provider: provider,
      category: categorySelector,
      order: services.length,
      description: data.description ?? "",
    };

    await setDoc(doc(db, "order_services", uid), newDoc);
    setServices([...services, newDoc]);
    alert("✅ 서비스가 추가되었습니다.");
  };

  const handleDeleteService = async (uid: string) => {
    await deleteDoc(doc(db, "order_services", uid));
    setServices(services.filter((s) => s.uid !== uid));
  };

  const handleUpdateService = async (uid: string) => {
    if (!editedName.trim()) {
      alert("서비스명을 입력해주세요.");
      return;
    }
    await updateDoc(doc(db, "order_services", uid), {
      displayName: editedName.trim(),
      price: editedPrice,
      description: editedDescription.trim(),
    });
    setServices((prev) =>
      prev.map((s) =>
        s.uid === uid
          ? { ...s, displayName: editedName.trim(), price: editedPrice, description: editedDescription.trim() }
          : s
      )
    );
    setEditingService(null);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(services);
    const [moved] = reordered.splice(result.source.index, 1);
    moved.category = result.destination.droppableId;
    reordered.splice(result.destination.index, 0, moved);

    setServices(reordered);
    await Promise.all(
      reordered.map((s, i) =>
        updateDoc(doc(db, "order_services", s.uid), {
          order: i,
          category: s.category,
        })
      )
    );
  };

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <AdminLayout>
      <Container maxWidth="md">
        <Box my={4}>
          <Typography variant="h5">🔍 서비스 불러오기</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}>
              <Select fullWidth value={provider} onChange={(e) => setProvider(e.target.value)}>
                <MenuItem value="smmkings">smmkings</MenuItem>
                <MenuItem value="stream">stream</MenuItem>
                <MenuItem value="manual">manual</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label="상품 ID" value={serviceId} onChange={(e) => setServiceId(e.target.value)} />
            </Grid>
            <Grid item xs={3}>
              <Select
                fullWidth
                value={categorySelector}
                onChange={(e) => setCategorySelector(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>카테고리 선택</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={3}>
              <Button fullWidth variant="contained" onClick={handleFetchService}>불러오기</Button>
            </Grid>
          </Grid>
        </Box>

        <Box my={4}>
          <Typography variant="h6">📦 카테고리 추가</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField fullWidth label="새 카테고리명" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            </Grid>
            <Grid item xs={4}>
              <Button fullWidth variant="outlined" onClick={() => {
                if (newCategory.trim()) {
                  const dummyId = `dummy_${Date.now()}`;
                  const updated = [...services, {
                    uid: dummyId,
                    serviceId: 0,
                    displayName: "",
                    price: 0,
                    min: 0,
                    max: 0,
                    provider: "",
                    category: newCategory.trim(),
                    order: services.length,
                  }];
                  setServices(updated);
                  setNewCategory("");
                }
              }}>카테고리 추가</Button>
            </Grid>
          </Grid>
        </Box>

        <Box my={4}>
          <Typography variant="h6">📊 상품 현황</Typography>
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          {categories.map((cat) => (
            <Box key={cat} my={2}>
              <Paper sx={{ p: 2, backgroundColor: "#f9f9f9" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {editingCategory === cat ? (
                    <>
                      <TextField value={editedCategoryName} onChange={(e) => setEditedCategoryName(e.target.value)} size="small" />
                      <Button
                        onClick={async () => {
                          const updated = services.map((s) =>
                            s.category === cat ? { ...s, category: editedCategoryName } : s
                          );
                          setServices(updated);

                          // 🔐 Firestore에는 dummy로 시작하는 문서는 업데이트하지 않음
                          for (const s of updated) {
                            if (
                              s.category === editedCategoryName &&
                              !s.uid.startsWith("dummy_")
                            ) {
                              await updateDoc(doc(db, "order_services", s.uid), {
                                category: s.category,
                              });
                            }
                          }

                          setEditingCategory(null);
                        }}
                      >
                        저장
                      </Button>
                    </>
                  ) : (
                    <Typography variant="h6">📁 {cat}</Typography>
                  )}
                  <Box>
                    <IconButton onClick={() => {
                      setEditingCategory(cat);
                      setEditedCategoryName(cat);
                    }}><EditIcon /></IconButton>
                    <IconButton onClick={async () => {
                      if (!confirm(`"${cat}" 카테고리를 삭제하시겠습니까? 모든 서비스가 삭제됩니다.`)) return;
                      const toDelete = services.filter((s) => s.category === cat);
                      await Promise.all(toDelete.map((s) => deleteDoc(doc(db, "order_services", s.uid))));
                      setServices((prev) => prev.filter((s) => s.category !== cat));
                    }}><DeleteIcon /></IconButton>
                  </Box>
                </Box>

                <Droppable droppableId={cat}>
                  {(provided) => (
                    <Box ref={provided.innerRef} {...provided.droppableProps}>
                      {services.filter((s) => s.category === cat && s.displayName).map((s, index) => (
                        <Draggable key={s.uid} draggableId={s.uid} index={index}>
                          {(provided) => (
                            <Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={{ p: 2, my: 1 }}>
                              {editingService === s.uid ? (
                                <Box ref={editBoxRef} display="flex" flexDirection="column" gap={2}>
                                  <TextField label="서비스명" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                                  <TextField type="number" label="단가" value={editedPrice} onChange={(e) => setEditedPrice(Number(e.target.value))} />
                                  <TextField label="설명" multiline rows={3} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} />
                                  <Button onClick={() => handleUpdateService(s.uid)}>저장</Button>
                                </Box>
                              ) : (
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Box>
                                    <Typography variant="subtitle2">{s.displayName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      ID: {s.serviceId} / {s.provider} / {s.price}원/1개당
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <IconButton onClick={() => {
                                      setEditingService(s.uid);
                                      setEditedName(s.displayName);
                                      setEditedPrice(s.price);
                                      setEditedDescription(s.description || "");
                                    }}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDeleteService(s.uid)}><DeleteIcon /></IconButton>
                                  </Box>
                                </Box>
                              )}
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Box>
          ))}
        </DragDropContext>
      </Container>
    </AdminLayout>
  );
}