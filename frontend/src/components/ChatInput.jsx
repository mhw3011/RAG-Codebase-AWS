import { Box, Button, TextField } from "@mui/material";

function ChatInput({ question, setQuestion, handleAsk }) {
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "white",
        display: "flex",
        gap: 2,
      }}
    >
      <TextField
        fullWidth
        placeholder="Ask something about the repo..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAsk();
          }
        }}
      />

      <Button variant="contained" onClick={handleAsk}>
        Send
      </Button>
    </Box>
  );
}

export default ChatInput;
