import {
  setDoc,
  onSnapshot,
  auth,
  updateDoc,
  increment,
  deleteDoc,
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

let allPostDiv = document.querySelector("#postList");
let islogin = localStorage.getItem("login");

if (!islogin) {
  window.location.replace("./index.html");
}

// Sidebar and signout logic (unchanged)
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const mainContent = document.querySelector(".main-content");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  mainContent.classList.toggle("shifted");
  if (mainContent.classList.contains("shifted")) {
    document.querySelector(".data-pic").style.display = "none";
  } else {
    document.querySelector(".data-pic").style.display = "inline";
  }
});

document.querySelector("#google-signout" && "#google-signout1").addEventListener("click", () => {
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

let checkUser = async () => {
  try {
    await onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user);
      } else {
        console.log("signed out");
      }
    });
  } catch (error) {
    console.error(error);
  }
};

checkUser();

// Helper function to format time since a date
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1)
    return interval + " year" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1)
    return interval + " month" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1)
    return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1)
    return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
  return Math.floor(seconds) + " seconds ago";
}

const getAllPosts = async () => {
  try {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    allPostDiv.innerHTML = ""; // Clear the container before appending new posts

    postsSnapshot.forEach((post) => {
      const postData = post.data();
      // Only show the Add button if this post does not belong to the current user
      let addButtonHtml = "";
      if (postData.uid !== islogin) {
        addButtonHtml = `
          <button class="add-btn" data-friendid="${postData.uid}">
            <img width="20" src="./images/single-person-add.png" alt="Add Person">
            <span>Add</span>
          </button>
        `;
      }

      // Build the post HTML
      const postHtml = `
        <div class="post" id="post-${post.id}">
          <div class="post-title">
            <div>${postData.displayName}</div>
            <div class="add-button-container">
              ${addButtonHtml}
            </div>
          </div>
          <div class="post-title1">${
            postData.postDate
              ? timeSince(postData.postDate.toDate())
              : "No timestamp"
          }</div>
          <div class="post-details">
            <p class="post-inline">${postData.postTopic}</p>
            <button class="like-btn" id="like-btn-${post.id}" onclick="likePost('${post.id}')">
              <svg class="heart-icon" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                         2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 
                         3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
                         6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="like-count" id="likeCount-${post.id}">${
        postData.likeCount || 0
      }</span>
            </button>
          </div>
        </div>`;

      allPostDiv.innerHTML += postHtml;

      // Set up a real-time listener for like count updates
      const postRef = doc(db, "posts", post.id);
      onSnapshot(postRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const likeCountElement = document.getElementById(`likeCount-${post.id}`);
          if (likeCountElement) {
            likeCountElement.innerText = data.likeCount || 0;
          }
        }
      });
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
};

// Use event delegation to capture clicks on any "Add" button within the posts container
allPostDiv.addEventListener("click", (e) => {
  const addBtn = e.target.closest("button.add-btn");
  if (addBtn) {
    const friendId = addBtn.getAttribute("data-friendid");
    if (friendId) {
      sendFriendRequest(friendId);
    }
  }
});
let sendFriendRequest = async (friendperson) => {
  try {
    // Check if a friend request has already been sent
    const existingRequestQuery = query(
      collection(db, "friendRequests"),
      where("fromUserId", "==", islogin),
      where("toUserId", "==", friendperson)
    );
    const existingSnapshot = await getDocs(existingRequestQuery);
    if (!existingSnapshot.empty) {
      console.log("Friend request already sent");
      return;
    }

    // Get the current user's displayName and photoUrl from the "users" collection
    const userQuery = query(
      collection(db, "users"),
      where("uid", "==", islogin)
    );
    const userSnapshot = await getDocs(userQuery);
    let displayName = "";
    let photoUrl = "";
    userSnapshot.forEach((doc) => {
      const data = doc.data();
      displayName = data.displayName;
      // Use a default photo URL if none is found
      photoUrl = data.photoURL|| "./images/default-pic.webp";
    });

    // Create the new friend request document
    const docRef = await addDoc(collection(db, "friendRequests"), {
      fromUserId: islogin,
      toUserId: friendperson,
      status: "pending",
      displayName: displayName,
      photoUrl: photoUrl
    });
    console.log("Friend request sent. Document ID:", docRef.id);
  } catch (error) {
    console.error("Error adding friend request document:", error);
  }
};



window.likePost = async (postId) => {
  try {
    const likesQuery = query(
      collection(db, "likes"),
      where("uid", "==", islogin),
      where("postId", "==", postId)
    );
    const querySnapshot = await getDocs(likesQuery);
    const postRef = doc(db, "posts", postId);
    const btn = document.getElementById(`like-btn-${postId}`);

    if (querySnapshot.empty) {
      await addDoc(collection(db, "likes"), {
        uid: islogin,
        postId: postId,
        createdAt: new Date(),
      });
      await updateDoc(postRef, {
        likeCount: increment(1),
      });
      btn.classList.add("liked");
    } else {
      querySnapshot.forEach(async (likeDoc) => {
        await deleteDoc(doc(db, "likes", likeDoc.id));
      });
      await updateDoc(postRef, {
        likeCount: increment(-1),
      });
      btn.classList.remove("liked");
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};

getAllPosts();
