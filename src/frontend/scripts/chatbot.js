console.log('chatbot.js loaded, toggleBtn =', document.getElementById('chatbot-toggle'));

const toggleBtn = document.getElementById('chatbot-toggle');
const chatbotWindow = document.getElementById('chatbot-window');
const closeBtn = document.getElementById('chatbot-close');
const form = document.getElementById('chatbot-form');
const input = document.getElementById('chatbot-input');
const messages = document.getElementById('chatbot-messages');

toggleBtn.onclick = () => chatbotWindow.style.display = 'block';
closeBtn.onclick = () => chatbotWindow.style.display = 'none';

// Simple bot reply (replace with real AI API if needed)
function botReply(text) {
    const msg = document.createElement('div');
    msg.className = 'chatbot-message bot';
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

toggleBtn.addEventListener('click', () => {
  console.log('💬 was clicked');
  chatbotWindow.style.display = 'flex';
});

// User sends message
form.onsubmit = (e) => {
    e.preventDefault();
    const userMsg = input.value.trim();
    if (!userMsg) return;
    // Show user message
    const userDiv = document.createElement('div');
    userDiv.className = 'chatbot-message user';
    userDiv.textContent = userMsg;
    messages.appendChild(userDiv);
    messages.scrollTop = messages.scrollHeight;
    input.value = '';   

// Bot reply (demo)
setTimeout(() => {
        botReply("I'm a demo chatbot! Ask me about tournaments, friends, or GameVibe features.");
    }, 600);
    };
