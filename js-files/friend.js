import {
  setDoc,
  onSnapshot,
  auth,
  updateDoc,
  increment,
  deleteDoc,
  orderBy,
  serverTimestamp,
  addDoc,
  signOut,
  onAuthStateChanged,
  query,
  getDoc,
  limit,
  where,
  collection,
  db,
  getDocs,
  doc,
} from "./logic.js";

let islogin = localStorage.getItem("login");
if (!islogin) {
  window.location.replace("./index.html");
}

// Sidebar toggle and sign out (existing code)
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebarToggle");
const mainContent = document.querySelector(".main-content");
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  mainContent.classList.toggle("shifted");
  document.querySelector(".data-pic").style.display =
    mainContent.classList.contains("shifted") ? "none" : "inline";
});
document.querySelector("#google-signout").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("logout successfully");
      localStorage.removeItem("login");
      window.location.replace("./index.html");
    })
    .catch((error) => {
      console.log(error);
    });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(user);
  } else {
    console.log("signed out");
  }
});

// Global variables for chat and friend requests
let currentConversationId = null;
let currentFriendId = null;

// DOM elements
const friendRequestsContainer = document.querySelector(
  "#friendRequestsContainer"
);
const conversationList = document.querySelector("#conversationList");
const chatContainer = document.querySelector("#chatContainer");
const chatFriendPhoto = document.querySelector("#chatFriendPhoto");
const chatFriendName = document.querySelector("#chatFriendName");
const closeChatBtn = document.querySelector("#closeChatBtn");
const chatMessages = document.querySelector("#chatMessages");
const messageInput = document.querySelector("#messageInput");
const sendMessageBtn = document.querySelector("#sendMessageBtn");

// ------------------------------
// 1. Friend Request Handling
// ------------------------------
async function loadFriendRequests() {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("toUserId", "==", islogin),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    friendRequestsContainer.innerHTML = "";
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      createFriendRequestPopup(docSnapshot.id, data);
    });
  } catch (error) {
    console.error("Error loading friend requests:", error);
  }
}

function createFriendRequestPopup(requestId, requestData) {
  // Use the user's displayName from the friend request document
  const friendName = requestData.displayName || "A user";
  // Use a default image based on first letter or fallback image
  const photoUrl =
    requestData.photoUrl ||
    `./images/${friendName[0]}.jpeg` ||
    "./default-pic.webp";
  const popupHTML = `
    <div class="friend-request-popup" id="friend-request-${requestId}">
      <img src="${photoUrl}" alt="${friendName}">
      <div class="info">
        <h3>${friendName}</h3>
        <p>wants to be your friend.</p>
      </div>
      <div class="popup-buttons">
        <button class="accept" data-requestid="${requestId}" data-fromuserid="${requestData.fromUserId}" data-friendname="${friendName}" data-photourl="${photoUrl}">Accept</button>
        <button class="decline" data-requestid="${requestId}">Decline</button>
      </div>
    </div>
  `;
  friendRequestsContainer.insertAdjacentHTML("beforeend", popupHTML);
}

// Use event delegation for friend request buttons
friendRequestsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("accept")) {
    const requestId = e.target.getAttribute("data-requestid");
    const fromUserId = e.target.getAttribute("data-fromuserid");
    const friendName = e.target.getAttribute("data-friendname");
    const photoUrl = e.target.getAttribute("data-photourl");
    try {
      await addFriendRelationship(fromUserId, islogin);
      const conversationId = await createConversation(
        fromUserId,
        islogin,
        friendName,
        photoUrl
      );
      openChat(conversationId, friendName, fromUserId, photoUrl);
      await deleteDoc(doc(db, "friendRequests", requestId));
      const popup = document.querySelector(`#friend-request-${requestId}`);
      if (popup) popup.remove();
      loadConversations();
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  } else if (e.target.classList.contains("decline")) {
    const requestId = e.target.getAttribute("data-requestid");
    try {
      await deleteDoc(doc(db, "friendRequests", requestId));
      const popup = document.querySelector(`#friend-request-${requestId}`);
      if (popup) popup.remove();
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  }
});

async function addFriendRelationship(fromUserId, toUserId) {
  try {
    await addDoc(collection(db, "friends"), {
      user1: fromUserId,
      user2: toUserId,
      createdAt: serverTimestamp(),
    });
    console.log("Friend relationship added.");
  } catch (error) {
    console.error("Error adding friend relationship:", error);
  }
}

async function createConversation(user1, user2, friendName, friendPhoto) {
  try {
    const conversationRef = await addDoc(collection(db, "conversations"), {
      participants: [user1, user2],
      friendName: friendName,
      friendPhoto: friendPhoto,
      createdAt: serverTimestamp(),
    });
    console.log("Conversation created with ID:", conversationRef.id);
    return conversationRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
  }
}

// ------------------------------
// 2. Messenger Chat UI & Conversations
// ------------------------------
async function loadConversations() {
  try {
    const convQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", islogin)
    );
    const querySnapshot = await getDocs(convQuery);
    let convHTML = "";
    let count = 0;
    querySnapshot.forEach((convDoc) => {
      const convData = convDoc.data();
      const friendId = convData.participants.find((id) => id !== islogin);
      const friendName = convData.displayName || "Friend";
      const friendPhoto = convData.friendPhoto || "./images/default-pic.webp";
      convHTML += `
        <div class="conversation-item" data-convid="${convDoc.id}" data-friendid="${friendId}" data-friendname="${friendName}" data-friendphoto="${friendPhoto}">
          <img src="${friendPhoto}" alt="${friendName}">
          <div class="name">${friendName}</div>
        </div>
      `;
      count++;
    });
    conversationList.innerHTML = convHTML;
    conversationList.style.display = count > 0 ? "block" : "none";
  } catch (error) {
    console.error("Error loading conversations:", error);
  }
}

// Use event delegation for conversation list clicks
conversationList.addEventListener("click", (e) => {
  const item = e.target.closest(".conversation-item");
  if (item) {
    const conversationId = item.getAttribute("data-convid");
    const friendName = item.getAttribute("data-friendname");
    const friendId = item.getAttribute("data-friendid");
    const friendPhoto = item.getAttribute("data-friendphoto");
    openChat(conversationId, friendName, friendId, friendPhoto);
  }
});

function openChat(conversationId, friendName, friendId, friendPhoto) {
  currentConversationId = conversationId;
  currentFriendId = friendId;
  chatFriendName.textContent = friendName;
  chatFriendPhoto.src = friendPhoto;
  chatContainer.style.display = "flex";
  loadConversationMessages(conversationId);
}

function loadConversationMessages(conversationId) {
  const messagesQuery = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt")
  );
  onSnapshot(messagesQuery, (snapshot) => {
    let messagesHTML = "";
    snapshot.forEach((msgDoc) => {
      const msgData = msgDoc.data();
      messagesHTML += displayMessage(msgData);
    });
    chatMessages.innerHTML = messagesHTML;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function displayMessage(msg) {
  const messageClass = msg.sender === islogin ? "sent" : "received";
  return `
    <div class="message ${messageClass}">
      <div class="text">${msg.text}</div>
    </div>
  `;
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (text && currentConversationId) {
    try {
      await addDoc(
        collection(db, "conversations", currentConversationId, "messages"),
        {
          text: text,
          sender: islogin,
          createdAt: serverTimestamp(),
        }
      );
      messageInput.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}
sendMessageBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Close Chat UI when clicking the close button.
closeChatBtn.addEventListener("click", () => {
  chatContainer.style.display = "none";
  currentConversationId = null;
});

// ------------------------------
// 3. Initial Load: Friend Requests & Conversations
// ------------------------------
loadFriendRequests();
loadConversations();
