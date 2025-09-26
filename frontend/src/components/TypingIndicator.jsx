export default function TypingIndicator() {
    return (
      <div className="message bot">
        <div className="message-bubble">
          <div className="typing-indicator">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      </div>
    );
  }