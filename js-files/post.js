import { auth,onSnapshot, increment, signOut,serverTimestamp, onAuthStateChanged, query,where, getDoc, deleteDoc, updateDoc, collection, addDoc, db, getDocs, doc } from "./logic.js";

// Initial setup
document.getElementById('userName').innerText = 'username';
let allPostDiv = document.querySelector("#postList");
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');

// Check login state
let islogin = localStorage.getItem('login');
if (!islogin) {
  window.location.replace('./index.html');
}

// Sidebar toggle functionality
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  mainContent.classList.toggle('shifted');
});

// Define selectedPostId globally at the top
let selectedPostId = null;
console.log(selectedPostId)

window.openEditModal = async (post_id) => {
  // Get the post data
  // console.log(post_id)
  const postRef = doc(db, "posts", post_id);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists()) {
    const postData = postSnap.data();

    // Set the selected post id
    selectedPostId = post_id;  // Now this is properly initialized

    // Populate modal with existing data
    document.getElementById("editTopic").value = postData.postTopic;
    document.getElementById("editDescription").value = postData.postText;

    // Show the modal
    document.getElementById("editModal").style.display = "flex";
  }
};


// Handle sign-out
document.querySelector("#google-signout").addEventListener('click', () => {
  signOut(auth).then(() => {
    console.log("Logout successful");
    localStorage.removeItem('login');
    localStorage.removeItem('player');
    window.location.replace('./index.html');
  }).catch((error) => {
    console.error(error);
  });
});

// Check if user is authenticated
const checkUserAuth = async () => {
  try {
    await onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User authenticated:", user.uid);
      } else {
        console.log("User signed out");
      }
    });
  } catch (error) {
    console.error("Authentication error:", error);
  }
};

checkUserAuth();

// Get posts and display them
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
  return Math.floor(seconds) + " seconds ago";
}

// Update getMyPosts to display a relative timestamp for each post
const getMyPosts = async () => {
  try {
    const q = query(collection(db, "posts"), where("uid", "==", islogin));
    const querySnapshot = await getDocs(q);
    let postsHTML = '';

    querySnapshot.forEach((post) => {
      const postData = post.data();
      let timeString = "";
      // If postDate exists and is a Firestore Timestamp, convert it to Date and compute relative time
      if (postData.postDate && postData.postDate.toDate) {
        timeString = timeSince(postData.postDate.toDate());
      }
      postsHTML += createPostHTML(post.id, postData, timeString);
      console.log(post.id)
    });

    allPostDiv.innerHTML = postsHTML;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
};
const setupRealtimeLikeListener = (postId) => {
  const postRef = doc(db, "posts", postId);
  onSnapshot(postRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const likeCount = data.likeCount || 0;
      const likeCountElement = document.getElementById(`likeCount-${postId}`);
      if (likeCountElement) {
        likeCountElement.innerText = likeCount;
      }
    }
  });
};

// Generate HTML for each post
const createPostHTML = (id, data, timeString) => {
  return `
    <div class="post" id="${id}">
      <div class="post-title">${data.displayName} </div>
      <div class="post-title1">${timeString}</div>
      <div class="post-details">
        <p>${data.postTopic}</p>
        <button class="update-btn" onclick="openEditModal('${id}')">Edit</button>
        <button class="delete-btn" onclick="deletePost('${id}')">Delete</button>
        <button class='like-btn' onclick="likePost('${id}')">Like</button>
        <span class="like-count" id="likeCount-${id}">${data.likeCount || setupRealtimeLikeListener(id)}</span>
      </div>
    </div>`;
};


window.likePost = async (postId) => {
  try {
    // Query the "likes" collection for an existing like by the current user for the post
    const likesQuery = query(
      collection(db, "likes"),
      where("uid", "==", islogin),
      where("postId", "==", postId)
    );
    const querySnapshot = await getDocs(likesQuery);

    // Reference to the post document to update the like counter
    const postRef = doc(db, "posts", postId);

    if (querySnapshot.empty) {
      // If no like exists, add one
      await addDoc(collection(db, "likes"), {
        uid: islogin,
        postId: postId,
        createdAt: new Date()
      });
      // Increment the like counter automically
      await updateDoc(postRef, {
        likeCount: increment(1)
      });
      console.log("Post liked");
    } else {
      // If the like exists, remove it (toggle off)
      querySnapshot.forEach(async (likeDoc) => {
        await deleteDoc(doc(db, "likes", likeDoc.id));
      });
      // Decrement the like counter atomically
      await updateDoc(postRef, {
        likeCount: increment(-1)
      });
      console.log("Post unliked");
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};


// Open Edit Modal
window.openEditModal = async (post_id) => {
  const postRef = doc(db, "posts", post_id);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data();
    document.getElementById("editTopic").value = postData.postTopic;
    selectedPostId = post_id;
    document.getElementById("editModal").style.display = "flex";
  }
};

// Close Modal
window.closeModal = () => {
  document.getElementById("editModal").style.display = "none";
};

// Handle Form Submission for Editing Posts
document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newTopic = document.getElementById("editTopic").value;

  if (newTopic.length < 6 ) {
    alert("Both fields must contain at least 6 characters.");
    return;
  }

  try {
    await updateDoc(doc(db, "posts", selectedPostId), { postTopic: newTopic});
    console.log("Post updated successfully!");
    getMyPosts();  // Refresh posts
    closeModal();
  } catch (error) {
    console.error("Error updating post:", error);
  }
});

// Delete Post
window.deletePost = async (post_id) => {
  if (confirm("Are you sure you want to delete this post?")) {
    try {
      await deleteDoc(doc(db, "posts", post_id));
      document.getElementById(post_id).remove();
      console.log("Post deleted successfully!");
      getMyPosts();  // Refresh posts
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }
};



// Create a Post and Update Frontend
let createPost = async (Topic) => {
  try {
    const name = await getDisplayName(islogin);
    
    // Add a new post with a server timestamp for postDate
    const docRef = await addDoc(collection(db, "posts"), {
      postDate: serverTimestamp(),  // Timestamp added here
      displayName: name.toLowerCase(),
      postTopic: Topic,
      uid: islogin,
    });
    const docRef1 = await addDoc(collection(db, "likes"), {
      uid: islogin,
    });
    console.log("Document written with ID:", docRef.id);
    getMyPosts();  // Refresh posts after creating a new one
  } catch (error) {
    console.error("Error creating post:", error);
  }
};

// Get Display Name of Logged-In User
const getDisplayName = async (uid) => {
  const q = query(collection(db, "users"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  let name = '';
  querySnapshot.forEach((doc) => {
    name = doc.data().displayName;
  });
  return name;
};

// Add Player Button Click Handler
document.getElementById("addPlayerBtn").addEventListener("click", () => {
  const searchInput1 = document.getElementById("searchInput1").value;
  const error1 = document.getElementById("error1");

  error1.style.display = "none";

  if (searchInput1.length < 6) {
    error1.style.display = "block";
  }


  if (searchInput1.length >= 6 ) {
    createPost(searchInput1);
  }
});

// Load posts on page load
getMyPosts();
