import { createTheme } from "@mui/material/styles";
import { TypographyVariantsOptions } from "@mui/material/styles";
declare module '@mui/material/styles' {
  interface TypographyVariants {
    headlineBold: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    headlineBold?: React.CSSProperties;
  }
}
declare module "@mui/material/styles" {
  interface TypographyVariants {
    headlineStrong: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    headlineStrong?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    headlineStrong: true;
  }
}
// Pretendard 또는 원하는 폰트를 설치했을 경우
const theme = createTheme({
  typography: {
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",

    // ✅ 커스텀 헤드카피 스타일 정의
    headlineBold: {
      fontWeight: 900,
      fontSize: "2.75rem",
      lineHeight: 1.3,
      color: "#fff", // 필요 시
      textAlign: "center",
    },
      headlineStrong: {
    fontWeight: 900,
    fontSize: "3rem",
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
    textAlign: "center",
    lineHeight: 1.4,
  },
  },
  
});

export default theme;