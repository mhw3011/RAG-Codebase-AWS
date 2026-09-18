const API_URL = import.meta.env.VITE_API_URL;
import { useState, useRef, useEffect } from "react";
import { api } from "./api";
import Auth from "./Auth";
import { useAuth } from "./AuthContext";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { supabase } from "./lib/supabaseClient";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import FileTree from "./components/FileTree";
import buildFileTree from "./utils/buildFileTree";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");

  const [selectedCode, setSelectedCode] = useState(null);
  const [files, setFiles] = useState([]);

  const fileTree = buildFileTree(files);
  const chatRef = useRef();

  useEffect(() => {
    if (!session) {
      setRepoUrl("");
      setSessionId("");
      setQuestion("");
      setMessages([]);
      setLoading(false);
      setUploadStatus("idle");
      setSelectedCode(null);
      setFiles([]);
    }
  }, [session]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

    if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  const handleUpload = async () => {
  try {
    setUploadStatus("loading");

const res = await api.post("/api/upload-repo", {
      repoUrl,
    });

    const id = res.data.sessionId;
    setSessionId(id);

    let attempts = 0;

    while (attempts < 60) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusRes = await api.get(
        `${API_URL}/api/status/${id}`
      );

      const status = statusRes.data.status;

      console.log("Processing status:", status);

      if (status === "completed") {
        const filesRes = await api.get(
          `${API_URL}/api/files/${id}`
        );

        setFiles(filesRes.data);
        setUploadStatus("done");
        return;
      }

      if (status === "failed") {
        throw new Error(
          statusRes.data.error || "Repository processing failed"
        );
      }

      attempts++;
    }

    throw new Error("Repository processing timed out");
  } catch (err) {
    console.error(err);
    setUploadStatus("idle");
  }
};

  const handleAsk = async () => {
    if (!question) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
	const res = await api.post("/api/query", {
        sessionId,
        question,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.answer,
          sources: res.data.sources,
        },
      ]);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
    setQuestion("");
  };

  const getLanguage = (file = "") => {
    const f = file.toLowerCase();

    if (f.endsWith(".py")) return "python";
    if (f.endsWith(".java")) return "java";
    if (f.endsWith(".cpp")) return "cpp";
    if (f.endsWith(".ts")) return "typescript";
    if (f.endsWith(".tsx")) return "tsx";
    if (f.endsWith(".jsx")) return "jsx";
    if (f.endsWith(".json")) return "json";
    if (f.endsWith(".html")) return "html";
    if (f.endsWith(".css")) return "css";
    if (f.endsWith(".js")) return "javascript";

    return "javascript";
  };


  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      
      <Sidebar
  repoUrl={repoUrl}
  setRepoUrl={setRepoUrl}
  handleUpload={handleUpload}
  uploadStatus={uploadStatus}
  fileTree={fileTree}
  setSelectedCode={setSelectedCode}
  session={session}
  setSessionId={setSessionId}
  supabase={supabase}
/>

      {/* CHAT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#f1f5f9",
        }}
      >
        <Box
          sx={{
            width: "800px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderBottom: "1px solid #ddd",
            }}
          >
            <Typography variant="h6">Ask your codebase</Typography>
          </Box>

          {/* CHAT */}
          <Box
            ref={chatRef}
            sx={{
              flex: 1,
              overflow: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.map((msg, i) => (
  <ChatMessage
    key={i}
    msg={msg}
    setSelectedCode={setSelectedCode}
  />
))}
            {loading && <CircularProgress size={20} />}
          </Box>

          {/* INPUT */}
          <Box sx={{ p: 2, backgroundColor: "white", display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Ask something about the repo..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button variant="contained" onClick={handleAsk}>
              Send
            </Button>
          </Box>
        </Box>
      </Box>

      {/* MODAL */}
      <Dialog
        open={!!selectedCode}
        onClose={() => setSelectedCode(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{selectedCode?.name || "Code Preview"}</DialogTitle>

        <DialogContent>
          <Typography sx={{ fontSize: "12px", mb: 1 }}>
            {selectedCode?.file}
          </Typography>

          <SyntaxHighlighter
            language={getLanguage(selectedCode?.file)}
            style={oneDark}
          >
            {selectedCode?.code || "// No code available"}
          </SyntaxHighlighter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
