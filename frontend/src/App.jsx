const API_URL = import.meta.env.VITE_API_URL;
import { useState, useRef, useEffect } from "react";
import { api } from "./api";
import Auth from "./Auth";
import { useAuth } from "./AuthContext";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";

import { supabase } from "./lib/supabaseClient";

import FileTree from "./components/FileTree";
import buildFileTree from "./utils/buildFileTree";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import CodePreview from "./components/CodePreview";

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
  const [mobileOpen, setMobileOpen] = useState(false);

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

      while (attempts < 180) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusRes = await api.get(`${API_URL}/api/status/${id}`);

        const status = statusRes.data.status;

        console.log("Processing status:", status);

        if (status === "completed") {
          const filesRes = await api.get(`${API_URL}/api/files/${id}`);

          setFiles(filesRes.data);
          setUploadStatus("done");
          return;
        }

        if (status === "failed") {
          throw new Error(
            statusRes.data.error || "Repository processing failed",
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
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* CHAT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",

          backgroundColor: "#f1f5f9",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 0.5,
              backgroundColor: "white",
              borderBottom: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Button
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: "flex", md: "none" },
                minWidth: 40,
                fontSize: "24px",
                color: "#0f172a",
                p: 0,
              }}
            >
              ☰
            </Button>

            <Box
              component="img"
              src="/codebase-rag-logoWithText.png"
              alt="CodeBase RAG"
              sx={{
                width: { xs: "190px", md: "260px" },
                height: { xs: "42px", md: "52px" },
                objectFit: "contain",
                objectPosition: "left center",
                display: "block",
              }}
            />
          </Box>

          {/* CHAT */}
          <Box
            ref={chatRef}
            sx={{
              flex: 1,
              overflow: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
              maxWidth: "900px",
              mx: "auto",
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

          <ChatInput
            question={question}
            setQuestion={setQuestion}
            handleAsk={handleAsk}
          />
        </Box>
      </Box>

      <CodePreview
        selectedCode={selectedCode}
        setSelectedCode={setSelectedCode}
        getLanguage={getLanguage}
      />
    </Box>
  );
}
