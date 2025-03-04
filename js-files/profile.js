import {
  auth,
  setDoc, updateDoc,
  onAuthStateChanged,
  updateProfile,
  signOut,
  query, getDoc,
  collection,
  db,
  where,
  getDocs,
  doc
} from "./logic.js";

let islogin = localStorage.getItem('login');
if (!islogin) {
  window.location.replace('./index.html');
}
console.log(islogin)
document.getElementById("google-signout").addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      localStorage.removeItem('login');
      window.location.replace('./index.html');
    })
    .catch(console.error);
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace('./index.html');
  }
});

// Sidebar toggle functionality
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// Modal functionality for Update Profile
const updateProfileBtn = document.getElementById('update-profile');
const modal = document.getElementById('updateModal');
const modalClose = document.getElementById('modalClose');

updateProfileBtn.addEventListener('click', () => {
  modal.style.display = "flex"; // Using flex for centering via CSS
});

modalClose.addEventListener('click', () => {
  modal.style.display = "none";
});

// Close modal if click outside the modal content
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Update Firestore document using setDoc with merge option
let updateWithFB = async (name, phone) => {
  try {
    const q = query(collection(db, "users"), where("uid", "==", islogin));
    const querySnapshot = await getDocs(q);
    await querySnapshot.forEach((post) => {
      updateDoc(doc(db, "users", post.id), {
        displayName: name,
        phoneNumber: phone
      }, { merge: true });
      console.log("Profile updated successfully! (Firestore)");
    })
  } catch (error) {
    console.error("Error updating profile in Firestore:", error);
  }
}

// Handle profile update button click event
document.getElementById('updateProfileForm').addEventListener('click', async () => {
  const names = document.getElementById('updateName').value;
  const phones = document.getElementById('updatePhone').value;

  // Update Firestore user document
  await updateWithFB(names, phones);

  // Update Firebase Authentication profile (phoneNumber update is not supported)
  try {
    await updateProfile(auth.currentUser, {
      displayName: names,
      phoneNumber: phones,
    });
    console.log("Profile updated successfully! (Auth)");
  } catch (error) {
    console.error("Error updating profile in Auth:", error);
  }

  // Update the frontend immediately with the new values
  document.getElementById('nameValue').innerText = names.toUpperCase();
  document.getElementById('phoneValue').innerText = phones;

  // Close the modal
  modal.style.display = "none";
});

let nameFunc = async () => {
  const q = query(collection(db, "users"), where("uid", "==", islogin));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((post) => {
    document.getElementById('phoUrl').src = post.data().photoURL;
    document.getElementById('nameValue').innerText = post.data().displayName ? post.data().displayName.toUpperCase() : "";
    document.getElementById('phoneValue').innerText = post.data().phoneNumber ? 'phone number: '+post.data().phoneNumber : "";
    document.getElementById('emailValue').innerText = post.data().email ? 'email: '+post.data().email : "";
  });
  nameFunc()
}
nameFunc();
