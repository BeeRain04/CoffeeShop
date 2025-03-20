import React, { useState, useEffect, useRef  } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const responses = {
    "giới thiệu sản phẩm": "Chúng tôi có nhiều sản phẩm chất lượng, hãy cho tôi biết bạn cần loại nước nào nhé!",
    "cà phê": "Cà phê thì quán chúng tôi có cà phê MOCHA chất lượng lắm, bạn muốn dùng thử không?",
    "có": "Cà phê MOCHA là sự kết hợp hoàn hảo giữa cà phê đậm đà và bột cacao đắng, kết hợp với sữa tươi tạo nên một món thức uống ngọt ngào, béo ngậy và thơm lừng.",
    "tôi muốn đặt mua nó": "Hãy thêm vào giỏ và thanh toán ngay nào!",
    "ok": "Bạn còn thắc mắc gì nữa không?",
    "không": "Nếu có hãy hỏi COFFEE SHOP nhé!",
    "được": "Chúc bạn có một ngày vui vẻ",
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (input.trim() === "") return;
  
    const userMessage = input.toLowerCase();
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
  
    setTimeout(() => {
      const botResponse = responses[userMessage] || "Xin lỗi, tôi chưa hiểu. Bạn có thể hỏi về sản phẩm, khuyến mãi hoặc bảo hành!";
      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    }, 1000);
  };
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={handleToggle}>
          💬
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>Chat hỗ trợ</span>
            <button className="close-btn" onClick={handleToggle}>✖</button>
          </div>

          <div className="chat-body">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Phần tử để cuộn xuống cuối */}
          </div>

          <div className="chat-footer">
            <input
              type="text"
              value={input}
              placeholder="Nhập tin nhắn..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
