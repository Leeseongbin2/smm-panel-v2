// pages/admin/users.tsx
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebaseClient";
import AdminLayout from "../../components/AdminLayout";
import axios from "axios";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const confirmed = window.confirm("해당 정보로 회원을 생성하시겠습니까?");
    if (!confirmed) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;
      await setDoc(doc(db, "users", userId), {
        email,
        name,
        points: 0,
      });
      alert("✅ 회원이 성공적으로 생성되었습니다.");
      setShowModal(false);
      setEmail("");
      setPassword("");
      setName("");
      fetchUsers();
    } catch (error: any) {
      alert("❌ 오류 발생: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm("정말 이 회원을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await axios.post("/api/admin-delete-user", { uid: userId });
      await deleteDoc(doc(db, "users", userId));
      alert("✅ 회원이 삭제되었습니다.");
      fetchUsers();
    } catch (err: any) {
      alert("❌ 삭제 실패: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <h1>회원 목록</h1>
      <button
        onClick={() => setShowModal(true)}
        style={{ float: "right", marginBottom: "1rem" }}
      >
        ➕ 회원 생성
      </button>

      <table border={1} cellPadding={10} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>이메일</th>
            <th>이름</th>
            <th>UID</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.id}</td>
              <td>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  style={{ color: "white", backgroundColor: "red", padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px" }}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 회원 생성 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              minWidth: "300px",
            }}
          >
            <h2>회원 생성</h2>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: "1rem" }}
            />
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: "1rem" }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: "1rem" }}
            />
            <button onClick={handleCreateUser} style={{ marginRight: "1rem" }}>
              회원 생성
            </button>
            <button onClick={() => setShowModal(false)}>취소</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
