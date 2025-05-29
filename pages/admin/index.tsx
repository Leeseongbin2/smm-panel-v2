import AdminLayout from "@/components/AdminLayout";
import { Box, Container } from "@mui/material";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { useCallback } from "react";

export default function AdminIndex() {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <AdminLayout>
      <Box sx={{ position: "relative", width: "100%", height: "100vh", backgroundColor: "#000" }}>
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#000" } },
            fpsLimit: 60,
            particles: {
              color: { value: "#ffffff" },
              links: { enable: false },
              move: { enable: true, speed: 0.5 },
              number: { value: 30 },
              opacity: { value: 0.5 },
              shape: { type: "circle" },
              size: { value: 2 },
            },
            detectRetina: true,
          }}
        />

          <Box
            sx={{
              position: "absolute",
              top: "40%",
              left: "55%", // 👉 약간 오른쪽으로 이동
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
          <img
            src="/logo.png"
            alt="HNB 로고"
            style={{ width: "400px", height: "auto" }}
          />
        </Box>
      </Box>
    </AdminLayout>
  );
}
