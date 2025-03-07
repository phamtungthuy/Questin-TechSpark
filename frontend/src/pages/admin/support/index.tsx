import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import AdminTopBar from "components/admin/admin-topbar";
import SupportHistory from "components/admin/support/support-history";
import SupportSidebar from "components/admin/support/support-sidebar";
import SupportChat from "components/admin/support/support-chat";
import { useParams } from "react-router-dom";
import { IMessage } from "interfaces/database/conversation";

const AdminSupportPage = () => {
  const { dialogId, conversationId } = useParams();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [chatHistory, setChatHistory] = useState<IMessage[]>([]);
  const backendHost =
    process.env.REACT_APP_BACKEND_HOST || "http://localhost:8000";
  useEffect(() => {
    if (!conversationId) return;

    fetch(`${backendHost}/ws/v1/chat/conversation/${conversationId}`)
      .then((res) => res.text())
      .then((data) => {
        try {
          const parsedData = JSON.parse(data);
          setChatHistory(parsedData);
        } catch (error) {
          console.warn("Response is not JSON:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching chat history:", error);
      });
  }, [conversationId]);

  useEffect(() => {
    console.log("Updated chat history:", chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    if (!conversationId) return;

    const backendHost =
      process.env.REACT_APP_BACKEND_HOST || "http://localhost:8000";
    const backendUrl = new URL(backendHost);
    const wsProtocol = backendUrl.protocol === "https:" ? "wss" : "ws";
    const wsHost = backendUrl.host;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/v1/chat/${conversationId}`;
    const ws = new WebSocket(wsUrl);
    console.log("Connecting to WebSocket at:", wsUrl);

    ws.onopen = () => {
      console.log("Connected to WebSocket room:", conversationId);
      setWs(ws);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      if (message.sender === "user") {
        console.log("Creating new message for user...");

        const newMessage: IMessage = {
          id: Date.now().toString(),
          create_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
          conversation_id: conversationId,
          dialog_id: dialogId,
          role: "user",
          qas: [
            {
              id: Date.now().toString(),
              create_date: new Date().toISOString(),
              update_date: new Date().toISOString(),
              message_id: "",
              question: "",
              answer: [
                {
                  id: Date.now().toString(),
                  create_date: new Date().toISOString(),
                  update_date: new Date().toISOString(),
                  content: message.content,
                  think: "",
                  reference: {},
                  thumb: "0",
                  feedback: "",
                  status: "",
                  citation: false,
                },
              ],
            },
          ],
        };

        console.log("New message object:", newMessage);

        setChatHistory((prev) => {
          const updatedChatHistory = [...prev, newMessage];
          console.log("Updated chat history:", updatedChatHistory);
          return updatedChatHistory;
        });
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      console.log("Cleaning up WebSocket...");
      ws.close();
    };
  }, [conversationId]);

  return (
    <Box height="100vh" overflow="hidden">
      <AdminTopBar />
      <Box display="flex" width="100%" height="100vh">
        <Box flex="2">
          <SupportSidebar />
        </Box>
        <Box flex="6">
          <SupportChat
            chatHistory={chatHistory}
            ws={ws}
            setChatHistory={setChatHistory}
          />
        </Box>
        <Box flex="2">
          <SupportHistory />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminSupportPage;
