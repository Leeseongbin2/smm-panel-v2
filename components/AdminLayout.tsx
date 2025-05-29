import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

// MUI
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
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PaidIcon from '@mui/icons-material/Paid';
import WifiFindSharpIcon from '@mui/icons-material/WifiFindSharp';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import NextLink from "next/link";

const drawerWidth = 240;
const adminEmail = "dltjdqls9565@naver.com";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email === adminEmail) {
        setAuthorized(true);
        setLoading(false);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const drawerContent = (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", p: 2, pl: 2 }}>
        <NextLink href="/dashboard/order" passHref legacyBehavior>
          <a>
            <img src="/logo.png" alt="로고" style={{ width: "160px", height: "auto", cursor: "pointer" }} />
          </a>
        </NextLink>
      </Box>

      <List>
        <ListItem disablePadding>
          <NextLink href="/admin/points" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon sx={{ color: "white" }}><PaidIcon /></ListItemIcon>
              <ListItemText primary="포인트 주문 관리" />
            </ListItemButton>
          </NextLink>
        </ListItem>

        <ListItem disablePadding>
          <NextLink href="/admin/userspoints" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon sx={{ color: "white" }}><AdminPanelSettingsIcon /></ListItemIcon>
              <ListItemText primary="회원 포인트 현황" />
            </ListItemButton>
          </NextLink>
        </ListItem>

        <ListItem disablePadding>
          <NextLink href="/admin/users" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon sx={{ color: "white" }}><PeopleAltIcon /></ListItemIcon>
              <ListItemText primary="회원 관리" />
            </ListItemButton>
          </NextLink>
        </ListItem>

        <ListItem disablePadding>
          <NextLink href="/admin/services" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon sx={{ color: "white" }}><Inventory2OutlinedIcon /></ListItemIcon>
              <ListItemText primary="상품 관리" />
            </ListItemButton>
          </NextLink>
        </ListItem>

        <ListItem disablePadding>
          <NextLink href="/admin/traffic-orders" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon sx={{ color: "white" }}><WifiFindSharpIcon /></ListItemIcon>
              <ListItemText primary="트래픽 주문현황" />
            </ListItemButton>
          </NextLink>
        </ListItem>

        <ListItem disablePadding>
          <NextLink href="/admin/orders" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon sx={{ color: "white" }}><WifiFindSharpIcon /></ListItemIcon>
              <ListItemText primary="주문 현황 관리" />
            </ListItemButton>
          </NextLink>
        </ListItem>
      </List>
    </Box>
  );

  if (loading || !authorized) return null;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "#222",
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
      <Toolbar sx={{ display: "flex" }}>
        {/* 햄버거 버튼: 왼쪽 */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{ display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* 로그아웃 버튼: 오른쪽 */}
        <Box sx={{ flexGrow: 1 }} />  {/* 빈 공간으로 밀어내기 */}
        <Button variant="contained" color="error" onClick={handleLogout}>
          로그아웃
        </Button>
      </Toolbar>
      </AppBar>

      {/* 모바일 Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#222",
            color: "white",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* 데스크탑 Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#222",
            color: "white",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f9f9f9",
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
