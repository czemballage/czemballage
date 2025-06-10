// --- Global Variables ---
let currentUser = null;
let currentChannelId = null;
let messagesListener = null; // To store Firestore unsubscribe function for messages
let channelsListener = null; // To store Firestore unsubscribe function for channels

// Firebase services (initialized once)
const db = firebase.firestore();

// --- Main Initialization Function ---
function initializeChat(user) {
    currentUser = user;
    if (!currentUser) {
        console.error("User object is null, cannot initialize chat.");
        window.location.href = 'index.html'; // Should be handled by onAuthStateChanged already
        return;
    }

    // UI Elements
    const createChannelForm = document.getElementById('create-channel-form');
    const newChannelNameInput = document.getElementById('new-channel-name');
    const channelListElement = document.getElementById('channel-list');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesArea = document.getElementById('messages-area');
    const currentChannelNameElement = document.getElementById('current-channel-name');
    const noChannelSelectedMsg = document.getElementById('no-channel-selected');

    // Disable message input initially
    messageInput.disabled = true;
    messageForm.querySelector('button').disabled = true;

    // --- Channel Management ---
    // Create Channel
    createChannelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const channelName = newChannelNameInput.value.trim();
        if (channelName === "") return;

        try {
            await db.collection('channels').add({
                name: channelName,
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            newChannelNameInput.value = '';
            console.log(`Channel '${channelName}' created.`);
        } catch (error) {
            console.error("Error creating channel:", error);
            alert("Error creating channel. Please try again.");
        }
    });

    // List Channels
    if (channelsListener) channelsListener(); // Unsubscribe from previous listener
    channelsListener = db.collection('channels').orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            channelListElement.innerHTML = ''; // Clear list
            if (snapshot.empty) {
                channelListElement.innerHTML = '<li>No channels yet. Create one!</li>';
                return;
            }
            snapshot.forEach(doc => {
                const channel = doc.data();
                const channelId = doc.id;
                const listItem = document.createElement('li');
                listItem.textContent = `# ${channel.name}`;
                listItem.dataset.channelId = channelId;
                listItem.addEventListener('click', () => {
                    selectChannel(channelId, channel.name);
                });
                if (channelId === currentChannelId) {
                    listItem.classList.add('active-channel');
                }
                channelListElement.appendChild(listItem);
            });
        }, error => {
            console.error("Error fetching channels:", error);
            alert("Could not load channels.");
        });

    // Select Channel
    function selectChannel(channelId, channelName) {
        if (currentChannelId === channelId) return; // Already on this channel

        currentChannelId = channelId;
        currentChannelNameElement.textContent = `# ${channelName}`;
        messagesArea.innerHTML = ''; // Clear messages from previous channel
        if (noChannelSelectedMsg) noChannelSelectedMsg.style.display = 'none';


        // Enable message input
        messageInput.disabled = false;
        messageForm.querySelector('button').disabled = false;
        messageInput.placeholder = `Message #${channelName}`;


        // Update active channel highlighting
        document.querySelectorAll('#channel-list li').forEach(li => {
            li.classList.remove('active-channel');
            if (li.dataset.channelId === channelId) {
                li.classList.add('active-channel');
            }
        });

        // Load messages for the new channel
        loadMessages(channelId);
    }

    // --- Message Management (Channel Specific) ---
    // Load Messages for a Channel
    function loadMessages(channelId) {
        if (messagesListener) messagesListener(); // Unsubscribe from previous message listener

        const messagesRef = db.collection('channels').doc(channelId).collection('messages').orderBy('createdAt', 'asc');

        messagesListener = messagesRef.onSnapshot(snapshot => {
            // messagesArea.innerHTML = ''; // Clear messages only on new channel select, not every snapshot
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const messageData = change.doc.data();
                    displayMessage(messageData, currentUser.uid);
                }
                // Optionally handle 'modified' or 'removed' changes
            });
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, error => {
            console.error(`Error fetching messages for channel ${channelId}:`, error);
            // alert(`Could not load messages for ${currentChannelNameElement.textContent}.`);
        });
    }

    // Send Message (to current channel)
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();

        if (messageText === "" || !currentChannelId) return;

        try {
            await db.collection('channels').doc(currentChannelId).collection('messages').add({
                text: messageText,
                senderId: currentUser.uid,
                senderEmail: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            messageInput.value = '';
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Error sending message. Please try again.");
        }
    });

    // Display Message (same as before, just re-pasting for completeness in this block)
    function displayMessage(msgData, currentUserId) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        if (msgData.senderId === currentUserId) {
            messageDiv.classList.add('sent');
        } else {
            messageDiv.classList.add('received');
        }

        const senderDiv = document.createElement('div');
        senderDiv.classList.add('sender');
        senderDiv.textContent = msgData.senderId === currentUserId ? 'You' : msgData.senderEmail;

        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.textContent = msgData.text;

        const timeDiv = document.createElement('div');
        timeDiv.classList.add('timestamp');
        timeDiv.style.fontSize = '0.7em';
        timeDiv.style.color = '#888';
        timeDiv.textContent = msgData.createdAt ? new Date(msgData.createdAt.toDate()).toLocaleTimeString() : '';

        messageDiv.appendChild(senderDiv);
        messageDiv.appendChild(textDiv);
        messageDiv.appendChild(timeDiv);
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight; // Ensure scroll after adding message
    }
}

// Cleanup listeners when user logs out or page is left (simplified)
// This is implicitly handled by onAuthStateChanged redirecting and page reload,
// but for a single-page app (SPA) without page reloads, explicit cleanup is crucial.
// window.addEventListener('beforeunload', () => {
// if (messagesListener) messagesListener();
// if (channelsListener) channelsListener();
// });
