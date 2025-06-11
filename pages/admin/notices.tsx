// AdminNoticeEditor.tsx - PDF 업로드 및 다운로드 링크 삽입 추가

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db, auth, storage } from "../../lib/firebaseClient";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";

import DashboardLayout from "../../components/DashboardLayout";

import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Paper,
} from "@mui/material";

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';

export default function AdminNoticeEditor() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [font, setFont] = useState("맑은 고딕");
  const [fontSize, setFontSize] = useState("15");
  const [editorInitialized, setEditorInitialized] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
    ],
    content: "",
    onCreate: () => {
      setEditorInitialized(true);
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email === "dltjdqls9565@naver.com") {
        setIsAdmin(true);
      } else {
        alert("접근 권한이 없습니다.");
        router.push("/");
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !editor || !editorInitialized || !isAdmin) return;

      setLoading(true);
      const docRef = doc(db, "notices", id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title);
        editor.commands.setContent(data.content || "");
      }
      setLoading(false);
    };

    fetchData();
  }, [id, editor, editorInitialized, isAdmin]);

  useEffect(() => {
    if (editor && editorInitialized) {
      editor.commands.setMark("textStyle", { fontFamily: font });
      editor.commands.setMark("textStyle", { fontSize: `${fontSize}px` });
    }
  }, [editorInitialized]);

  const handleSave = async () => {
    const content = editor?.getHTML();
    if (!title.trim() || !content?.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      if (id) {
        await updateDoc(doc(db, "notices", id as string), {
          title,
          content,
        });
        alert("공지 수정 완료");
      } else {
        await addDoc(collection(db, "notices"), {
          title,
          content,
          createdAt: serverTimestamp(),
          views: 0,
        });
        alert("공지 작성 완료");
      }
      router.push("/notices");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  if (!authChecked || !editor || !editorInitialized) return <p>로딩 중...</p>;

  return (
    <DashboardLayout>
      <Box maxWidth="800px" mx="auto">
        <Typography variant="h5" fontWeight="bold" mb={5}>
          {id ? "공지 수정" : "공지 작성"}
        </Typography>

        <TextField
          fullWidth
          label="제목을 입력하세요"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => editor.chain().focus().toggleBold().run()}>
              <FormatBoldIcon />
            </IconButton>
            <IconButton onClick={() => editor.chain().focus().toggleItalic().run()}>
              <FormatItalicIcon />
            </IconButton>
            <IconButton onClick={() => editor.chain().focus().toggleStrike().run()}>
              <StrikethroughSIcon />
            </IconButton>
            <IconButton onClick={() => editor.chain().focus().setTextAlign("left").run()}>
              <FormatAlignLeftIcon />
            </IconButton>
            <IconButton onClick={() => editor.chain().focus().setTextAlign("center").run()}>
              <FormatAlignCenterIcon />
            </IconButton>
            <IconButton onClick={() => editor.chain().focus().setTextAlign("right").run()}>
              <FormatAlignRightIcon />
            </IconButton>
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              title="글자 색"
            />
            <TextField
              type="number"
              label="글자크기"
              size="small"
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                editor.chain().focus().setMark("textStyle", { fontSize: `${e.target.value}px` }).run();
              }}
              sx={{ width: 100 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>글꼴</InputLabel>
              <Select
                value={font}
                label="글꼴"
                onChange={(e) => {
                  setFont(e.target.value);
                  editor.chain().focus().setMark("textStyle", { fontFamily: e.target.value }).run();
                }}
              >
                <MenuItem value="맑은 고딕">맑은 고딕</MenuItem>
                <MenuItem value="굴림">굴림</MenuItem>
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Nanum Gothic">나눔고딕</MenuItem>
              </Select>
            </FormControl>
            <IconButton component="label">
              📷
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !editor) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result;
                    if (typeof base64 === "string") {
                      editor.chain().focus().setImage({ src: base64 }).run();
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </IconButton>
            <IconButton component="label">
              📄
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !editor) return;
                  const storageRef = ref(storage, `notices/${file.name}`);
                  await uploadBytes(storageRef, file);
                  const url = await getDownloadURL(storageRef);
                  editor.commands.insertContent(
                    `<p><a href="${url}" download target="_blank">📄 ${file.name} 다운로드</a></p>`
                  );
                }}
              />
            </IconButton>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box
            onClick={() => editor?.commands.focus()}
            sx={{
              minHeight: 300,
              cursor: "text",
              "& .ProseMirror": {
                outline: "none",
                lineHeight: "0.7",
                p: {
                  margin: "0 0 8px 0",
                },
                img: {
                  width: 'auto !important',
                  maxWidth: '100% !important',
                  height: 'auto !important',
                  display: 'block',
                  margin: '12px auto',
                  borderRadius: '8px',
                }
              },
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        </Paper>

        <Button variant="contained" sx={{ mt: 3 }} onClick={handleSave}>
          {id ? "수정 완료" : "작성 완료"}
        </Button>
      </Box>
    </DashboardLayout>
  );
}