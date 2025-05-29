import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";
import { Grid } from "@mui/material";
import { auth } from "../lib/firebaseClient";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PaidIcon from "@mui/icons-material/Paid";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import { useScrollDirection } from "../hooks/useScrollDirection";
import { AnimatePresence} from "framer-motion";
import { useInView } from "react-intersection-observer";
import BarChartIcon from "@mui/icons-material/BarChart";
import BuildIcon from "@mui/icons-material/Build";
import MenuBookIcon from "@mui/icons-material/MenuBook";


import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Container,
} from "@mui/material";

import { motion } from "framer-motion";

export default function Home() {
  const scrollDirection = useScrollDirection();
  const reviews = [
  { name: "김X현", rating: 5, text: "정말 실행사 가격이 맞나 싶을 정도로 저렴했습니다." },
  { name: "강X욱", rating: 5, text: "초보인 저도 10분 만에 인스타 마케팅을 시작했어요." },
  { name: "이X진", rating: 5, text: "대행사에 맡겼던 돈이 아까워질 정도입니다." },
  { name: "박X연", rating: 5, text: "처음에는 반신반의했지만, 지금은 꾸준히 사용 중입니다." },
  { name: "최X훈", rating: 5, text: "실행사 가격 맞습니다. 가성비 미쳤어요." },
  ];
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { ref: section4Ref, inView: inViewSection4 } = useInView({
  threshold: 0.2,
  triggerOnce: true,
});
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ 로그인 성공!");
      router.push("/dashboard/order");
    } catch (err: any) {
      alert("❌ 로그인 실패: " + err.message);
    }
  };

  const particlesInit = async (engine: any) => {
    await loadFull(engine);
  };

  return (
    <div
      style={{
        minHeight: "250vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
        paddingBottom: "100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* SECTION 1: 인트로 + 파티클 */}
      <Box sx={{ height: "700px", position: "relative" }}>
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            particles: {
              number: { value: 120 },
              color: { value: "#ffffff" },
              shape: { type: "circle" },
              opacity: {
                value: 1,
                random: { enable: true, minimumValue: 0.3 },
              },
              size: {
                value: 2,
                random: { enable: true, minimumValue: 0.5 },
              },
              move: {
                enable: true,
                speed: 0.3,
                direction: "none",
                outModes: { default: "out" },
              },
              links: { enable: false },
            },
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 3,
          }}
        >
          {/* 로고 */}
          <Box sx={{ mb: 6 }}>
            <img
              src="/logo.png"
              alt="H&B 로고"
              style={{ height: "100px", objectFit: "contain" }}
            />
          </Box>

          {/* 헤드카피 */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2rem", md: "3.75rem" },
              lineHeight: 1.3,
              whiteSpace: "pre-line", // ✅ 줄바꿈 유지
              mb: 2,
            }}
          >
            마케팅, 이제{" "}<br />
           <Box
            component="span"
            sx={{
              color: "#edd8b0",
              fontWeight: "bold",
              position: "relative",
              display: "inline-block",
              "&::after": {
                content: "''",
                position: "absolute",
                left: 0,
                bottom: -6,
                width: "100%",
                height: "16px",
                backgroundImage: "url('/texture/underline.png')",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                zIndex: -1,
                animation: "drawLine 1s ease-out forwards",
                transform: "scaleX(0)",
                transformOrigin: "left",
              },
              "@keyframes drawLine": {
                to: {
                  transform: "scaleX(1)",
                },
              },
            }}
          >
            직접
          </Box>
          {" 할 수 있어야 합니다."}
        </Typography>

          {/* 서브카피 */}
          <Typography sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" },whiteSpace: "pre-line", opacity: 0.9 }}>
            대행사를 거치치 않고<br />진짜 실행 가격으로 마케팅하는 시대.
            <br />
            에이치앤비와 함께라면 가능합니다.
          </Typography>
        </Box>
      </Box>

      {/* SECTION 1.6: 혜택/특장점 카드 */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: "#edd8b0", mb: 2 }} />,
              title: "최고의 품질!",
              desc1: "주기적인 업데이트로 완벽한 <br />트래픽을 유지하고 있습니다.",
              desc2: "항상 최고 품질의 트래픽으로 <br />만족 시켜 드리겠습니다.",
            },
            {
              icon: <RocketLaunchIcon sx={{ fontSize: 40, color: "#edd8b0", mb: 2 }} />,
              title: "간편한 결제방법!",
              desc1: "24시간 자유롭게 간편하고<br /> 빠른 충전승인!",
              desc2: "부담되지 않는 1만원 부터<br /> 자유롭게 충전 가능합니다.",
            },
            {
              icon: <PaidIcon sx={{ fontSize: 40, color: "#edd8b0", mb: 2 }} />,
              title: "저렴한 단가!",
              desc1: "도매가 트래픽으로 저렴하게 <br />마케팅을 실행하세요.",
              desc2: "마케팅 업체의 불필요한 <br />마진을 줄여 효율을 높이세요!",
            },
            {
              icon: <FlashOnIcon sx={{ fontSize: 40, color: "#edd8b0", mb: 2 }} />,
              title: "신속한 작업!",
              desc1: "주문하신 작업은 <br />당사 프로그램으로",
              desc2: "자동 전송되며<br /> 빠르게 실행됩니다.",
            },
          ].map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                sx={{
                  p: { xs: 3, md: 4 },
                  border: "1px solid white",
                  borderRadius: "12px",
                  textAlign: "center",
                  height: "100%",
                  backgroundColor: "transparent",
                  color: "white",
                }}
              >
                {item.icon}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    fontSize: { xs: "1.1rem", md: "1.2rem" },
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: "0.9rem", md: "1rem" },
                    lineHeight: 1.6,
                    whiteSpace: "normal",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `${item.desc1}<br /><br />${item.desc2}`,
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
      {/* SECTION 1.5: SNS 강조 */}
      <Box
        sx={{
          textAlign: "center",
          mt: 16,
          px: 2,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", md: "3.75rem" },
            lineHeight: 1.4,
            whiteSpace: "pre-line", // ✅ 줄바꿈 유지
            mb: 4,
          }}
        >
          {"대표 채널 마케팅을\n"}
          <Box
            component="span"
            sx={{
              color: "#edd8b0",
              fontWeight: 900,
            }}
          >
            실행사 가격 그대로
          </Box>{" "}
          제공
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: "1.2rem", md: "1.5rem" },
            whiteSpace: "pre-line",
            lineHeight: 1.8,
            opacity: 0.9, 
            mb: 8
          }}
        >
          인스타, 페이스북, 유튜브, 네이버, 틱톡, 스레드 등
          <br />
          국내에서 보기 힘든 <br />실제 실행사 가격으로 제공합니다.
        </Typography>

        {/* ✅ 스크롤에 따라 등장/사라짐 */}
        <AnimatePresence>
          {scrollDirection === "down" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, delay: 1.0 }} // ✅ 등장을 1초 늦춤
            >
              {/* 1행 */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 4,
                  mb: 4,
                  flexWrap: "wrap",
                }}
              >
                {["instagram", "facebook", "youtube"].map((icon, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 180,
                      height: 80,
                      backgroundColor: "#ffffff14",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 2,
                    }}
                  >
                    <img
                      src={`/icons/${icon}.png`}
                      alt={icon}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                ))}
              </Box>

              {/* 2행 */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 4,
                  flexWrap: "wrap",
                }}
              >
                {["Naver", "Threads", "X"].map((icon, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 180,
                      height: 80,
                      backgroundColor: "#ffffff14",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 2,
                    }}
                  >
                    <img
                      src={`/icons/${icon}.png`}
                      alt={icon}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
      {/* SECTION 3 – 고객 심리 공감 */}
 <Box
  sx={{
    backgroundColor: "#111827",
    py: 12,
    px: 2,
    textAlign: "center",
    mt: 16, // ✅ 위 섹션과 간격 벌림
  }}
>
  {/* 메인 카피 */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", md: "3.75rem" },
            lineHeight: 1.4,
            whiteSpace: "pre-line", // ✅ 줄바꿈 유지
            mb: 4,
          }}
        >
    광고대행사 믿고 맡기셔서<br />효과좀 보셨나요?
  </Typography>

    {/* 공감 텍스트 박스 */}
        <Box
          sx={{
            maxWidth: "800px",
            textAlign: "center",
            margin: "0 auto",
            border: "1px solid #edd8b0", // 부드러운 노란색 테두리
            borderRadius: "16px",
            p: 5,
            backgroundColor: "#1f2937", // 더 진한 회색 톤
          }}
        >
        <Typography
          variant="body1"
          sx={{
            color: "white",
            fontSize: { xs: "1.2rem", md: "1.5rem" }, opacity: 0.9,
            lineHeight: 1.8,
            whiteSpace: "pre-line",
          }}
        >
          실행사라고 속이고 마케팅 대행사 값으로 폭리를 취하는 사람들.
          <br />
          대표님도 마케팅을 알아야 된다면서 핵심비법은 알려주지 않는 대행사.
          <br />
          대행사의 화려한 말잔치에 휘둘려서 비싼 견적을 받아본 경험.
          <br />
          <Box
            component="span"
            sx={{
              color: "#edd8b0",
              fontWeight: 700,
              fontSize: { xs: "1.2rem", md: "1.5rem" }, opacity: 0.9,whiteSpace: "pre-line",
              display: "block",
              mt: 4,
              letterSpacing: "0.5px",
            }}
          >
            이제는 끝내야 할 시간입니다.
          </Box>
          </Typography>
        </Box>
      </Box>

     {/* 👇 이어서 SECTION 4 추가 */}
      <Box
        ref={section4Ref}
        sx={{
            backgroundColor: '#0f172a',
            py: 12,
            px: 2,
            textAlign: 'center', // ✅ 모든 텍스트/요소 가운데 정렬
          }}
        >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", md: "3.75rem" },
            lineHeight: 1.4,
            whiteSpace: "pre-line", // ✅ 줄바꿈 유지
            mb: 4,
          }}
        >
          숨기지 않겠습니다 <br /> 함께 성장할 고객이라면
        </Typography>

        <Box
          sx={{
            width: "80px",
            height: "4px",
            backgroundColor: "#edd8b0",
            margin: "20px auto",
            borderRadius: "2px",
          }}
        />

        <Typography sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" },whiteSpace: "pre-line", mb: 8, opacity: 0.85 }}>
          에이치앤비는 다릅니다. <br />
          대행사들이 감추는 노하우를 <br />
          <Box
            component="span"
            sx={{
              color: "#edd8b0",
              fontWeight: 700,
              fontSize: "1.3rem",
              display: "inline-block",
              mt: 2,
            }}
          >
            단 한 줄의 정보도 아끼지 않고 공유하겠습니다.
          </Box>
        </Typography>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inViewSection4 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
        <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Grid
              container
              spacing={{ xs: 4, md: 6 }}
              alignItems="stretch"
              sx={{
                maxWidth: "1200px",
                width: "100%",      // ✅ 정렬 안정화
                px: { xs: 2, md: 0 }
              }}
            >
              {[
                {
                  icon: <BuildIcon sx={{ fontSize: 50, color: "#edd8b0" }} />,
                  title: "마케팅 툴",
                  desc: "마케팅에 필요한 모든 툴을 제공합니다.<br />실무에서 즉시 사용할 수 있습니다.",
                },
                {
                  icon: <BarChartIcon sx={{ fontSize: 50, color: "#edd8b0" }} />,
                  title: "데이터",
                  desc: "플레이스 현황 데이터를 제공합니다.<br />직접 매일 모니터링 할 수 있습니다.",
                },
                {
                  icon: <MenuBookIcon sx={{ fontSize: 50, color: "#edd8b0" }} />,
                  title: "실행법",
                  desc: "마케팅 노하우를 모두 공개합니다.<br />대표님이 직접 실행할 수 있습니다.",
                },
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      border: "1px solid #edd8b022",
                      borderRadius: "16px",
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      minHeight: { xs: "220px", md: "240px" },
                    }}
                  >
                    <Box sx={{ mb: 2 }}>{item.icon}</Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        mb: 1,
                        fontSize: { xs: "1.1rem", md: "1.25rem" },
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.9,
                        fontSize: { xs: "0.95rem", md: "1rem" },
                        lineHeight: 1.6,
                        whiteSpace: "normal",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.desc }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Box>
      <Box
      sx={{
        position: "relative",
        backgroundImage: "url('/images/locked-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
        minHeight: "600px", // 충분한 높이 확보
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        '&::before': {
          content: "''",
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)", // 어두운 반투명 오버레이
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 800, }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", md: "3.75rem" },
            lineHeight: 1.4,
            whiteSpace: "pre-line", // ✅ 줄바꿈 유지
            mb: 4,
          }}
        >
        다만, 회원가입은<br />
        아무나 받지 않습니다
        </Typography>

        <Typography sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" },whiteSpace: "pre-line", opacity: 0.9, lineHeight: 1.8 }}>
          본 사이트는 '폐쇄형' 정책을 유지하고 있습니다.
          <br />
          기존 클라이언트와의 마케팅 경쟁력 보호를 위해,
          <br />
          현재는 소개 또는 직접 요청을 통해서
          <br />
          <Box
            component="span"
            sx={{
              color: "#edd8b0",
              fontWeight: 600,
            }}
          >
            확인절차를 거친 후에만 가입이<br /> 가능한점 양해바랍니다.
          </Box>
        </Typography>
      </Box>
    </Box>          
    <Box
      sx={{
        backgroundColor: "#0f172a",
        py: 14,
        px: 2,
        color: "#fff",
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      {/* 헤드카피 */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", md: "3.75rem" },
            lineHeight: 1.4,
            whiteSpace: "pre-line", // ✅ 줄바꿈 유지
            mb: 4,
          }}
        >
        좋은 제품만으로 팔리는 시대
        <br />
        이미 지나갔습니다
      </Typography>

      {/* 서브카피 */}
      <Typography
        sx={{
          fontSize: { xs: "1.2rem", md: "1.5rem" },
          whiteSpace: "pre-line",
          opacity: 0.9,
          lineHeight: 1.8,
          mb: 2,
        }}
      >
        지금은 정보가 곧 힘입니다.
        진짜를 알고, <br />실행할 수 있는 대표님만이 살아남습니다.
      </Typography>

      {/* 강조 멘트 */}
      <Typography
        sx={{
          fontSize: { xs: "1.2rem", md: "1.5rem" },
          whiteSpace: "pre-line",
          fontWeight: 700,
          color: "#edd8b0",
          mt: 2,
        }}
      >
        지금 이 순간에도<br />
        현명한 대표님은 에이치앤비와 <br />함께하고 있습니다.
      </Typography>

      {/* 고객 리뷰 슬라이더 */}
      <Box
        sx={{
          mt: 10,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div
          style={{
            display: "flex",
            gap: "32px",
            whiteSpace: "nowrap",
          }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 30,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {reviews.concat(reviews).map((review, idx) => (
            <Box
              key={idx}
              sx={{
                flexShrink: 0,
                padding: "16px 24px",
                backgroundColor: "#1e293b",
                borderRadius: "12px",
                border: "1px solid #333",
                fontSize: "1rem",
                color: "#fff",
                minWidth: 280,
              }}
            >
              <Box sx={{ fontWeight: 700, mb: 1 }}>{review.name}</Box>
              <Box sx={{ color: "#edd8b0", mb: 1 }}>
                {"★".repeat(review.rating)}
              </Box>
              <Box sx={{ opacity: 0.9 }}>“{review.text}”</Box>
            </Box>
          ))}
        </motion.div>
      </Box>
    </Box>
      {/* SECTION 8: 로그인 바 */}
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          py: 2,
          px: { xs: 2, md: 8 },
          backgroundColor: "#fff",
          borderTop: "1px solid #ddd",
          zIndex: 2000,
        }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <TextField
            size="small"
            fullWidth
            label="이메일"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            type="password"
            label="비밀번호"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{
              minWidth: 120,
              backgroundColor: "#6a4ef5",
              "&:hover": { backgroundColor: "#5a3de0" },
            }}
            onClick={handleLogin}
          >
            로그인
          </Button>
        </Box>
      </Paper>
    </div>
  );
}