document.getElementById('startBtn').addEventListener('click', startConversation);
document.getElementById('endBtn').addEventListener('click', endConversation);

let isConversationActive = false;
let conversationHistory = [
    {
        role: 'system', content: `
        You are Sanjay Chhaba's personal assistant. Here are some details:
        - Name: Sanjay Chhaba
        - Date of Birth: July 13, 2001
        - Place of Birth: Jaipur, India
        - Education: B.Tech in Biotechnology from IIT Guwahati, MBA from IIM Ahmedabad
        - Professional History: 
          - Worked as a Software Engineer at Infosys from 2002 to 2006
          - Senior Consultant at Deloitte from 2006 to 2010
          - VP of Product at a leading FinTech startup from 2010 to 2015
          - Currently working as a Director at XYZ Corporation
        - Personal Interests: Technology, finance, and entrepreneurship
        You can answer questions about his personal and professional background, but nothing else. If asked about anything else, you should refuse to answer.`
    }
];
let ws;

function startConversation() {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('endBtn').style.display = 'inline-block';
    
    isConversationActive = true;
    console.log('Conversation started:', isConversationActive);

    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket connection established.');
        continueConversation();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
            console.error('Error from server:', data.error);
            isConversationActive = false;
            return;
        }

        console.log('Response from server:', data);

        conversationHistory.push({ role: 'user', content: data.transcript });
        conversationHistory.push({ role: 'assistant', content: data.botResponse });

        addMessage('user', `You: ${data.transcript}`);
        addMessage('bot', `Bot: ${data.botResponse}`);

        // Play the bot's response
        const audio = new Audio('data:audio/mp3;base64,' + data.audioData);
        playAudio(audio).then(() => {
            if (isConversationActive) {
                continueConversation();
            }
        });
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed.');
    };
}

function endConversation() {
    isConversationActive = false;
    console.log('End button clicked, isConversationActive:', isConversationActive);
    document.getElementById('conversation').style.display = 'none';
    document.getElementById('endBtn').style.display = 'none';
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('recordingIndicator').style.display = 'none';
    conversationHistory = [
        {
            role: 'system', content: `
            You are Sanjay Chhaba's personal assistant. Here are some details:
            - Name: Sanjay Chhaba
            - Date of Birth: July 13, 2001
            - Place of Birth: Jaipur, India
            - Education: B.Tech in Biotechnology from IIT Guwahati, MBA from IIM Ahmedabad
            - Professional History: 
              - Worked as a Software Engineer at Infosys from 2002 to 2006
              - Senior Consultant at Deloitte from 2006 to 2010
              - VP of Product at a leading FinTech startup from 2010 to 2015
              - Currently working as a Director at XYZ Corporation
            - Personal Interests: Technology, finance, and entrepreneurship
            You can answer questions about his personal and professional background, but nothing else. If asked about anything else, you should refuse to answer.`
        }
    ]; // Reset the conversation history
    if (ws) {
        ws.close();
    }
    console.log('Conversation ended.');
}

function addMessage(sender, message) {
    console.log(`Adding message from ${sender}: ${message}`);
    const conversationDiv = document.getElementById('conversation');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = message;
    conversationDiv.appendChild(messageDiv);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
}

async function continueConversation() {
    try {
        document.getElementById('recordingIndicator').style.display = 'flex';

        // Capture audio from the user
        const audioData = await getAudioInput();
        document.getElementById('recordingIndicator').style.display = 'none';

        if (!isConversationActive) {
            console.log('Conversation stopped after capturing audio.');
            return;
        }

        // Show the conversation box after capturing the first audio
        document.getElementById('conversation').style.display = 'block';

        console.log('Audio captured:', audioData);

        ws.send(JSON.stringify({ audioData, conversationHistory }));
    } catch (error) {
        console.error('Error during conversation:', error);
        isConversationActive = false;
    }
}

async function getAudioInput() {
    console.log('Requesting audio input...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = function(event) {
        chunks.push(event.data);
    };

    mediaRecorder.start();
    console.log('Recording audio...');

    await new Promise(resolve => setTimeout(resolve, 3000)); // Record for 3 seconds

    mediaRecorder.stop();
    console.log('Stopped recording.');

    return new Promise(resolve => {
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { 'type': 'audio/wav' });
            const reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = function() {
                const base64data = reader.result;
                console.log('Audio converted to base64:', base64data);
                resolve(base64data.split(',')[1]); // Return base64 string
            };
        };
    });
}

async function playAudio(audio) {
    return new Promise(resolve => {
        audio.onended = resolve;
        audio.play();
    });
}
