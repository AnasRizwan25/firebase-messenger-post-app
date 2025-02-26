import { setDoc,onSnapshot, auth, updateDoc, increment, deleteDoc, addDoc, signOut, onAuthStateChanged, query, getDoc, limit, where, collection, db, getDocs, doc } from "./logic.js";

// delPlay();

let allPostDiv = document.querySelector("#postList");
let islogin = localStorage.getItem('login');
// let plays = localStorage.getItem('player');
// console.log(islogin);

if (!islogin) {
  window.location.replace('./index.html');
}

// if (plays) {
//   window.location.replace('./input.html');
// }
// function delPlay() {
//   localStorage.removeItem('player')
// }

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  mainContent.classList.toggle('shifted');
  if (mainContent.classList.contains('shifted')) {
    document.querySelector('.data-pic').style.display = 'none';
  } else {
    document.querySelector('.data-pic').style.display = 'inline';
  }
});


document.querySelector("#google-signout" && "#google-signout1").addEventListener('click', () => {
  signOut(auth).then(() => {
    console.log("logout successfully");
    localStorage.removeItem('login');
    window.location.replace('./index.html');
  }).catch((error) => {
    console.log(error);
  });
});

let checkUser = async () => {
  try {
    await onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
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

let postList = document.getElementById('postList');



let nameFunc = async () => {
  const q = query(collection(db, "users"), where("uid", "==", islogin));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((post) => {
    document.getElementById('userName').innerText = `${post.data().displayName.toUpperCase()}`;

  });
}
// nameFunc()


// userName
// getMyPosts();

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
const getAllPosts = async () => {
  try {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    // Clear the container before appending new posts.
    allPostDiv.innerHTML = "";
    postsSnapshot.forEach((post) => {
      const postData = post.data();
      allPostDiv.innerHTML += `
        <div class="post" id="post-${post.id}">
          <div class="post-title">${postData.displayName}</div>
          <div class="post-title1">${
            postData.postDate
              ? timeSince(postData.postDate.toDate())
              : "No timestamp"
          }</div>
          <div class="post-details">
            <p class="post-iniline">${postData.postTopic}</p>
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

      // Check if the current user has already liked this post.
      const likeStatusQuery = query(
        collection(db, "likes"),
        where("uid", "==", islogin),
        where("postId", "==", post.id)
      );
      getDocs(likeStatusQuery).then((likeSnapshot) => {
        if (!likeSnapshot.empty) {
          const btn = document.getElementById(`like-btn-${post.id}`);
          if (btn) {
            btn.classList.add("liked");
          }
        }
      });

      // Set up a real-time listener to update the like count.
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
    const btn = document.getElementById(`like-btn-${postId}`);

    if (querySnapshot.empty) {
      // If no like exists, add one
      await addDoc(collection(db, "likes"), {
        uid: islogin,
        postId: postId,
        createdAt: new Date()
      });
      // Increment the like counter atomically
      await updateDoc(postRef, {
        likeCount: increment(1)
      });
      console.log("Post liked");
      // Add the "liked" class so the heart icon turns red
      btn.classList.add("liked");
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
      // Remove the "liked" class so the heart icon goes back to gray
      btn.classList.remove("liked");
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};

getAllPosts();

getAllPosts();

document.querySelector('#addPlayerBtn').addEventListener('click', () => {
  let inputValue = document.querySelector('#searchInput').value;
  getPlayer(inputValue.toLowerCase());
});

const modal = document.getElementById('playerModal');
const closeModalButton = document.getElementById('closeModal');
const modalPlayerDetails = document.getElementById('modalPlayerDetails');

// Function to open the modal
const openModal = () => {
  modal.style.display = "block";
};

// Function to close the modal
const closeModal = () => {
  modal.style.display = "none";
};

// Event listener to close the modal when the "X" button is clicked
closeModalButton.addEventListener('click', closeModal);

// Function to fetch player data and display in the modal
let getPlayer = async (text) => {
  try {
    // Clear previous modal content
    modalPlayerDetails.innerHTML = "";

    if (!text.trim()) {
      modalPlayerDetails.innerHTML = "<p>No player found</p>";
      openModal();
      return;
    }

    const q = query(collection(db, "posts"), where("displayName", "==", text));
    const querySnapshot = await getDocs(q);
    modalPlayerDetails.innerHTML = '';

    if (querySnapshot.empty) {
      modalPlayerDetails.innerHTML = "<p>No player found</p>";
    } else {
      querySnapshot.forEach((post) => {
        const playerData = post.data();
        modalPlayerDetails.innerHTML += `<div class="post">
        <div class="post-title">${post.data().displayName}</div>
        <div class="post-title1">${post.data().postDate
            ? timeSince(post.data().postDate.toDate())
            : "No timestamp"
          }</div>
        <div class="post-details">
          <p class="post-iniline">${post.data().postTopic}</p>
          <button id='${post.id}' class='like-btn'>Like</button>
          <p>${post.data().like}</p>
        </div>
      </div>`;
      });
    }

    openModal();
  } catch (error) {
    console.error(error);
    modalPlayerDetails.innerHTML = "<p>An error occurred while fetching player data.</p>";
    openModal();
  }
};

// Handle the "Add Player" button click
document.querySelector('#addPlayerBtn').addEventListener('click', () => {
  let inputValue = document.querySelector('#searchInput').value;
  getPlayer(inputValue.toLowerCase());
});