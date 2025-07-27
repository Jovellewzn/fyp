console.log('chatbot.js loaded, toggleBtn =', document.getElementById('chatbot-toggle'));

const toggleBtn = document.getElementById('chatbot-toggle');
toggleBtn.onclick = () => {
  window.botpressWebChat.sendEvent({ type: 'show' });
};
