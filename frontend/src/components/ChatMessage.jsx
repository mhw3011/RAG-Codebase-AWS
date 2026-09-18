import { Box, Paper, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatMessage({ msg, setSelectedCode }) {
  return (
    <Box
      sx={{
        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
        maxWidth: "70%",
      }}
    >
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Box
          sx={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#0f172a",
            "& p": { margin: "6px 0" },
            "& code": {
              backgroundColor: "#e2e8f0",
              padding: "2px 4px",
              borderRadius: "4px",
              fontSize: "13px",
            },
            "& pre": {
              backgroundColor: "#0f172a",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              overflowX: "auto",
            },
            "& h1, & h2, & h3": {
              margin: "10px 0 6px",
            },
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.text}
          </ReactMarkdown>
        </Box>

        {msg.sources?.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: "12px", color: "gray" }}>
              Files:
            </Typography>

            {msg.sources.map((s, idx) => (
              <Box key={idx} sx={{ mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "black",
                    mb: 0.5,
                  }}
                >
                  📄 {s.file}
                </Typography>

                <Typography
                  onClick={() =>
                    setSelectedCode({
                      file: s.file,
                      name: `Lines ${s.startLine}-${s.endLine}`,
                      code: s.code,
                    })
                  }
                  sx={{
                    fontSize: "14px",
                    ml: 3,
                    color: "#60a5fa",
                    cursor: "pointer",
                    fontWeight: 400,
                    display: "inline-block",
                    textDecoration: "underline",
                  }}
                >
                  Lines : {s.startLine}-{s.endLine}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ChatMessage;