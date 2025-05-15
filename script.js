// Remove o threadId armazenado ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    localStorage.removeItem('threadId');
});

// Variável para controlar se o bot está respondendo
let isBotResponding = false;
// Array para armazenar as mensagens para o corpo da requisição
let messageLog = [];

// Função para simular o envio da mensagem
function sendMessage() {
    const userMessageInput = document.getElementById('userMessage');
    const userMessageText = userMessageInput.value;

    if (userMessageText.trim() !== '' && !isBotResponding) {
        // Adiciona a mensagem do usuário na caixa de chat
        addMessage('user', { content: userMessageText, citations: [] });

        // Limpa o campo de entrada
        userMessageInput.value = '';

        // Desabilita o input e o botão de enviar enquanto aguarda a resposta do bot
        disableUserInput(true);

        // Define a flag para evitar envio de outra mensagem
        isBotResponding = true;

        // Trata a nova mensagem e busca a resposta do bot
        handleNewMessage(userMessageText);
    }
}

// Função para adicionar mensagens na caixa de chat e ao log
function addMessage(sender, message) {
    const chatbox = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender + '-message');

    const img = document.createElement('img');
    img.src = sender === 'user' ? 'imagens/user.png' : 'imagens/chatbot.png';
    messageDiv.appendChild(img);

    const chatContent = document.createElement('div');
    chatContent.classList.add('chat-content');

    if (sender === 'bot') {
        // Renderiza o Markdown e adiciona as referências, se houver
        const contentHTML = marked.parse(message.content);
        let fullHTML = contentHTML;
        if (message.citations && message.citations.length > 0) {
            let citationsHTML = '<div class="citations"><strong>Referências:</strong><ul>';
            message.citations.forEach(citation => {
                citationsHTML += `<li><a href="${citation.url}" target="_blank">[${citation.id}]: ${citation.filename}</a></li>`;
            });
            citationsHTML += '</ul></div>';
            fullHTML += citationsHTML;
        }
        chatContent.innerHTML = fullHTML;
    } else {
        // Para mensagens do usuário, exibe como texto simples
        chatContent.textContent = message.content;
    }

    // Se houver referências (para outros casos), adiciona-as
    if (message.citations && message.citations.length > 0 && sender !== 'bot') {
        const citationsDiv = document.createElement('div');
        citationsDiv.classList.add('citations');
        citationsDiv.innerHTML = '<strong>Referências:</strong>';

        const citationsList = document.createElement('ul');
        message.citations.forEach(citation => {
            const citationItem = document.createElement('li');
            citationItem.innerHTML = `<a href="${citation.url}" target="_blank">[${citation.id}]: ${citation.filename}</a>`;
            citationsList.appendChild(citationItem);
        });

        citationsDiv.appendChild(citationsList);
        chatContent.appendChild(citationsDiv);
    }

    messageDiv.appendChild(chatContent);
    chatbox.appendChild(messageDiv);

    // Adiciona a mensagem ao log
    messageLog.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: message.content
    });

    // Rola a caixa de chat até o final
    scrollToBottom();
}

// Função para adicionar uma mensagem de loading (com animação de reticências)
function addBotLoadingMessage() {
    const chatbox = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'bot-message');

    const img = document.createElement('img');
    img.src = 'imagens/chatbot.png';
    messageDiv.appendChild(img);

    const chatContent = document.createElement('div');
    chatContent.classList.add('chat-content');
    chatContent.innerText = ''; // Inicialmente vazio
    messageDiv.appendChild(chatContent);

    chatbox.appendChild(messageDiv);
    chatContent.classList.add('loading-dots');
    scrollToBottom();
    return { messageDiv, chatContent };
}

// Função para atualizar a mensagem de loading com a resposta do bot e referências
function updateLoadingMessage(loadingMessage, botResponse) {
    loadingMessage.chatContent.classList.remove('loading-dots');
    const contentHTML = marked.parse(botResponse.content);
    let fullHTML = contentHTML;
    if (botResponse.citations && botResponse.citations.length > 0) {
        let citationsHTML = '<div class="citations"><strong>Referências:</strong><ul>';
        botResponse.citations.forEach(citation => {
            citationsHTML += `<li><a href="${citation.url}" target="_blank">[${citation.id}]: ${citation.filename}</a></li>`;
        });
        citationsHTML += '</ul></div>';
        fullHTML += citationsHTML;
    }
    loadingMessage.chatContent.innerHTML = fullHTML;
}

// Função para tratar a nova mensagem e buscar a resposta do bot
function handleNewMessage(userMessage) {
    console.log('Usuário:', userMessage);

    // Verifica se há um threadId armazenado no localStorage
    const storedThreadId = localStorage.getItem('threadId');

    // Cria o payload; inclui o threadId se ele existir
    let payload = {
        role: 'user',
        content: userMessage
    };

    if (storedThreadId) {
        payload.threadId = storedThreadId;
    }

    // Adiciona a mensagem de loading com animação de reticências
    const loadingMessage = addBotLoadingMessage();
    let dotCount = 0;
    const maxDots = 3;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount % maxDots) + 1;
        loadingMessage.chatContent.innerText = '.'.repeat(dotCount);
    }, 500);

    // Envia a requisição para a API
    fetch('https://safechatbot.azurewebsites.net/api/chatbotapi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Bot:', data);

        // Se a resposta contiver um threadId, armazena-o no localStorage
        if (data.threadId) {
            localStorage.setItem('threadId', data.threadId);
        }

        // Prepara a resposta do bot para exibição
        const botResponse = {
            content: data.answer || 'Nenhuma resposta do bot.',
            citations: data.citations || []
        };

        // Para a animação de loading
        clearInterval(loadingInterval);

        // Atualiza a mensagem de loading com a resposta real e referências
        updateLoadingMessage(loadingMessage, botResponse);

        // Registra a mensagem do bot no log
        messageLog.push({
            role: 'assistant',
            content: botResponse.content
        });

        // Habilita o input e o botão de enviar após a resposta do bot
        disableUserInput(false);

        // Reseta a flag para permitir o envio de outra mensagem
        isBotResponding = false;
    })
    .catch(error => {
        console.error('Erro:', error);
        clearInterval(loadingInterval);
        loadingMessage.chatContent.innerText = 'Erro ao buscar resposta.';
        disableUserInput(false);
        isBotResponding = false;
    });
}

// Função para habilitar/desabilitar o input e o botão de enviar
function disableUserInput(disable) {
    const userMessageInput = document.getElementById('userMessage');
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');
    userMessageInput.disabled = disable;
    sendButton.disabled = disable;
}

// Envia mensagem ao pressionar "Enter"
document.getElementById('userMessage').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Função para limpar o chat e resetar o threadId
function clearChat() {
    const chatbox = document.getElementById('messages');
    chatbox.innerHTML = ''; // Remove todas as mensagens
    messageLog = []; // Limpa o log de mensagens
    localStorage.removeItem('threadId'); // Reseta o threadId
}

// Função para rolar a caixa de chat até o final
function scrollToBottom() {
    const chatbox = document.getElementById('messages');
    chatbox.scrollTop = chatbox.scrollHeight;
}
