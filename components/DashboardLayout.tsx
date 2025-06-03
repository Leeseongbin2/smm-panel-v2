// components/DashboardLayout.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebaseClient";
import { onSnapshot, doc } from "firebase/firestore";
import { useUserContext } from "../context/UserContext";
import NextLink from "next/link";

// MUI
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import MenuIcon from "@mui/icons-material/Menu";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AddShoppingCartSharpIcon from "@mui/icons-material/AddShoppingCartSharp";
import BrowserUpdatedSharpIcon from "@mui/icons-material/BrowserUpdatedSharp";
import PaidSharpIcon from "@mui/icons-material/PaidSharp";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const drawerWidth = 240;
const adminEmail = "dltjdqls9565@naver.com";

const colors = {
  background: "#0f172a",
  sidebar: "#0f172a",
  sidebarHover: "#1e293b",
  textPrimary: "#ffffff",
  accent: "#edd8b0",
  mainBackground: "#f8fafc",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = router.pathname;
  const { userPoints, userEmail, isLoading, setUserPoints, user } = useUserContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTrafficOpen, setIsTrafficOpen] = useState(false);
  const [isDistributor, setIsDistributor] = useState(false); // 총판 여부 상태

  useEffect(() => {
    const userAuth = auth.currentUser;
    if (!isLoading && !userEmail) {
      router.push("/");
      return;
    }
    if (userAuth && userEmail) {
      const userRef = doc(db, "users", userAuth.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        const data = docSnap.data();
        if (data) {
          if (typeof data.points === "number") setUserPoints(data.points);
          if (data.isDistributor === true) setIsDistributor(true);
        }
      });
      return () => unsubscribe();
    }
  }, [isLoading, userEmail, router]);

  if (isLoading) return <div>로딩 중...</div>;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const drawerContent = (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
        <NextLink href="/dashboard/order" passHref legacyBehavior>
          <a><img src="/logo.png" alt="로고" style={{ width: "130px" }} /></a>
        </NextLink>
      </Box>
      <List>
        {[{
          label: "주문", href: "/dashboard/order", icon: <AddShoppingCartSharpIcon />
        }, {
          label: "주문현황", href: "/dashboard/history", icon: <BrowserUpdatedSharpIcon />
        }, {
          label: "잔액충전", href: "/dashboard/charge", icon: <PaidSharpIcon />
        }, {
          label: "공지", href: "/notices", icon: <VolumeUpIcon />
        }, {
          label: "플레이스 순위추적", href: "/dashboard/place-rank", icon: <LocationSearchingIcon />
        }].map((item) => (
          <ListItem key={item.href} disablePadding>
            <NextLink href={item.href} passHref legacyBehavior>
              <ListItemButton
                component="a"
                sx={{
                  bgcolor: pathname === item.href ? colors.sidebarHover : "inherit",
                  color: colors.textPrimary,
                  '&:hover': { bgcolor: colors.sidebarHover },
                  borderRadius: 1,
                  mx: 1
                }}>
                <ListItemIcon sx={{ color: "white", minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </NextLink>
          </ListItem>
        ))}

        <ListItem disablePadding onClick={() => setIsTrafficOpen(!isTrafficOpen)}>
          <ListItemButton onClick={() => setIsTrafficOpen(!isTrafficOpen)}
  sx={{ pl: 3, color: colors.textPrimary }}>
            <ListItemIcon sx={{ color: "white" }}><AdsClickIcon /></ListItemIcon>
            <ListItemText primary="트래픽" sx={{ pl: 0, ml: -2.5 }} />
            {isTrafficOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={isTrafficOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {[{ href: "/dashboard/traffic-request", label: "▶ 트래픽 신청" }, { href: "/dashboard/traffic-history", label: "▶ 트래픽 작업목록" }].map((sub) => (
              <NextLink key={sub.href} href={sub.href} passHref legacyBehavior>
                <ListItemButton
                  component="a"
                  sx={{ pl: 6, color: colors.textPrimary, '&:hover': { bgcolor: colors.sidebarHover } }}>
                  <ListItemText primary={sub.label} />
                </ListItemButton>
              </NextLink>
            ))}
          </List>
        </Collapse>

        {isDistributor && (
          <ListItem disablePadding>
            <NextLink href="/dashboard/distributor" passHref legacyBehavior>
              <ListItemButton component="a" sx={{ pl: 3,color: colors.textPrimary, '&:hover': { bgcolor: colors.sidebarHover } }}>
                <ListItemIcon sx={{ color: "white" }}><SupervisorAccountIcon /></ListItemIcon>
                <ListItemText primary="총판 전용" sx={{ pl: 0, ml: -2.5 }} />
              </ListItemButton>
            </NextLink>
          </ListItem>
        )}

        {userEmail === adminEmail && (
          <ListItem disablePadding>
            <NextLink href="/admin" passHref legacyBehavior>
              <ListItemButton component="a" sx={{ pl: 3,color: colors.textPrimary, '&:hover': { bgcolor: colors.sidebarHover } }}>
                <ListItemIcon sx={{ color: "white" }}><AdminPanelSettingsIcon /></ListItemIcon>
                <ListItemText primary="관리자 페이지" sx={{ pl: 0, ml: -2.5 }}/>
              </ListItemButton>
            </NextLink>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        bgcolor: colors.background,
        color: colors.textPrimary,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        backdropFilter: "blur(6px)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 4, ml: "auto" }}>
            <Typography sx={{ fontWeight: "bold" }}>잔액: {userPoints !== null ? `${userPoints.toLocaleString()} ₩` : "로딩 중..."}</Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.accent,
                color: colors.background,
                '&:hover': { backgroundColor: "#e4cfa1" },
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                borderRadius: 2
              }}
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: "border-box", backgroundColor: colors.sidebar, color: colors.textPrimary } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: "border-box", backgroundColor: colors.sidebar, color: colors.textPrimary } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: colors.mainBackground, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: "100vh" }}>
        <Toolbar />
        {children}
        <Box
          component="a"
          href="https://open.kakao.com/o/swMKljxh"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            position: "fixed",
            right: "2rem",
            bottom: "3rem",
            zIndex: 2000,
            width: "65px",
            height: "65px",
            borderRadius: "50%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff"
          }}
        >
          <img src="/kakao-icon.png" alt="카카오톡" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Box>
      </Box>
    </Box>
  );
}