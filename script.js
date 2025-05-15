// Variable to track if the bot has responded
let isBotResponding = false;
// Array to hold all messages for API body
let messageLog = [];

// Function to simulate message sending
function sendMessage() {
    const userMessageInput = document.getElementById('userMessage');
    const userMessageText = userMessageInput.value;

    if (userMessageText.trim() !== '' && !isBotResponding) {
        // Add user message to chatbox
        addMessage('user', {'content':userMessageText, 'citations':[]});

        // Clear input field
        userMessageInput.value = '';

        // Disable the input and send button while waiting for the bot response
        disableUserInput(true);

        // Set flag to true to prevent sending another message
        isBotResponding = true;

        // Call the function to handle both messages and fetch response from the bot
        handleNewMessage(userMessageText);
    }
}

// Function to add messages to the chatbox and log 
function addMessage(sender, message) {
    const chatbox = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender + '-message');

    const img = document.createElement('img');
    img.src = sender === 'user' ? 'imagens/user.png' : 'imagens/chatbot.png';
    messageDiv.appendChild(img);

    const chatContent = document.createElement('div');
    chatContent.classList.add('chat-content');
    // Verifica se a mensagem é um objeto com `content` e `citations`
    if (message.content && message.citations.length > 0) {
        // Adiciona o conteúdo principal
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        contentDiv.innerText = message.content;
        chatContent.appendChild(contentDiv);

        // Adiciona as referências
        if (message.citations.length > 0) {
            const citationsDiv = document.createElement('div');
            citationsDiv.classList.add('citations');
            citationsDiv.innerHTML = '<strong>Referências:</strong>';

            const citationsList = document.createElement('ul');
            message.citations.forEach(citation => {
                const citationItem = document.createElement('li');
                citationItem.innerHTML = `<a href="${citation.url}" target="_blank">[${citation.id}]: ${citation.filepath}</a>`;
                citationsList.appendChild(citationItem);
            });

            citationsDiv.appendChild(citationsList);
            chatContent.appendChild(citationsDiv);
        }
    } else {
        // Adiciona a mensagem como texto simples
        
        console.log(message.content)
        chatContent.innerText = message.content;
    }

    messageDiv.appendChild(chatContent);
    chatbox.appendChild(messageDiv);

    // Add message to messageLog array
    messageLog.push({
        role: sender === 'user' ? 'user' : 'assistant', // Define a role based on sender
        content: message.content
    });

    // Scroll to the bottom after adding the message
    scrollToBottom();
}

// Function to handle the new message from the user and get bot's response
function handleNewMessage(userMessage) {
    console.log('User:', userMessage);

    // Send the messageLog to the API to get the bot's response
    //https://mockgenaiapilink-gxbxf5cbhvbcegdk.eastus2-01.azurewebsites.net
    fetch('https://mockgenaiapilink-gxbxf5cbhvbcegdk.eastus2-01.azurewebsites.net/chatbotapi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageLog })
    })
    .then(response => response.json())
    .then(data => {
        // Verifica se a resposta do bot contém um JSON estruturado
        const botResponse = data || 'No response from bot';
        console.log('Bot:', botResponse);

        // Adiciona a resposta do bot ao chatbox, passando o objeto JSON
        addMessage('bot', botResponse);

        // Enable the input and send button after the bot responds
        disableUserInput(false);

        // Reset flag to allow sending another message
        isBotResponding = false;
    })
    .catch(error => {
        console.error('Error:', error);
        // In case of an error, allow the user to send messages again
        disableUserInput(false);
        isBotResponding = false;
    });
}

// Function to enable/disable user input and send button
function disableUserInput(disable) {
    const userMessageInput = document.getElementById('userMessage');
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');

    userMessageInput.disabled = disable;
    sendButton.disabled = disable;
}

// Add event listener to send message on "Enter" key press
document.getElementById('userMessage').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Optional: Function to clear the chat
function clearChat() {
    const chatbox = document.getElementById('messages');
    chatbox.innerHTML = ''; // Remove all messages
    messageLog = []; // Clear the message log array
}

// Function to scroll to the bottom of the chatbox
function scrollToBottom() {
    const chatbox = document.getElementById('messages');
    chatbox.scrollTop = chatbox.scrollHeight; // Scrolls to the bottom of the chatbox
}